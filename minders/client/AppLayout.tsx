/**
 * @format
 */

import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {Appbar} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {canLoggingInFix} from '@toolkit/core/api/Auth';
import {useStatus} from '@toolkit/core/client/Status';
import TriState from '@toolkit/core/client/TriState';
import {AdhocError} from '@toolkit/core/util/CodedError';
import {LayoutProps} from '@toolkit/ui/screen/Layout';
import {useNav, useNavState} from '@toolkit/ui/screen/Nav';
import ActionButton from '@app/components/ActionButton';
import ActionFAB from '@app/components/ActionFAB';
import ActionMenu, {VerticalDots} from '@app/components/ActionMenu';
import {
  Collapse,
  Expand,
  Home,
  NewItem,
  Settings,
  Up,
  type Action,
} from '@app/components/Actions';
import OutlineFocusPicker from '@app/components/OutlineFocusPicker';
import {
  useOutlineState,
  useOutlineStore,
  useOutliner,
} from '@app/model/OutlinerContext';
import type {
  OutlineItemVisibilityFilter,
  OutlineViewType,
} from '@app/model/outliner';
import {getItemUi} from '@app/model/outliner';
import LoginScreen from '@app/screens/LoginScreen';
import OutlineList from '@app/screens/OutlineList';
import OutlineTop from '@app/screens/OutlineTop';
import {EnumConfig, EnumTextButton, enumActions} from './util/Enum';
import {useDontAnimate, useSetPageTitle} from './util/Useful';

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

type OutlineView =
  | 'focus'
  | 'review'
  | 'pile'
  | 'waiting'
  | 'done'
  | 'outline'
  | 'outlineall';

// New menu config for menu that selects filter *and* view
type ViewMenuChoice = {
  filter: OutlineItemVisibilityFilter;
  view: typeof OutlineTop | typeof OutlineList;
};

// Function for lazy loading of view types
const viewMenuChoices = (): Record<OutlineView, ViewMenuChoice> => ({
  focus: {filter: 'focus', view: OutlineList},
  review: {filter: 'review', view: OutlineList},
  pile: {filter: 'pile', view: OutlineList},
  waiting: {filter: 'waiting', view: OutlineList},
  done: {filter: 'done', view: OutlineList},
  outline: {filter: 'notdone', view: OutlineTop},
  outlineall: {filter: 'all', view: OutlineTop},
});

export const ViewMenuItems: EnumConfig<OutlineView> = new Map([
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

function viewFor(
  view: string,
  filter: OutlineItemVisibilityFilter,
): OutlineView {
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
  const dontAnimateNextTransition = useDontAnimate();
  const nav = useNav();
  const navStyle = style?.nav ?? 'full';
  const navType = style?.type ?? 'std';
  const key = route.key;

  function onError(err: Error) {
    // If you can fix the error by logging back in, redirect to login
    if (canLoggingInFix(err)) {
      dontAnimateNextTransition();
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
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior="position"
        contentContainerStyle={{flex: 1}}>
        {navStyle === 'full' && (
          // TODO: Should show action bar while loading
          <TriState loadingView={Empty} errorView={Empty}>
            <Header {...props} />
            <ActionFAB style={S.fab} small action={NewItem} />
          </TriState>
        )}
        <ScrollView style={S.scroll} contentContainerStyle={S.content}>
          <TriState key={key} onError={onError} loadingView={loadingView}>
            <View style={{flex: 1}}>{children}</View>
          </TriState>
        </ScrollView>
      </KeyboardAvoidingView>
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
  const nav = useNav();
  const setPageTitle = useSetPageTitle();
  const {setError} = useStatus();
  const {
    location: {screen},
  } = useNavState();

  const view = route.name;

  const [{focus, focusItem}, setOutlineState] = useOutlineState();
  const isTop = focusItem == outliner.getData();
  const count =
    view == 'list'
      ? outliner.getFlatList(focusItem).filter(item => !item.ui?.hidden).length
      : null; //getChildren(focusItem).length;

  const actionMenuItems = [Expand, Collapse, Settings];
  if (!isTop) {
    actionMenuItems.splice(0, 0, Up);
  }

  loader.setErrorReporter((e: Error) => {
    setError(AdhocError('Failure saving outline - please reload.'));
  });

  if (screen === OutlineTop || screen === OutlineList) {
    setPageTitle(focusItem.text);
  }

  const viewMenuActions = enumActions(ViewMenuItems, value => {
    const choice = viewMenuChoices()[value];
    nav.replace(choice.view, {focus});
    // TODO: This should probably be in URL?
    setOutlineState({filter: choice.filter});
    /*
    if (route.name != choice.view) {
      nav.replace(choice.view, {focus});
    }
    */
  });

  const viewMenuEnum = viewFor(route.name, filter);

  return (
    <View style={S.topBar}>
      <View style={[S.row, {flexShrink: 1}]}>
        <View style={S.row}>
          <View style={{flexShrink: 1, overflow: 'hidden'}}>
            <OutlineFocusPicker style={S.title} />
          </View>
          <Text style={S.title}>{' > '}</Text>
          <ActionMenu
            actions={viewMenuActions}
            anchor={onPress => (
              <EnumTextButton
                enums={ViewMenuItems}
                value={viewMenuEnum}
                style={S.title}
                onPress={onPress}
              />
            )}
          />
        </View>
        {count != null && (
          <View style={S.badge}>
            <Text style={{fontSize: 14, color: '#FFF'}}>{count}</Text>
          </View>
        )}
      </View>
      <View style={S.row}>
        {!isTop && <TopAction action={Home} />}
        <ActionMenu
          actions={actionMenuItems}
          anchor={onPress => (
            <VerticalDots {...TOP_ACTION_PROPS} onPress={onPress} />
          )}
        />
      </View>
    </View>
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

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return 'mobile';
  }
  return 'desktop';
}

function isMobile() {
  return Platform.OS !== 'web' || getDeviceType() === 'mobile';
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
    backgroundColor: '#FFF',
    borderBottomWidth: isMobile() ? 1 : 0,
    borderColor: '#385078',
  },
  content: {
    flexGrow: 1,
  },
  topBar: {
    backgroundColor: '#123',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
    elevation: 4,
    borderTopWidth: isMobile() ? 1 : 0,
    borderColor: '#385078',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 3,
  },
  subtitle: {
    color: '#FFF',
    fontSize: 16,
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
    marginLeft: 9,
    paddingTop: 7,
    backgroundColor: '#385078',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalContent: {flex: 1, marginBottom: 30},
  container: {flex: 1, padding: 0, height: '100%'},
  top: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#123',
    borderRadius: isMobile() ? 0 : 24,
    shadowColor: '#C0C0C0',
    shadowRadius: 4,
    overflow: 'hidden',
  },
});
