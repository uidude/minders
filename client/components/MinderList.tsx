import React from 'react';
import {
  Animated,
  FlatList,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useAction} from '@toolkit/core/client/Action';
import {Opt} from '@toolkit/core/util/Types';
import {useLoad} from '@toolkit/core/util/UseLoad';
import {DataOp} from '@toolkit/data/DataCache';
import {useListen} from '@toolkit/data/Subscribe';
import {useComponents} from '@toolkit/ui/components/Components';
import {Filters, MinderView, filterFor} from '@app/AppLayout';
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
import {useGlobalActions, useMinderActions} from '@app/components/Actions';
import {EditableStatus} from '@app/components/EditableStatus';
import {MinderTextInput} from '@app/components/MinderTextInput';
import {requestSelect} from '@app/model/TextSelect';
import {timelog, useSetPageTitle} from '@app/util/Useful';

type Props = {
  top: string;
  view: MinderView;
};

export function MinderList(props: Props) {
  requireLoggedInUser();
  const {view, top: topId} = props;
  const minderStore = useMinderStore();
  const filter = filterFor(view);
  const {project, top, minders, setData} = useLoad(props, load);
  const {removeAnimation, animatedStyles} = useMinderRemoveAnimation();
  const setPageTitle = useSetPageTitle();
  const [itemHeight, setItemHeight] = React.useState(49);
  const {Refresh} = useGlobalActions();
  const [refresh, refreshing] = useAction(Refresh.action);
  useListen(Minder, '*', onMinderChange);

  setPageTitle(project.name);

  if (minders.length === 0) {
    return <NoChildren project={project} filter={filter} />;
  }

  function animtedStyleFor(id: string) {
    return animatedStyles[id] ?? {};
  }

  function getItemLayout(_: Opt<Minder[]>, index: number) {
    return {length: itemHeight, offset: itemHeight * index, index};
  }

  function checkItemHeight(e: LayoutChangeEvent, idx: number) {
    // Only resize based on first list item
    if (idx === 0) {
      setItemHeight(e.nativeEvent.layout.height);
    }
  }

  return (
    <FlatList
      data={minders}
      initialNumToRender={40}
      getItemLayout={getItemLayout}
      onRefresh={refresh}
      refreshing={refreshing}
      renderItem={({item: minder, index}) => (
        <Animated.View
          onLayout={e => checkItemHeight(e, index)}
          style={animtedStyleFor(minder.id)}>
          <MinderListItem
            minder={minder}
            project={project}
            parents={parentsOf(minder)}
            prev={minders[index - 1]}
            style={index % 2 == 1 && S.odd}
            top={top}
          />
        </Animated.View>
      )}
    />
  );

  async function load() {
    const t0 = Date.now();
    const limit = Platform.OS === 'android' ? 500 : null;
    const {project, top} = await minderStore.getAll(topId, filter, limit);
    top.children.sort(minderSort);
    const minders = flatList(top.children, filter).sort(minderSort);
    console.log('load', Date.now() - t0);
    return {project, minders, top};
  }

  function removeMinder(id: string) {
    if (animatedStyles[id] ?? !minders.find(m => m.id === id)) {
      return;
    }
    // Trigger an initial re-render to pick up new selection
    setData({minders: [...minders]});

    // Then animate the removal
    removeAnimation(id, () => {
      const updated = minders.filter(m => m.id !== id);
      setData({minders: updated});
    });
  }

  async function onMinderChange(id: string, op: DataOp) {
    if (op === 'remove') {
      removeMinder(id);
      return;
    }
    const newValue = await minderStore.get(id);
    let updated = minders;
    // console.log(minders.length, minders, id, op);

    if (op === 'update' && newValue) {
      // Note that this doesn't cover project / top changes yet
      if (isVisible(newValue, filter)) {
        minders[minders.findIndex(m => m.id === id)] = newValue;
      } else {
        //console.log('removing', id, newValue);
        removeMinder(id);
        return;
      }
    } else if (op === 'add' && newValue) {
      if (isVisible(newValue, filter) && !minders.find(m => m.id === id)) {
        // console.log('adding', id, newValue);
        updated = [...minders, newValue];
        requestSelect(newValue.id, 'start');
      }
    }
    // console.log(minders.length, minders);
    setData({minders: updated});
  }
}

type MinderListItemProps = {
  minder: Minder;
  project: MinderProject;
  parents: Minder[];
  prev?: Minder;
  style?: StyleProp<ViewStyle>;
  top: Top;
};

function MinderListItem(props: MinderListItemProps) {
  const {minder, project, parents, prev, style, top} = props;
  const {Snooze, Bump, Mover, Delete} = useMinderActions(minder);

  return (
    <>
      <View style={[S.listItem, style]}>
        <EditableStatus size={18} minder={minder} style={S.indicator} />
        <View style={S.textContainer}>
          <MinderTextInput minder={minder} project={project} prev={prev} />
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
  const {Body} = useComponents();
  const filterName = Filters.get(filter)?.label;
  const text = project.hasMinders
    ? `No Minders are visible in ${filterName}`
    : `No Minders are in "${project.name}".\n\nClick the plus button below to add the first!`;

  return (
    <View style={{margin: 30}}>
      <Body>{text}</Body>
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
    backgroundColor: '#F8F8F8',
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
