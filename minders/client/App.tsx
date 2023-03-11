/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {CONSOLE_LOGGER} from '@toolkit/core/api/Log';
import IdentityService from '@toolkit/core/api/Login';
import {SimpleUserMessaging} from '@toolkit/core/client/UserMessaging';
import {registerAppConfig} from '@toolkit/core/util/AppConfig';
import {AppContextProvider} from '@toolkit/core/util/AppContext';
import {filterHandledExceptions} from '@toolkit/core/util/Environment';
import {FIRESTORE_DATASTORE} from '@toolkit/providers/firebase/DataStore';
import {FIREBASE_LOGGER} from '@toolkit/providers/firebase/client/Logger';
import {fbAuthProvider} from '@toolkit/providers/login/FacebookLogin';
import {googleAuthProvider} from '@toolkit/providers/login/GoogleLogin';
import {
  NavContext,
  useReactNavScreens,
} from '@toolkit/providers/navigation/ReactNavigation';
import PhoneInput from '@toolkit/screens/login/PhoneInput';
import PhoneVerification from '@toolkit/screens/login/PhoneVerification';
import {NotificationSettingsScreen} from '@toolkit/screens/settings/NotificationSettings';
import {BLACK_AND_WHITE} from '@toolkit/ui/QuickThemes';
import {Icon, registerIconPack} from '@toolkit/ui/components/Icon';
import {NavItem} from '@toolkit/ui/layout/DrawerLayout';
import {Routes} from '@toolkit/ui/screen/Nav';
import WebViewScreen from '@toolkit/ui/screen/WebScreen';
import 'expo-dev-client';
import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import 'react-native-gesture-handler';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {initializeFirebase} from '@toolkit/providers/firebase/Config';
import {usePaperComponents} from '@toolkit/ui/components/Paper';
import AuthConfig from '@app/app/AuthConfig';
import AboutScreen from '@app/app/screens/AboutScreen';
import LoginScreen from '@app/app/screens/LoginScreen';
import SettingsScreen from '@app/app/screens/SettingsScreen';
import StartupScreen from '@app/app/screens/StartupScreen';
import {FIREBASE_CONFIG, GOOGLE_LOGIN_CONFIG} from '@app/common/Config';
import AppLayout from './legacy/components/AppLayout';
import {MessagingTool} from './legacy/components/Messaging';
import OutlineList from './legacy/components/OutlineList';
import OutlineMover from './legacy/components/OutlineMover';
import OutlineTop from './legacy/components/OutlineTop';
import {ShortcutTool} from './legacy/components/Shortcuts';
import {UsingUiTools} from './legacy/components/UiTools';
import {WaitDialogTool} from './legacy/components/WaitDialog';
import {APP_CONFIG, APP_INFO, NOTIF_CHANNELS_CONTEXT} from './lib/Config';

//
/**
 * Hacky workaround for 'react-native-webview' crashing app when JS is unloaded.
 *
 * `onContentProcessDidTerminate` bridge is always called when view is unloaded and
 * if JS engine is already stopped this will terminate the app, as the event callback
 * fires and React force quits.
 *
 * This happens in Expo Go but could also see it occuring during hot reloading.
 *
 * Temporary fix is to patch to set onContentProcessDidTerminate in bridge when the prop is
 * passed into the React Component.
 *
 */

let reactNativeWebViewCrashPatched = false;

// TODO: Move this to FirebasePhoneUtils, as that is the proximate use case that is most important
function patchReactNativeWebViewCrash() {
  if (Platform.OS !== 'web') {
    try {
      if (!reactNativeWebViewCrashPatched) {
        const WebViewShared = require('react-native-webview/lib/WebViewShared');
        const useWebWiewLogic = WebViewShared.useWebWiewLogic;
        /** @ts-ignore */
        WebViewShared.useWebWiewLogic = props => {
          const result = useWebWiewLogic(props);
          if (!props.onContentProcessDidTerminateProp && result) {
            /** @ts-ignore */
            delete result['onContentProcessDidTerminate'];
          }
          return result;
        };
        reactNativeWebViewCrashPatched = true;
      }
    } catch (ignored) {}
  }
}
patchReactNativeWebViewCrash();

