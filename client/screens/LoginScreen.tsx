import {
  SimpleLoginScreenConfig,
  simpleLoginScreen,
} from '@toolkit/screens/login/LoginScreen';
import {Screen} from '@toolkit/ui/screen/Screen';
import {LOGIN_SCREEN_TOS} from '@app/common/Config';

const LOGIN_SCREEN_CONFIG: SimpleLoginScreenConfig = {
  title: 'Welcome to Minders',
  subtitle: 'Keep focused!',
  authTypes: ['google', 'phone'],
  home: 'Minders',
  onboarding: 'Onboarding',
  tos: LOGIN_SCREEN_TOS,
};

const LoginScreen: Screen<{}> = simpleLoginScreen(LOGIN_SCREEN_CONFIG);
LoginScreen.style = {type: 'top', nav: 'none'};

export default LoginScreen;
