/**
 * @format
 */

// TODO: Add keyboard shrtcuts

import * as React from 'react';
import {View} from 'react-native';
import {ScrollView, StyleSheet, Text} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
// Can we import view from paper?s
import {Appbar} from 'react-native-paper';
import {getItemUi, pathTo} from '../model/outliner';
import type {
  OutlineItemVisibilityFilter,
  OutlineViewType,
} from '../model/outliner';
import ActionButton from './ActionButton';
import ActionFAB from './ActionFAB';
import ActionMenu, {VerticalDots} from './ActionMenu';
import {
  Collapse,
  Expand,
  Home,
  Login,
  NewItem,
  Up,
  type Action,
} from './Actions';
import {EnumConfig, EnumTextButton, enumActions} from './Enum';
import {Messaging} from './Messaging';
import OutlineFocusPicker from './OutlineFocusPicker';
import {useOutlineState, useOutlineStore, useOutliner} from './OutlinerContext';
import type {Nav} from './OutlinerMain';

export const Filters: EnumConfig<OutlineItemVisibilityFilter> = new Map([
  /*['top', { icon: 'star-outline', label: 'Starred' }],*/
  ['focus', {icon: 'eye-outline', label: 'In Focus', key: 'f'}],
  ['review', {icon: 'timer', label: 'To review', key: 'r'}],
  /*['soon', { icon: 'timelapse', label: 'Soon' }], */
  [
    'pile',
    {icon: 'checkbox-multiple-blank-outline', label: 'The pile', key: 'p'},
  ],
  /* ['all', {icon: 'earth', label: 'All', key: 'a'}],*/
  ['waiting', {icon: 'timer-sand-empty', label: 'Waiting', key: 'w'}],
  ['done', {icon: 'check-circle-outline', label: 'Done', key: 'd'}],
]);

// Cheating and reversing the icons... really should have a toggle button
const ViewTypes: EnumConfig<OutlineViewType> = new Map([
  ['list', {icon: 'format-list-bulleted', label: 'Outline View', key: 'l'}],
  ['outline', {icon: 'format-align-justify', label: 'List View', key: 'o'}],
]);

// New menu config for menu that selects filter *and* view
type ViewMenuChoice = {
  filter: OutlineItemVisibilityFilter;
  view: OutlineViewType;
};

const ViewMenuChoices: {[val: string]: ViewMenuChoice} = {
  focus: {filter: 'focus', view: 'list'},
  review: {filter: 'review', view: 'list'},
  pile: {filter: 'pile', view: 'list'},
  waiting: {filter: 'waiting', view: 'list'},
  done: {filter: 'done', view: 'list'},
  outline: {filter: 'notdone', view: 'outline'},
  outlineall: {filter: 'all', view: 'outline'},
};

type ViewMenuEnum = keyof typeof ViewMenuChoices;

export const ViewMenuItems: EnumConfig<ViewMenuEnum> = new Map([
  ['focus', {icon: 'eye-outline', label: 'In Focus', key: 'f'}],
  ['review', {icon: 'timer', label: 'To review', key: 'r'}],
  [
    'pile',
    {icon: 'checkbox-multiple-blank-outline', label: 'The pile', key: 'p'},
  ],
  ['waiting', {icon: 'timer-sand-empty', label: 'Waiting', key: 'w'}],
  ['done', {icon: 'check-circle-outline', label: 'Done', key: 'd'}],
  ['outline', {icon: 'format-list-bulleted', label: 'Outline', key: 'o'}],
  [
    'outlineall',
    {icon: 'format-list-checkbox', label: 'Outline All', key: 'a'},
  ],
]);

function viewMenuEnumFor(
  view: string,
  filter: OutlineItemVisibilityFilter,
): ViewMenuEnum {
  if (view == 'outline') {
    if (filter == 'all') {
      return 'outlineall';
    }
    return 'outline';
  }
  // Annoying, but for type-safey
  if (filter == 'focus') return 'focus';
  if (filter == 'review') return 'review';
  if (filter == 'pile') return 'pile';
  if (filter == 'waiting') return 'waiting';
  if (filter == 'done') return 'done';

  return 'focus';
}

