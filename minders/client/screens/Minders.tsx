import React from 'react';
import {Text, View} from 'react-native';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {DataOp} from '@toolkit/data/DataCache';
import {useListen} from '@toolkit/data/DataStore';
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
import {useLoad, withLoad} from '@app/util/UseLoad';

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

/**
 * Reorder minders to match order in oldMinders, with newItems at the end.
 *
 * This ensures that UI updates that add / remove items don't move items around while
 * the user is watching, even if the order isn't the natural sort order.
 *
 * Example 1: New items end up at end of the list, instead of the top
 * (although we could put them on top)
 *
 * Example 2: When changing state, we don't reorder the list while you're looking,
 * even if the list is ordered by state. It will be reordered the next time you
 * come back to the screen.
 */
function keepOrder(minders: Minder[], oldMinders: Minder[]) {
  const ordered: Minder[] = [];

  const newIds = minders.map(m => m.id);
  for (const oldMinder of oldMinders) {
    if (newIds.includes(oldMinder.id)) {
      ordered.push(oldMinder);
    }
  }

  const orderedIds = ordered.map(m => m.id);
  for (const newMinder of minders) {
    if (!orderedIds.includes(newMinder.id)) {
      ordered.push(newMinder);
    }
  }

  return ordered;
}

type Props = {
  top: string;
  view: MinderView;
};

const Minders: Screen<Props> = withLoad(props => {
  const {view = 'focus', top} = props;

  React.useEffect(() => {
    saveUiState();
  }, [view, top]);
  saveLatestUiState;

  if (view === 'outline' || view === 'outlineall') {
    return <MinderOutlineList {...props} />;
  }
  return <MinderList {...props} />;

  async function saveUiState() {
    const uiState = await getSavedUiState();
    if (uiState?.top !== top || uiState?.view !== view) {
      await saveLatestUiState({top, view});
    }
  }
});

const MinderOutlineList: Screen<Props> = props => {
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
