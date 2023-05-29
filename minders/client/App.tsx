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
import {
  setClientFallbackEnabled,
  setDefaultServerApi,
} from '@toolkit/core/api/DataApi';
import {CONSOLE_LOGGER} from '@toolkit/core/api/Log';
import IdentityService from '@toolkit/core/api/Login';
import {
  SimpleUserMessaging,
  StatusContainer,
} from '@toolkit/core/client/Status';
import {registerAppConfig} from '@toolkit/core/util/AppConfig';
import {AppContextProvider} from '@toolkit/core/util/AppContext';
import {filterHandledExceptions} from '@toolkit/core/util/Environment';
import {IN_MEMORY_DATA_CACHE} from '@toolkit/data/DataCache';
import {initializeFirebase} from '@toolkit/providers/firebase/Config';
import {FIRESTORE_DATASTORE} from '@toolkit/providers/firebase/DataStore';
import {firebaseFn} from '@toolkit/providers/firebase/client/FunctionsApi';
import {FIREBASE_LOGGER} from '@toolkit/providers/firebase/client/Logger';
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
import {usePaperComponents} from '@toolkit/ui/components/Paper';
import {Routes} from '@toolkit/ui/screen/Nav';
import WebViewScreen from '@toolkit/ui/screen/WebScreen';
import AuthConfig from '@app/AuthConfig';
import {
  CLIENT_FALLBACK_ENABLED,
  FIREBASE_CONFIG,
  GOOGLE_LOGIN_CONFIG,
} from '@app/common/Config';
import AboutScreen from '@app/screens/AboutScreen';
import LoginScreen from '@app/screens/LoginScreen';
import SettingsScreen from '@app/screens/SettingsScreen';
import StartupScreen from '@app/screens/StartupScreen';
import 'expo-dev-client';
import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import 'react-native-gesture-handler';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
/**
 * TODO: Move this to FirebasePhoneUtils, as that is the proximate use case that is most important
 */
import AppLayout from '@app/AppLayout';
import {APP_CONFIG, APP_INFO, NOTIF_CHANNELS_CONTEXT} from './Config';
import {WaitDialogTool} from './components/WaitDialog';
import DevSettings from './screens/DevSettings';
import EditProfile from './screens/EditProfile';
import MinderList from './screens/MinderList';
import Onboarding from './screens/Onboarding';
import Projects from './screens/Projects';
import Redirector from './screens/Redirector';
import {ShortcutTool} from './util/Shortcuts';
import {UsingUiTools} from './util/UiTools';

filterHandledExceptions();

// TODO: Move this some place useful
function webDomChanges() {
  var style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.appendChild(document.createTextNode('input:focus {outline: none;}'));
  document.getElementsByTagName('head')[0].appendChild(style);
  // TODO: use epxo-font
  var link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute(
    'href',
    'https://fonts.googleapis.com/icon?family=Roboto+Condensed:400,700|Roboto:400,700;',
  );

  document.getElementsByTagName('head')[0].appendChild(link);
}
if (Platform.OS === 'web') {
  webDomChanges();
}

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
  MinderList,
  DevSettings,
  Onboarding,
  EditProfile,
  Projects,
  Redirector,
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
  IN_MEMORY_DATA_CACHE,
];

export default function App() {
  registerAppConfig(APP_CONFIG);
  initializeFirebase(FIREBASE_CONFIG);
  IdentityService.addProvider(googleAuthProvider(GOOGLE_LOGIN_CONFIG));
  registerIconPack('ion', Ionicons);
  registerIconPack('mci', MaterialCommunityIcons);
  usePaperComponents();

  setDefaultServerApi(firebaseFn);
  setClientFallbackEnabled(CLIENT_FALLBACK_ENABLED);

  const {navScreens, linkingScreens} = useReactNavScreens(
    ROUTES,
    AppLayout,
    Stack.Screen,
    {
      modal: {
        presentation: Platform.OS === 'web' ? 'transparentModal' : 'modal',
      },
      top: {animationEnabled: false},
      std: {animationEnabled: false},
    },
  );

  // For deep links
  const linking = {
    prefixes: ['npe.fb.com'],
    config: linkingScreens,
  };

  const navTheme = {
    colors: {...DefaultTheme.colors, background: 'rgba(0,0,0,0)'},
    dark: DefaultTheme.dark,
  };

  return (
    <AppContextProvider ctx={APP_CONTEXT}>
      <PaperProvider theme={BLACK_AND_WHITE} settings={{icon: Icon}}>
        <StatusContainer top={true}>
          <AuthConfig>
            <View style={S.background}>
              <SafeAreaProvider style={S.container}>
                <SimpleUserMessaging style={S.messaging} />
                <NavigationContainer linking={linking} theme={navTheme}>
                  <UsingUiTools tools={[ShortcutTool, WaitDialogTool]}>
                    <StatusBar style="auto" />
                    <NavContext routes={ROUTES} />
                    <Stack.Navigator
                      screenOptions={{headerShown: false}}
                      initialRouteName="StartupScreen">
                      {navScreens}
                    </Stack.Navigator>
                  </UsingUiTools>
                </NavigationContainer>
              </SafeAreaProvider>
            </View>
          </AuthConfig>
        </StatusContainer>
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
    bottom: 24,
    backgroundColor: '#E00000',
    borderRadius: 24,
    marginHorizontal: 60,
  },
  background: {flex: 1, backgroundColor: '#202020'},
});

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
