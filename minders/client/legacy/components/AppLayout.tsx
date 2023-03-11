/**
 * @format
 */

import * as React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {ScrollView, StyleSheet, Text} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Appbar} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {canLoggingInFix} from '@toolkit/core/api/Auth';
import TriState from '@toolkit/core/client/TriState';
import {LayoutProps} from '@toolkit/ui/screen/Layout';
import {useNav} from '@toolkit/ui/screen/Nav';
import LoginScreen from '@app/app/screens/LoginScreen';
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

const TOP_ACTION_PROPS = {
  size: 24,
  color: '#FFF',
  style: {margin: 0, opacity: 0.9},
  type: Appbar.Action,
};

function TopAction(props: {action: Action}) {
  return <ActionButton action={props.action} {...TOP_ACTION_PROPS} />;
}

export default function Layout(props: LayoutProps) {
  const {children, loading, style, title = ''} = props;
  const loadingView = loading ?? SpinnerLoading;
  const route = useRoute();
  const reactNav = useNavigation<any>();
  const nav = useNav();
  const navStyle = style?.nav ?? 'full';
  const navType = style?.type ?? 'std';
  const key = route.key;

  function onError(err: Error) {
    // If you can fix the error by logging back in, redirect to login
    if (canLoggingInFix(err)) {
      reactNav.setOptions({animationEnabled: false});
      setTimeout(() => nav.reset(LoginScreen), 0);
    }
    return false;
  }

  if (navType === 'modal') {
    // Modal views are just the content: No SafeAreaView, Header, or Tabs
    return (
      <View style={S.top}>
        {navStyle == 'full' && <Header title={title} />}
        <ScrollView style={S.container} contentContainerStyle={S.modalContent}>
          <TriState key={key} onError={onError} loadingView={loadingView}>
            <View style={{flex: 1}}>{children}</View>
          </TriState>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={S.top}>
      {navStyle === 'full' && (
        // TODO: Should show action bar while loading
        <TriState loadingView={Empty} errorView={Empty}>
          <Header {...props} />
          <ActionFAB style={S.fab} small action={NewItem} />
        </TriState>
      )}
      <ScrollView style={S.scroll} contentContainerStyle={{flex: 1}}>
        <TriState key={key} onError={onError} loadingView={loadingView}>
          <View style={{flex: 1}}>{children}</View>
        </TriState>
      </ScrollView>
    </SafeAreaView>
  );
}

// TODO: Back button
function Header(props: LayoutProps) {
  const outliner = useOutliner();
  const loader = useOutlineStore();
  const outlineUiState = getItemUi(outliner.getData());
  const filter = outlineUiState.visibilityFilter || 'focus';
  const route = useRoute();
  const nav: any = useNavigation();

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
    <Appbar.Header style={S.topBar}>
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
              <View style={S.badge}>
                <Text style={{fontSize: 14}}>{count}</Text>
              </View>
            )}
          </>
        }
        subtitle={pathTo(outliner, focusItem.parent)}
        titleStyle={S.topBarText}
      />
      {!isTop && <TopAction action={Home} />}
      <ActionMenu
        actions={actionMenuItems}
        anchor={onPress => (
          <VerticalDots {...TOP_ACTION_PROPS} onPress={onPress} />
        )}
      />
    </Appbar.Header>
  );
}

function SpinnerLoading() {
  return (
    <View style={{flex: 1, justifyContent: 'center'}}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function Empty() {
  return <View style={{width: 0, height: 0}} />;
}

// TODO: Add action button styles
const S = StyleSheet.create({
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
    marginTop: -1,
    marginLeft: 9,
    paddingTop: 7,
    backgroundColor: '#385078',
    borderRadius: 16,
    zIndex: 1,
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalContent: {flex: 1, marginBottom: 30},
  container: {flex: 1, padding: 0, height: '100%'},
  top: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#C0C0C0',
    shadowRadius: 4,
    overflow: 'hidden',
  },
});
