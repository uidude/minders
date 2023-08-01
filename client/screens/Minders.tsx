import React from 'react';
import {Text, View} from 'react-native';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {Opt} from '@toolkit/core/util/Types';
import {useLoad, withLoad} from '@toolkit/core/util/UseLoad';
import {DataOp} from '@toolkit/data/DataCache';
import {useDataStore} from '@toolkit/data/DataStore';
import {useListen} from '@toolkit/data/Subscribe';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {
  Filters,
  MinderView,
  filterFor,
  getSavedUiState,
  saveLatestUiState,
} from '@app/AppLayout';
import {
  Minder,
  MinderFilter,
  MinderProject,
  filterVisibleChildren,
  useMinderStore,
} from '@app/common/MinderApi';
import {NewItem} from '@app/components/Actions';
import {MinderList} from '@app/components/MinderList';
import MinderOutline from '@app/components/MinderOutline';
import {requestSelect} from '@app/model/TextSelect';

export function NoChildren(props: {
  project: MinderProject;
  filter: MinderFilter;
}) {
  const {project, filter} = props;

  return (
    <View style={{margin: 30}}>
      <Text>
        {project.minders!.length} items in "{project.name}" project, but none of
        them are visible in {Filters.get(filter)?.label}.
      </Text>
    </View>
  );
}

type Props = {
  top?: string;
  view?: MinderView;
};

const Minders: Screen<Props> = props => {
  const {view = 'focus', top} = props;

  React.useEffect(() => {
    if (top != null && view != null) {
      saveUiState();
    }
  }, [view, top]);

  if (top == null || view == null) {
    return <Redirector {...props} />;
  }

  if (view === 'outline' || view === 'outlineall') {
    return <MinderOutlineList {...props} top={top} view={view} />;
  }
  return <MinderList {...props} top={top} view={view} />;

  async function saveUiState() {
    const uiState = await getSavedUiState();
    if (uiState?.top !== top || uiState?.view !== view) {
      await saveLatestUiState({top, view});
    }
  }
};

/**
 * Need to set top and view if not in URL params
 */
const Redirector = (props: Props) => {
  const nav = useNav();
  const user = requireLoggedInUser();
  const minderStore = useMinderStore();
  const projectStore = useDataStore(MinderProject);
  const {top, view} = useLoad(props, load);

  React.useEffect(() => {
    nav.setParams({top, view});
  }, [top, view]);

  async function load() {
    let uiState = await getSavedUiState();
    const view = uiState?.view ?? 'focus';
    let top: Opt<string> = uiState?.top;

    if (top != null) {
      const projectId = top.replace('>', ':');
      // Make sure the project exists
      // This will cache the data so it ends up being same amount of time to load
      const project = await projectStore.get(projectId);
      if (project == null) {
        top = null; // This will trigger logic to get first project ID
      }
    }

    if (top == null) {
      const projects = await minderStore.getProjects();
      if (projects.length === 0) {
        const project = await projectStore.create({
          name: 'First Project',
          owner: {id: user.id},
        });
        project.minders = [];
        top = project.id;
      } else {
        top = projects[0].id;
      }
    }

    top = top.replace(':', '>');
    return {top, view};
  }

  return <View />;
};

const MinderOutlineList: Screen<Required<Props>> = props => {
  requireLoggedInUser();
  const {view, top: topId} = props;
  const filter = filterFor(view);
  const minderStore = useMinderStore();
  const {project, top, setData} = useLoad(props, load);
  useListen(Minder, '*', onMinderChange);

  filterVisibleChildren(top, filter);
  async function onMinderChange(id: string, op: DataOp) {
    // TODO: Consider modifying existing tree instead of reloading
    const {top: newTop} = await minderStore.getAll(topId);
    setData({top: newTop});
    if (op === 'add') {
      requestSelect(id, 'start');
    }
  }

  if (top.children.length === 0) {
    return <NoChildren project={project} filter={filter} />;
  }

  return (
    <View style={{flex: 1}}>
      {top.children.map((minder, idx) => (
        <MinderOutline
          minder={minder}
          project={project}
          key={minder.id}
          prev={top.children[idx - 1]}
          filter={filter}
        />
      ))}
    </View>
  );

  async function load() {
    const {project, top} = await minderStore.getAll(topId);
    return {project, top};
  }
};

Minders.title = 'Minders';
Minders.id = 'Minders';
// Use deferred load to avoid initialization issues
Minders.mainAction = () => NewItem;

export default Minders;
