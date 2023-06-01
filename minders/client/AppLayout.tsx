/**
 * @format
 */

import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRoute} from '@react-navigation/native';
import {Appbar} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {canLoggingInFix} from '@toolkit/core/api/Auth';
import {ActionItem} from '@toolkit/core/client/Action';
import {useStatus} from '@toolkit/core/client/Status';
import TriState from '@toolkit/core/client/TriState';
import {Opt} from '@toolkit/core/util/Types';
import {useListen} from '@toolkit/data/DataStore';
import {IconButton} from '@toolkit/ui/layout/LayoutBlocks';
import {LayoutProps} from '@toolkit/ui/screen/Layout';
import {useNav, useNavState} from '@toolkit/ui/screen/Nav';
import {
  Minder,
  MinderFilter,
  flatList,
  useMinderStore,
} from '@app/common/MinderApi';
import {ActionButton} from '@app/components/ActionButton';
import ActionFAB from '@app/components/ActionFAB';
import {ActionMenu, VerticalDots} from '@app/components/ActionMenu';
import {NewItem, useGlobalActions} from '@app/components/Actions';
import TopPicker from '@app/components/TopPicker';
import {useLoad, useWithLoad, withLoad} from '@app/util/UseLoad';
import LoginScreen from './screens/LoginScreen';
import Minders from './screens/Minders';
import Redirector from './screens/Redirector';
import {EnumConfig, EnumTextButton, enumActions} from './util/Enum';
import {useMinderListParams} from './util/UiUtil';
import {useDontAnimate, useSetPageTitle} from './util/Useful';

export const Filters: EnumConfig<MinderFilter> = new Map([
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
  ['notdone', {icon: 'check-circle', label: 'Not Done', key: 'n'}],
]);

export type OutlineView =
  | 'focus'
  | 'review'
  | 'pile'
  | 'waiting'
  | 'done'
  | 'outline'
  | 'outlineall';

// New menu config for menu that selects filter *and* view
type ViewMenuChoice = {
  filter: MinderFilter;
};

// Function for lazy loading of view types
export const viewMenuChoices = (): Record<OutlineView, ViewMenuChoice> => ({
  focus: {filter: 'focus'},
  review: {filter: 'review'},
  pile: {filter: 'pile'},
  waiting: {filter: 'waiting'},
  done: {filter: 'done'},
  outline: {filter: 'notdone'},
  outlineall: {filter: 'all'},
});

export function filterFor(view: OutlineView) {
  return viewMenuChoices()[view].filter;
}

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

