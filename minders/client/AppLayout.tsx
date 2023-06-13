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
import TriState from '@toolkit/core/client/TriState';
import {Opt} from '@toolkit/core/util/Types';
import {DataOp} from '@toolkit/data/DataCache';
import {useListen} from '@toolkit/data/Subscribe';
import {IconButton} from '@toolkit/ui/layout/LayoutBlocks';
import {LayoutProps} from '@toolkit/ui/screen/Layout';
import {useNav, useNavState} from '@toolkit/ui/screen/Nav';
import {
  Minder,
  MinderFilter,
  flatList,
  isVisible,
  useMinderStore,
} from '@app/common/MinderApi';
import {ActionButton} from '@app/components/ActionButton';
import ActionFAB from '@app/components/ActionFAB';
import {ActionMenu, VerticalDots} from '@app/components/ActionMenu';
import {useGlobalActions} from '@app/components/Actions';
import TopPicker from '@app/components/TopPicker';
import {useLoad, withLoad} from '@app/util/UseLoad';
import LoginScreen from './screens/LoginScreen';
import Minders from './screens/Minders';
import {EnumConfig, EnumTextButton, enumActions} from './util/Enum';
import {useMinderListParams} from './util/UiUtil';
import {useDontAnimate} from './util/Useful';

export const Filters: EnumConfig<MinderFilter> = new Map([
  /*['top', { icon: 'star-outline', label: 'Starred' }],*/
  ['focus', {icon: 'eye-outline', label: 'In Focus', key: 'f'}],
  ['review', {icon: 'timer', label: 'To Review', key: 'r'}],
  /*['soon', { icon: 'timelapse', label: 'Soon' }], */
  ['pile', {icon: 'checkbox-multiple-blank-outline', label: 'Pile', key: 'p'}],
  /* ['all', {icon: 'earth', label: 'All', key: 'a'}],*/
  ['waiting', {icon: 'timer-sand-empty', label: 'Waiting', key: 'w'}],
  ['done', {icon: 'check-circle-outline', label: 'Done', key: 'd'}],
  ['notdone', {icon: 'check-circle', label: 'Not Done', key: 'n'}],
]);

export type MinderView =
  | 'focus'
  | 'review'
  | 'pile'
  | 'waiting'
  | 'done'
  | 'outline'
  | 'outlineall';

/**
 * Views identify the page the user is one, filters are IDs of the logic
 * for filtering which Minders are show. This maps between them.
 */
export const VIEW_TO_FILTER: Record<MinderView, MinderFilter> = {
  focus: 'focus',
  review: 'review',
  pile: 'pile',
  waiting: 'waiting',
  done: 'done',
  outline: 'notdone',
  outlineall: 'all',
};

export function filterFor(view: MinderView): MinderFilter {
  return VIEW_TO_FILTER[view];
}

export const ViewMenuItems: EnumConfig<MinderView> = new Map([
  ['focus', {icon: 'eye-outline', label: 'In Focus', key: 'f'}],
  ['review', {icon: 'timer', label: 'To Review', key: 'r'}],
  ['waiting', {icon: 'timer-sand-empty', label: 'Waiting', key: 'w'}],
  ['done', {icon: 'check-circle-outline', label: 'Done', key: 'd'}],
  [
    'pile',
    {icon: 'checkbox-multiple-blank-outline', label: 'The Pile', key: 'p'},
  ],
]);

// Outline enabled only in dev until working smoothly
if (__DEV__) {
  ViewMenuItems.set('outline', {
    icon: 'format-list-bulleted',
    label: 'Outline',
    key: 'o',
  });
  ViewMenuItems.set('outlineall', {
    icon: 'format-list-checkbox',
    label: 'Outline All',
    key: 'a',
  });
}

