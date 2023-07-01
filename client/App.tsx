import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SimpleUserMessaging} from '@toolkit/core/client/Status';
import {filterHandledExceptions} from '@toolkit/core/util/Environment';
import {
  NavContext,
  useReactNavScreens,
} from '@toolkit/providers/navigation/ReactNavigation';
import PhoneInput from '@toolkit/screens/login/PhoneInput';
import PhoneVerification from '@toolkit/screens/login/PhoneVerification';
import {NotificationSettings} from '@toolkit/screens/settings/NotificationSettings';
import {Routes} from '@toolkit/ui/screen/Nav';
import WebViewScreen from '@toolkit/ui/screen/WebScreen';
import AppLayout from '@app/AppLayout';
import AboutScreen from '@app/screens/AboutScreen';
import LoginScreen from '@app/screens/LoginScreen';
import SettingsScreen from '@app/screens/SettingsScreen';
import StartupScreen from '@app/screens/StartupScreen';
import 'expo-dev-client';
import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppConfig from './AppConfig';
import {SnoozerChooser} from './components/SnoozerChooser';
import DevSettings from './screens/DevSettings';
import EditProfile from './screens/EditProfile';
import Minders from './screens/Minders';
import Onboarding from './screens/Onboarding';
import Projects from './screens/Projects';
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
  NotificationSettings,
  Minders,
  DevSettings,
  Onboarding,
  EditProfile,
  Projects,
};
const Stack = createStackNavigator();

export default function App() {
  const {navScreens, linkingScreens} = useReactNavScreens(
    ROUTES,
    AppLayout,
    Stack.Screen,
    {
      modal: {
        presentation: Platform.OS === 'web' ? 'transparentModal' : 'modal',
      },
      top: {animationEnabled: false},
      std: {},
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
    <AppConfig>
      <View style={S.background}>
        <SafeAreaProvider style={S.container}>
          <SimpleUserMessaging style={S.messaging} />
          <NavigationContainer linking={linking} theme={navTheme}>
            <UsingUiTools tools={[ShortcutTool, SnoozerChooser]}>
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
    </AppConfig>
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
