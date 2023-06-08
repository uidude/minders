import {
  SimpleLoginScreenConfig,
  simpleLoginScreen,
} from '@toolkit/screens/login/LoginScreen';
import {Screen} from '@toolkit/ui/screen/Screen';

const TOS =
  "By continuing, you'll need to accept our " +
  '[Terms of Service](https://media.istockphoto.com/id/482103289/photo/clown-laywer.jpg?s=612x612&w=0&k=20&c=aHoyN4YAeyzTd5yLyt0WBQskRce-G9rkepA_TX3_RHs=), ' +
  "although they haven't quite been defined quite yet.";

const LOGIN_SCREEN_CONFIG: SimpleLoginScreenConfig = {
  title: 'Welcome to Minders',
  subtitle: 'Keep focused!',
  authTypes: ['google', 'phone'],
  home: 'Redirector',
  tos: TOS,
};

const LoginScreen: Screen<{}> = simpleLoginScreen(LOGIN_SCREEN_CONFIG);
LoginScreen.style = {type: 'top', nav: 'none'};

export default LoginScreen;
