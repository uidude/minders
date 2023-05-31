import React from 'react';
import {
  Animated,
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
import {Filters, OutlineView, filterFor} from '@app/AppLayout';
import {
  Minder,
  MinderFilter,
  MinderProject,
  Top,
  flatList,
  isVisible,
  minderSort,
  parentsOf,
  useLiveData,
  useMinderStore,
} from '@app/common/MinderApi';
import {ActionMenu, VerticalDots} from '@app/components/ActionMenu';
import {useMinderActions} from '@app/components/Actions';
import {EditableStatus} from '@app/components/EditableStatus';
import {MinderTextInput} from '@app/components/MinderTextInput';
import {requestSelect} from '@app/model/TextSelect';
import {useLoad} from '@app/util/UseLoad';

type Props = {
  top: string;
  view: OutlineView;
};

export function MinderList(props: Props) {
  requireLoggedInUser();
  const {view, top: topId} = props;
  const minderStore = useMinderStore();
  const filter = filterFor(view);
  const {project, top, minders, setData} = useLoad(props, load);
  const {removeAnimation, animatedStyles} = useMinderRemoveAnimation();

  useListen(Minder, '*', onMinderChange);

  /*
    TODO:
    - Get better keepOrder logic than previously, so it works in list view
  */

  if (minders.length === 0) {
    return <NoChildren project={project} filter={filter} />;
  }

  function animtedStyleFor(id: string) {
    return animatedStyles[id] ?? {};
  }

  return (
    <View>
      {minders.map((minder, idx) => (
        <Animated.View key={minder.id} style={animtedStyleFor(minder.id)}>
          <MinderListItem
            minder={minder}
            parents={parentsOf(minder)}
            prev={minders[idx - 1]}
            style={idx % 2 == 1 && S.odd}
            top={top}
          />
        </Animated.View>
      ))}
    </View>
  );

  async function load() {
    const {project, top} = await minderStore.getAll(topId);
    top.children.sort(minderSort);
    const minders = flatList(top.children, filter).sort(minderSort);
    return {project, minders, top};
  }

  function removeMinder(id: string) {
    if (animatedStyles[id] ?? !minders.find(m => m.id === id)) {
      return;
    }
    removeAnimation(id, () => {
      const updated = minders.filter(m => m.id !== id);
      setData({minders: updated});
    });
  }

  async function onMinderChange(id: string, op: DataOp) {
    const newValue = await minderStore.get(id);
    let updated = minders;

    if (op === 'remove') {
      removeMinder(id);
      return;
    } else if (op === 'update' && newValue) {
      // Note that this doesn't cover project / top changes yet
      if (isVisible(newValue, filter)) {
        minders[minders.findIndex(m => m.id === id)] = newValue;
      } else {
        removeMinder(id);
        return;
      }
    } else if (op === 'add' && newValue) {
      if (isVisible(newValue, filter) && !minders.find(m => m.id === id)) {
        updated = [...minders, newValue];
        requestSelect(newValue.id, 'start');
      }
    }
    setData({minders: updated});
  }
}

type MinderListItemProps = {
  minder: Minder;
  parents: Minder[];
  prev?: Minder;
  style?: StyleProp<ViewStyle>;
  top: Top;
};

function MinderListItem(props: MinderListItemProps) {
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

function NoChildren(props: {project: MinderProject; filter: MinderFilter}) {
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

function getFontFamily() {
  return Platform.select({
    ios: 'Futura',
    android: 'Roboto',
    web: 'Roboto, Arial',
  });
}

function useMinderRemoveAnimation() {
  // Minders that are in process of being removed from UI
  const [animatedStyles, setAnimated] = React.useState<
    Record<string, {opacity: Animated.Value; height: Animated.Value}>
  >({});

  function removeAnimation(id: string, onRemoved: () => void) {
    const opacity = new Animated.Value(1);
    const height = new Animated.Value(49);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0.1,
        duration: 1100,
        useNativeDriver: false,
      }),
      Animated.timing(height, {
        toValue: 0,
        duration: 300,
        delay: 800,
        useNativeDriver: false,
      }),
    ]).start(() => {
      delete animatedStyles[id];
      setAnimated(styles => {
        delete styles[id];
        return styles;
      });
      onRemoved();
    });
    setAnimated({...animatedStyles, [id]: {opacity, height}});
  }

  return {removeAnimation, animatedStyles};
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
