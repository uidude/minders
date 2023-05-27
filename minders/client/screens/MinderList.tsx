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
import {DataOp} from '@toolkit/data/DataCache';
import {useListen} from '@toolkit/data/DataStore';
import {Screen} from '@toolkit/ui/screen/Screen';
import {Filters, OutlineView, filterFor} from '@app/AppLayout';
import {
  Minder,
  MinderFilter,
  MinderProject,
  Top,
  filterVisibleChildren,
  flatList,
  isVisible,
  minderSort,
  parentsOf,
  useLiveData,
  useMinderStore,
} from '@app/common/Minders';
import {ActionMenu, VerticalDots} from '@app/components/ActionMenu';
import {useMinderActions} from '@app/components/Actions';
import {EditableStatus} from '@app/components/EditableStatus';
import MinderOutline from '@app/components/MinderOutline';
import {MinderTextInput} from '@app/components/MinderTextInput';
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

type MinderListItemProps = {
  minder: Minder;
  parents: Minder[];
  prev?: Minder;
  style?: StyleProp<ViewStyle>;
  top: Top;
};

/**
 * Show a flat list of all outline items with a given top-level parent.
 */
export function MinderListItem(props: MinderListItemProps) {
  const {minder, parents, prev, style, top} = props;
  const minderStore = useMinderStore();
  // const outliner = useOutliner();
  // OutlineUtil.useRedrawOnItemUpdate(item.id);
  //useWatchData(Minder, [minder.id]);
  const {Snooze, Bump, Mover, Delete} = useMinderActions(minder);

  return (
    <>
      <View style={[S.listItem, style]}>
        <EditableStatus size={18} minder={minder} style={S.indicator} />

        <View style={S.textContainer}>
          <MinderTextInput minder={minder} prev={prev} />
          <ParentPath top={top} parents={parents} />
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
  top: Top;
  parents: Minder[];
};

/**
 * Component for rendering parent path of a Minder.
 * Separate component to localize re-rendering when parents change.
 */
export function ParentPath(props: ParentPathProps) {
  const {top, parents} = props;
  const liveParents = useLiveData(Minder, parents);

  //const parentKeys = parents.map(p => p.id);
  //useWatchData(Minder, parentKeys);

  let path = top.text;
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
  top: string;
  view: OutlineView;
};

const MinderList: Screen<Props> = withLoad(props => {
  const {view = 'focus'} = props;
  if (view === 'outline' || view === 'outlineall') {
    return <MinderOutlineList {...props} />;
  }
  return <MinderFlatList {...props} />;
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

const MinderFlatList: Screen<Props> = props => {
  requireLoggedInUser();
  const {view, top: topId} = props;
  const minderStore = useMinderStore();
  const filter = filterFor(view);
  const {project, top, minders, setData} = useLoad(props, load);

  useListen(Minder, '*', onMinderChange);

  /*
    TODO:
    - Get better keepOrder logic than previously, so it works in list view
  */

  if (minders.length === 0) {
    return <NoChildren project={project} filter={filter} />;
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
          top={top}
        />
      ))}
    </View>
  );

  async function load() {
    const {project, top} = await minderStore.getAll(topId);
    top.children.sort(minderSort);
    const minders = flatList(top.children, filter).sort(minderSort);
    return {project, minders, top};
  }

  async function onMinderChange(id: string, op: DataOp) {
    const newValue = await minderStore.get(id);
    let updated = minders;

    if (op === 'remove') {
      updated = minders.filter(m => m.id !== id);
    } else if (op === 'update' && newValue) {
      // Note that this doesn't cover project / top changes yet
      if (isVisible(newValue, filter)) {
        minders[minders.findIndex(m => m.id === id)] = newValue;
      } else {
        updated = minders.filter(m => m.id !== id);
        // Note: Might be nice to have it fade out...
      }
    } else if (op === 'add' && newValue) {
      if (isVisible(newValue, filter) && !minders.find(m => m.id === id)) {
        updated = [...minders, newValue];
        requestSelect(newValue.id, 'start');
      }
    }
    setData({minders: updated});
  }
};
MinderList.title = 'Minders';
MinderList.id = 'MinderList';

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