function viewFor(view: string, filter: MinderFilter): MinderView {
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

  const mainActionItem: Opt<ActionItem> =
    typeof mainAction === 'function' ? mainAction() : mainAction;

  function onError(err: Error) {
    // If you can fix the error by logging back in, redirect to login
    if (canLoggingInFix(err)) {
      dontAnimateNextTransition();
      setTimeout(() => nav.reset(LoginScreen), 0);
    }
    return false;
  }

  const border =
    isMobile() || width < 800
      ? {borderRadius: 0, borderWidth: 0}
      : {borderRadius: 24, borderWidth: 1};

  if (navType === 'modal') {
    // Modal views are just the content: No SafeAreaView, Header, or Tabs
    return (
      <View style={[S.top, border, {maxHeight}]}>
        {navStyle == 'full' && <Header title={title} />}
        <ScrollView
          style={S.main}
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
    <SafeAreaView style={[S.top, border, {maxHeight}]}>
      <StatusBar backgroundColor="#123" barStyle="light-content" />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        contentContainerStyle={{flex: 1}}>
        {navStyle === 'full' && (
          // TODO: Should show action bar while loading
          <TriState loadingView={Empty} errorView={Empty}>
            <Header {...props} />
            {mainActionItem && (
              <ActionFAB style={S.fab} small item={mainActionItem} />
            )}
          </TriState>
        )}
        <View style={S.main}>
          <TriState key={key} onError={onError} loadingView={loadingView}>
            <View style={{flex: 1}}>{children}</View>
          </TriState>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// TODO: Back button
function Header(props: LayoutProps) {
  const {view, top} = useMinderListParams();

  const {
    location: {screen},
  } = useNavState();

  const HeaderToShow =
    view != null && top != null
      ? MinderListHeader
      : screen.id === Minders.id
      ? LoadingHeader
      : StandardHeader;

  return (
    <View style={S.topBar}>
      <HeaderToShow {...props} />
    </View>
  );
}

/**
 * Looks like MinderList header but not functional
 */
function LoadingHeader(props: LayoutProps) {
  const {Settings} = useGlobalActions();

  return (
    <View style={S.minderTop}>
      <View style={S.grow} />
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
      nav.reset(Minders);
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
  const {view, top: topId} = useMinderListParams();
  const nav = useNav();
  const mobileLayout = isMobile();

  const {
    location: {screen},
  } = useNavState();
  const {Collapse, Expand, Home, Settings, Import, Up} = useGlobalActions();

  // TODO: Filter out up when at project level
  const actionMenuItems = [Up, Expand, Collapse, Import, Settings, Home];
  const showCount = screen === Minders;

  const viewMenuActions = enumActions(ViewMenuItems, value => {
    nav.setParams({view: value});
    // TODO: Save new default
  });

  return (
    <TriState loadingView={LoadingHeader} errorView={Empty}>
      <View style={S.minderTop}>
        <View
          style={{
            flexShrink: 1,
            flexGrow: 1,
            flexBasis: 20,
            overflow: 'hidden',
          }}>
          <TopPicker style={S.title} topId={topId} />
        </View>
        <ActionMenu
          items={viewMenuActions}
          anchor={onPress => (
            <EnumTextButton
              enums={ViewMenuItems}
              value={view}
              style={[S.title, S.stateText]}
              onPress={onPress}
              iconStyle={S.stateIcon}
              color="#FFF"
              showText={!mobileLayout}
            />
          )}
        />
        {showCount && <MinderCount view={view} topId={topId} />}
        <ActionMenu
          items={actionMenuItems}
          anchor={onPress => (
            <VerticalDots {...TOP_ACTION_PROPS} onPress={onPress} />
          )}
        />
      </View>
    </TriState>
  );
}

type MinderCountProps = {view: MinderView; topId: string};

const MinderCount = withLoad((props: MinderCountProps) => {
  const {view, topId} = props;
  const minderStore = useMinderStore();
  const filter = filterFor(view);
  const {minderIds} = useLoad(props, load);
  const [ids, setIds] = React.useState<string[]>(minderIds);

  useListen(Minder, '*', async (id: string, op: DataOp) => {
    const exists = ids.indexOf(id) !== -1;
    const newMinder = op === 'remove' ? null : await minderStore.get(id);
    const showIt = newMinder != null && isVisible(newMinder, filter);

    if (showIt && !exists) {
      setIds([...ids, id]);
    } else if (!showIt && exists) {
      setIds(ids => ids.filter(i => i !== id));
    }
  });

  const count = ids.length;
  const fontSize = count > 1000 ? 11 : 14;
  let marginTop = count > 1000 ? 2 : 0;
  if (Platform.OS === 'android') {
    marginTop -= 2;
  }

  return (
    <>
      <View style={S.badge}>
        <Text style={{fontSize, marginTop, color: '#FFF'}}>{count}</Text>
      </View>
    </>
  );

  async function load(): Promise<{minderIds: string[]}> {
    const {top} = await minderStore.getAll(topId, filter);
    // TODO: More efficient logic
    const matching = flatList(top.children, filter);

    return {minderIds: matching.map(m => m.id)};
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
  view?: MinderView;

  /** The currently focused minder - only children of this minder are show */
  top?: string;
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
  main: {
    backgroundColor: '#FFF',
    borderBottomWidth: isMobile() ? 1 : 0,
    borderColor: '#385078',
    flex: 1,
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
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'red',
  },
  title: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 3,
  },
  stateText: {
    paddingRight: 10,
    marginRight: 1,
    fontSize: 16,
  },
  stateIcon: {
    opacity: 1,
    marginHorizontal: 3,
    marginVertical: -2,
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
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
});