function viewFor(view: string, filter: MinderFilter): OutlineView {
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

function TopAction(props: {action: ActionItem}) {
  return <ActionButton item={props.action} {...TOP_ACTION_PROPS} />;
}

export default function Layout(props: LayoutProps) {
  const {children, loading, style, title = '', mainAction} = props;
  const loadingView = loading ?? SpinnerLoading;
  const route = useRoute();
  const dontAnimateNextTransition = useDontAnimate();
  const nav = useNav();
  const navStyle = style?.nav ?? 'full';
  const navType = style?.type ?? 'std';
  const key = route.key;
  const {width, height: maxHeight} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  function onError(err: Error) {
    // If you can fix the error by logging back in, redirect to login
    if (canLoggingInFix(err)) {
      dontAnimateNextTransition();
      setTimeout(() => nav.reset(LoginScreen), 0);
    }
    return false;
  }

  const borderRadius = isMobile() || width < 800 ? 0 : 24;

  if (navType === 'modal') {
    // Modal views are just the content: No SafeAreaView, Header, or Tabs
    return (
      <View style={[S.top, {borderRadius, maxHeight}]}>
        {navStyle == 'full' && <Header title={title} />}
        <ScrollView
          style={S.scroll}
          contentContainerStyle={[
            S.modalContent,
            {marginBottom: insets.bottom},
          ]}>
          <TriState key={key} onError={onError} loadingView={loadingView}>
            <View style={{flex: 1}}>{children}</View>
          </TriState>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[S.top, {borderRadius, maxHeight}]}>
      <StatusBar backgroundColor="#123" barStyle="light-content" />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        contentContainerStyle={{flex: 1}}>
        {navStyle === 'full' && (
          // TODO: Should show action bar while loading
          <TriState loadingView={Empty} errorView={Empty}>
            <Header {...props} />
            {mainAction && <ActionFAB style={S.fab} small item={mainAction} />}
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
  const {title} = props;
  const {
    location: {screen},
  } = useNavState();

  const MyHeader =
    screen === Minders
      ? MinderListHeader
      : screen === Redirector
      ? RedirectorHeader
      : StandardHeader;

  return (
    <View style={S.topBar}>
      <MyHeader {...props} />
    </View>
  );
}

/**
 * Looks like MinderList header but not functional
 */
function RedirectorHeader(props: LayoutProps) {
  const {Home} = useGlobalActions();
  const {Settings} = useGlobalActions();

  return (
    <View style={S.minderTop}>
      <View style={S.grow} />
      <TopAction action={Home} />
      <ActionMenu
        items={[Settings]}
        anchor={onPress => (
          <VerticalDots {...TOP_ACTION_PROPS} onPress={onPress} />
        )}
      />
    </View>
  );
}

function StandardHeader(props: LayoutProps) {
  const {title} = props;
  const {Home} = useGlobalActions();
  const nav = useNav();

  function goBack() {
    if (nav.backOk()) {
      nav.back();
    } else {
      nav.reset(Redirector);
    }
  }

  return (
    <>
      <IconButton
        name="ion:chevron-back-outline"
        color="#FFF"
        size={28}
        onPress={goBack}
        style={{marginRight: 6}}
      />
      <Text style={[S.title, S.grow]}>{title}</Text>
      <TopAction action={Home} />
    </>
  );
}

// TODO: Back button
function MinderListHeader(props: LayoutProps) {
  const route = useRoute();
  const {view, top: topId} = useMinderListParams();
  const nav = useNav();
  const setPageTitle = useSetPageTitle();
  const {setError} = useStatus();

  const {
    location: {screen},
  } = useNavState();
  const {Collapse, Expand, Home, Settings, Import, Up} = useGlobalActions();

  // TODO: Set isTop
  const isTop = false;

  // TODO: Filter out up when at project level
  const actionMenuItems = [Up, Expand, Collapse, Import, Settings];

  const showCount = screen === Minders;

  /*
  if (screen === OutlineTop || screen === OutlineList) {
    setPageTitle(focusItem.text);
  }*/

  const viewMenuActions = enumActions(ViewMenuItems, value => {
    nav.setParams({view: value});
    // TODO: Save new default
  });

  return (
    <View style={S.minderTop}>
      <View style={[S.row, {flexShrink: 1}]}>
        <TriState>
          <View style={{flexShrink: 1, overflow: 'hidden'}}>
            <TopPicker style={S.title} topId={topId} />
          </View>
          <Text style={S.title}>{' > '}</Text>
          <ActionMenu
            items={viewMenuActions}
            anchor={onPress => (
              <EnumTextButton
                enums={ViewMenuItems}
                value={view}
                style={S.title}
                onPress={onPress}
              />
            )}
          />
          {showCount && <MinderCount view={view} topId={topId} />}
        </TriState>
      </View>
      <View style={S.row}>
        {!isTop && <TopAction action={Home} />}
        <ActionMenu
          items={actionMenuItems}
          anchor={onPress => (
            <VerticalDots {...TOP_ACTION_PROPS} onPress={onPress} />
          )}
        />
      </View>
    </View>
  );
}

type MinderCountProps = {view: OutlineView; topId: string};

const MinderCount = withLoad((props: MinderCountProps) => {
  const {view, topId} = props;
  const minderStore = useMinderStore();
  const filter = filterFor(view);
  const {count, setData} = useLoad(props, load);

  useListen(Minder, '*', async () => {
    const {count} = await load();
    setData({count});
  });

  return (
    <>
      {count && (
        <View style={S.badge}>
          <Text style={{fontSize: 14, color: '#FFF'}}>{count}</Text>
        </View>
      )}
    </>
  );

  async function load() {
    const {top} = await minderStore.getAll(topId);
    // TODO: More efficient logic
    const matching = flatList(top.children, filter);

    return {count: matching.length};
  }
});

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

/**
 * The UI state of the project.
 *
 *
 * This is calculated from URL parameters, and the latest is stored
 * locally on your device for when URL parameters aren't set.
 */
export type MinderUiState = {
  /** Current view */
  view?: OutlineView;

  /** Current visibility filter, calculated from `view` */
  filter?: MinderFilter;

  /** The currently focused minder - only children of this minder are show */
  top?: string;

  /** The current project */
  project?: string;
};

function parseJsonOr<T>(value: Opt<string>, defaultValue: T): T {
  try {
    if (value != null) {
      return JSON.parse(value);
    }
  } catch (e) {}

  return defaultValue;
}

export async function saveLatestUiState(minderUiState: Partial<MinderUiState>) {
  await AsyncStorage.setItem('minderUiState', JSON.stringify(minderUiState));
}

export async function getSavedUiState(): Promise<Opt<MinderUiState>> {
  const savedUiState = await AsyncStorage.getItem('minderUiState');
  return parseJsonOr(savedUiState, null);
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
  minderTop: {
    flex: 1,
    flexDirection: 'row',
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
  grow: {
    flexBasis: 200,
    flexGrow: 1,
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
  modalContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 0,
    height: '100%',
  },
  top: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#123',
    shadowColor: '#C0C0C0',
    shadowRadius: 4,
    overflow: 'hidden',
  },
});