const OutlineViewAction = {
  id: 'GO_TO_OUTLINE',
  icon: 'format-list-bulleted',
  label: 'Outline View',
  key: 'o',
  handle: () => {
    const [{focus}] = useOutlineState();
    const nav: Nav = useNavigation();
    return () => {
      nav.replace('outline', {focus});
    };
  },
};

const TOP_ACTION_PROPS = {
  size: 24,
  color: '#FFF',
  style: {margin: 0, opacity: 0.9},
  type: Appbar.Action,
};

function TopAction(props: {action: Action}) {
  return <ActionButton action={props.action} {...TOP_ACTION_PROPS} />;
}

export default function OutlineFrame(props: {children: React.ReactNode}) {
  const {children} = props;
  const outliner = useOutliner();
  const loader = useOutlineStore();
  const outlineUiState = getItemUi(outliner.getData());
  //const view = outlineUiState.view || 'outline';
  const filter = outlineUiState.visibilityFilter || 'focus';
  const nav: Nav = useNavigation();
  const route = useRoute();
  const view = route.name;

  const [{focus, focusItem}, setOutlineState] = useOutlineState();
  const isTop = focusItem == outliner.getData();
  const count =
    view == 'list'
      ? outliner.getFlatList(focusItem).filter(item => !item.ui?.hidden).length
      : null; //getChildren(focusItem).length;

  const actionMenuItems = [Expand, Collapse, Login];
  if (!isTop) {
    actionMenuItems.splice(0, 0, Up);
  }

  const toggleView = () => {
    const newView = view == 'list' ? 'outline' : 'list';
    nav.replace(newView, {focus});

    // Also would like for the buttons to animate again... sad they aren't
    // Would be good to re-enable setting the view
    // -> outliner.setView(value);
  };

  const messaging = Messaging.get();

  loader.setErrorReporter((e: Error) => {
    messaging.showMessage({
      type: 'error',
      text: 'Failure saving outline - please reload.',
    });
  });

  const viewMenuActions = enumActions(ViewMenuItems, value => {
    const newView = view == 'list' ? 'outline' : 'list';
    const choice = ViewMenuChoices[value];
    if (route.name != choice.view) {
      nav.replace(choice.view, {focus});
    }
    setOutlineState({filter: choice.filter});
  });

  const viewMenuEnum = viewMenuEnumFor(route.name, filter);

  return (
    <View style={styles.page}>
      <Appbar.Header style={styles.topBar}>
        <Appbar.Content
          title={
            <>
              <OutlineFocusPicker />
              <Text> {'>'} </Text>
              <ActionMenu
                actions={viewMenuActions}
                anchor={onPress => (
                  <EnumTextButton
                    enums={ViewMenuItems}
                    value={viewMenuEnum}
                    style={TOP_ACTION_PROPS.style}
                    onPress={onPress}
                  />
                )}
              />
              <Text> </Text>
              {count != null && (
                <View style={styles.badge}>
                  <Text style={{fontSize: 14}}>{count}</Text>
                </View>
              )}
            </>
          }
          subtitle={pathTo(outliner, focusItem.parent)}
          titleStyle={styles.topBarText}
        />
        {!isTop && <TopAction action={Home} />}
        <ActionMenu
          actions={actionMenuItems}
          anchor={onPress => (
            <VerticalDots {...TOP_ACTION_PROPS} onPress={onPress} />
          )}
        />
      </Appbar.Header>

      <ActionFAB style={styles.fab} small action={NewItem} />
      <ScrollView key={outlineUiState.view} style={styles.scroll}>
        {props.children}
      </ScrollView>
    </View>
  );
}

// TODO: Add action button styles
const styles = StyleSheet.create({
  action: {opacity: 0.5},
  floatingActionBar: {
    flexDirection: 'row',
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 1,
    borderColor: '#333',
    borderWidth: 1,
  },
  page: {
    flex: 1,
    flexDirection: 'column',
    height: 500,
    backgroundColor: '#FFF',
  },
  scroll: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#123',
  },
  topBar: {
    backgroundColor: '#123',
    marginLeft: -6,
  },
  topBarText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    zIndex: 1,
    borderColor: '#333',
    backgroundColor: 'white',
    borderWidth: 1,
  },
  badge: {
    width: 32,
    height: 32,
    marginTop: -4,
    marginLeft: 8,
    paddingTop: 8,
    paddingRight: 1,
    backgroundColor: '#385078',
    borderRadius: 16,
    zIndex: 1,
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