filterHandledExceptions();

export const Outline = OutlineTop; //outlineScreen(OutlineTop);
export const List = OutlineList; //outlineScreen(OutlineList);
export const Mover = OutlineMover; //outlineScreen(OutlineMover);

// @ts-ignore
Outline.title = 'Outline';
// @ts-ignore
List.title = 'List';

// TODO: Move this some place useful
function fixOutlineCss() {
  var style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.appendChild(document.createTextNode('input:focus {outline: none;}'));
  document.getElementsByTagName('head')[0].appendChild(style);
  /*
  input:focus {outline: none;}*/
}
fixOutlineCss();

// TODO: Hack to hide header to avoid double back buttons.
// Fix this by converting these to Screens
// @ts-ignore
PhoneInput.style = {nav: 'none'};
// @ts-ignore
PhoneVerification.style = {nav: 'none'};
const ROUTES: Routes = {
  StartupScreen,
  LoginScreen,
  SettingsScreen,
  PhoneInput,
  PhoneVerification,
  WebViewScreen,
  AboutScreen,
  NotificationSettingsScreen,
  outline: Outline,
  list: List,
  mover: Mover,
};
const Stack = createStackNavigator();

// Set this to true to enable logging to Firebase Analytics
const USE_FIREBASE_ANALYTICS = false;

const LOGGER = USE_FIREBASE_ANALYTICS ? FIREBASE_LOGGER : CONSOLE_LOGGER;
const APP_CONTEXT = [
  APP_CONFIG,
  APP_INFO,
  FIRESTORE_DATASTORE,
  LOGGER,
  NOTIF_CHANNELS_CONTEXT,
];

export default function App() {
  registerAppConfig(APP_CONFIG);
  initializeFirebase(FIREBASE_CONFIG);
  IdentityService.addProvider(fbAuthProvider());
  IdentityService.addProvider(googleAuthProvider(GOOGLE_LOGIN_CONFIG));
  registerIconPack('ion', Ionicons);
  registerIconPack('mci', MaterialCommunityIcons);
  usePaperComponents();

  const {navScreens, linkingScreens} = useReactNavScreens(
    ROUTES,
    AppLayout,
    Stack.Screen,
  );

  // For deep links
  const linking = {
    prefixes: ['npe.fb.com'],
    config: linkingScreens,
  };

  console.log(DefaultTheme);
  const navTheme = {
    colors: {...DefaultTheme.colors, background: 'rgba(0,0,0,0)'},
    dark: DefaultTheme.dark,
  };
  console.log(navTheme);

  return (
    <AppContextProvider ctx={APP_CONTEXT}>
      <PaperProvider theme={BLACK_AND_WHITE} settings={{icon: Icon}}>
        <UsingUiTools tools={[MessagingTool, ShortcutTool, WaitDialogTool]}>
          <AuthConfig>
            <View style={S.background}>
              <SafeAreaProvider style={S.container}>
                <SimpleUserMessaging style={S.messaging} />
                <NavigationContainer linking={linking} theme={navTheme}>
                  <StatusBar style="auto" />
                  <NavContext routes={ROUTES} />
                  <Stack.Navigator
                    screenOptions={{headerShown: false}}
                    initialRouteName="StartupScreen">
                    {navScreens}
                  </Stack.Navigator>
                </NavigationContainer>
              </SafeAreaProvider>
            </View>
          </AuthConfig>
        </UsingUiTools>
      </PaperProvider>
    </AppContextProvider>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },
  messaging: {
    bottom: 100,
  },
  background: {flex: 1, backgroundColor: '#202020'},
});
