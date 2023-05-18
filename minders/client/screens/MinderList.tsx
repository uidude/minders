import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useComponents} from '@toolkit/ui/components/Components';
import {Screen} from '@toolkit/ui/screen/Screen';
import {Filters, OutlineView, filterFor} from '@app/AppLayout';
import {ActionMenu, VerticalDots} from '@app/components/ActionMenu';
import {useMinderActions} from '@app/components/Actions';
import {EditableStatusM} from '@app/components/EditableStatus';
import {MinderTextInput} from '@app/components/MinderTextInput';
import {
  Minder,
  MinderProject,
  MinderUiState,
  isVisible,
  parentsOf,
  useDataListen,
  useLiveData,
  useMinderStore,
} from '@app/model/Minders';
import {OutlineItemVisibilityFilter} from '@app/model/outliner';
import MinderOutline from '../components/MinderOutline';

export function NoChildren(props: {
  project: MinderProject;
  filter: OutlineItemVisibilityFilter;
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
 * Show a flat list of all outline items with a given top-level parent.
 */
export function MinderListItem(props: {
  minder: Minder;
  parents: Minder[];
  prev?: Minder;
  style?: StyleProp<ViewStyle>;
}) {
  const {minder, parents, prev, style} = props;
  // const outliner = useOutliner();
  // OutlineUtil.useRedrawOnItemUpdate(item.id);
  //useWatchData(Minder, [minder.id]);
  const {Snooze, Bump, Mover, Delete} = useMinderActions(minder);

  return (
    <>
      <View style={[S.listItem, style]}>
        <EditableStatusM size={18} minder={minder} style={S.indicator} />

        <View style={S.textContainer}>
          <MinderTextInput minder={minder} prev={prev} />
          <ParentPath minder={minder} parents={parents} />
        </View>
        <View>
          <ActionMenu
            items={[Snooze, Bump, Mover, Delete]}
            anchor={onPress => (
              <VerticalDots style={S.actionsR} onPress={onPress} />
            )}
          />
        </View>
      </View>
    </>
  );
}

type ParentPathProps = {
  parents: Minder[];
  minder: Minder;
};
/**
 * Component for rendering parent path of a Minder.
 * Separate component to localize re-rendering when parents change.
 */
export function ParentPath(props: ParentPathProps) {
  const {parents, minder} = props;
  const liveParents = useLiveData(Minder, parents);

  //const parentKeys = parents.map(p => p.id);
  //useWatchData(Minder, parentKeys);

  let path = minder.project!.name;
  for (const parent of liveParents) {
    path += ' : ' + parent.text;
  }
  return <Text style={S.parent}>{path}</Text>;
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
  top?: string;
  project?: string;
  view?: OutlineView;
  async: {
    project: MinderProject;
    minders: Minder[];
    uiState: MinderUiState;
  };
};

const MinderList: Screen<Props> = props => {
  const {view = 'focus', project: projectId} = props;
  if (view === 'outline' || view === 'outlineall') {
    return <MinderOutlineList {...props} />;
  }
  return <MinderFlatList {...props} />;
};

const MinderOutlineList: Screen<Props> = props => {
  const {view = 'focus', project: projectId} = props;
  requireLoggedInUser();
  const filter = filterFor(view);
  const {project} = props.async;
  const [minders, setMinders] = React.useState(props.async.minders);
  const minderStore = useMinderStore();
  useDataListen(Minder, ['*'], onMinderChange);

  async function onMinderChange() {
    // TODO: Only do this on add / delete
    // TODO: Prevent reload cascades
    const {projects: newProjects} = await minderStore.getAll();
    const project = newProjects.find(p => p.id === projectId) ?? newProjects[0];
    const newMinders = project.minders?.filter(m => isVisible(m, filter)) ?? [];
    //const newMinders = keepOrder(filtered, minders);
    setMinders(newMinders);
  }

  /** const topItem = outlineState.focusItem; **/
  const topChildren = minders.filter(m => m.parentId == null);

  /* OutlineUtil.useRedrawOnItemUpdate(topItem.id); */

  if (topChildren.length === 0) {
    return <NoChildren project={project} filter={filter} />;
  }

  return (
    <View style={{flex: 1}}>
      {topChildren.map((minder, idx) => (
        <MinderOutline
          minder={minder}
          key={minder.id}
          prev={topChildren[idx - 1]}
          filter={filter}
        />
      ))}
    </View>
  );
};

const MinderFlatList: Screen<Props> = props => {
  requireLoggedInUser();
  const {view = 'focus', project: projectId} = props;
  const {project} = props.async;
  const {Button} = useComponents();
  const minderStore = useMinderStore();
  const [minders, setMinders] = React.useState(props.async.minders);
  const filter = filterFor(view);
  const prevFilter = React.useRef(filter);
  const prevProjectId = React.useRef(projectId);
  useDataListen(Minder, ['*'], onMinderChange);

  if (prevFilter.current !== filter || prevProjectId.current !== projectId) {
    prevFilter.current = filter;
    prevProjectId.current = projectId;
    setTimeout(() => setMinders(props.async.minders), 0);
  }

  async function onMinderChange() {
    // TODO: Only do this on add / delete
    // TODO: Prevent reload cascades
    const {projects: newProjects} = await minderStore.getAll();
    const project = newProjects.find(p => p.id === projectId) ?? newProjects[0];
    const filtered = project.minders?.filter(m => isVisible(m, filter)) ?? [];
    const newMinders = keepOrder(filtered, minders);
    setMinders(newMinders);
  }

  /*
    TODO:
    - Get better keepOrder logic than previously, so it works in list view
    - Add add / delete params to listen API
    - Only trigger on add / delete
  */

  if (minders.length === 0) {
    return <NoChildren project={project} filter={filter} />;
  }

  async function testUpdate() {
    setTimeout(async () => {
      const id = 'minder:88a3db25-bd36-45a9-a05c-dfd2bc6551e2';
      const minder = await minderStore.get(id);
      if (minder) {
        await minderStore.update(minder, {text: minder.text + '!'});
      }
    }, 500);
  }

  return (
    <View>
      {minders.map((minder, idx) => (
        <MinderListItem
          minder={minder}
          parents={parentsOf(minder)}
          prev={minders[idx - 1]}
          key={minder.id}
          style={idx % 2 == 1 && S.odd}
        />
      ))}
      <Button
        style={{alignSelf: 'flex-end', marginTop: 20, marginRight: 20}}
        onPress={testUpdate}>
        Test update
      </Button>
    </View>
  );
};
MinderList.title = 'Minders';
MinderList.id = 'MinderList';

MinderList.load = async props => {
  const {view = 'focus'} = props;
  const minderStore = useMinderStore();
  const {projects, uiState} = await minderStore.getAll();
  const projectId = `minderProject:${props.project}`;
  const project = projects.find(p => p.id === projectId) ?? projects[0];
  const filter = filterFor(view);
  const minders = project.minders?.filter(m => isVisible(m, filter)) ?? [];

  return {project, minders, uiState};
};

export default MinderList;

function getFontFamily() {
  return Platform.select({
    ios: 'Futura',
    android: 'Roboto',
    web: 'Roboto, Arial',
  });
}

const S = StyleSheet.create({
  listItem: {
    padding: 5,
    flexWrap: 'nowrap',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  odd: {
    backgroundColor: '#F0F0F0',
  },
  listItemTitle: {
    fontFamily: getFontFamily(),
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
  },
  parent: {
    fontSize: 10,
    opacity: 0.5,
  },
  listItemDescription: {
    fontFamily: getFontFamily(),
    paddingTop: 4,
    fontSize: 13,
    fontWeight: 'bold',
    opacity: 0.75,
  },
  indicator: {
    opacity: 0.4,
    /* marginVertical: 12,*/
  },
  actionsR: {
    opacity: 0.4,
    marginHorizontal: 0,
    marginLeft: -6,
    marginRight: 6,
  },
  textContainer: {
    flexBasis: 50,
    flexGrow: 1,
    paddingLeft: 2,
  },
});
