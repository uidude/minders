import * as React from 'react';
import {Image, Linking, StyleSheet, Text, View} from 'react-native';
import AppIcon from '@assets/splash.png';
import Constants from 'expo-constants';
import {useAuth} from '@toolkit/core/api/Auth';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {FIREBASE_CONFIG} from '@app/common/Config';
import Minders from '@app/screens/Minders';
import {useDontAnimate} from '@app/util/Useful';
import LoginScreen from './LoginScreen';

/**
 * Checks that new apps have been initiatlized sufficiently so that they can run.
 * If not initialized, returns a string listing steps to take, and startup screen
 * will stay instead of redirecting to full app.
 *
 * You can delete this after the checks have been satisfied.
 */
function newAppChecks() {
  const checks = [];

  if (FIREBASE_CONFIG.projectId === 'fill-me-in') {
    checks.push({
      link: 'https://github.com/facebookincubator/npe-toolkit/blob/main/docs/getting-started/Firebase.md',
      text: 'Configure Firebase',
    });
  }

  return {
    passed: checks.length === 0,
    checks,
  };
}

/**
 * Screen shown during initial async initialization
 */
const StartupScreen: Screen<{}> = () => {
  const nav = useNav();
  const auth = useAuth();
  const appChecks = newAppChecks();
  const dontAnimateNextTransition = useDontAnimate();

  // Async initialization that occurs before redirecting to main app
  async function waitForInitialization() {
    if (appChecks.passed) {
      dontAnimateNextTransition();
      const user = await auth.getLoggedInUser();
      if (user == null) {
        nav.reset(LoginScreen);
        return;
      }
      nav.reset(Minders);
    }
  }

  React.useEffect(() => {
    waitForInitialization();
  }, []);

  return (
    <View style={{flex: 1}}>
      <View style={S.appChecks}>
        {!appChecks.passed && (
          <View>
            <Text style={{fontWeight: 'bold', lineHeight: 24, fontSize: 18}}>
              Additional app setup needed
            </Text>
            {appChecks.checks.map((check, idx) => (
              <Text style={{lineHeight: 28, fontSize: 16}} key={idx}>
                ⦿{'  '}
                <Text
                  style={{textDecorationLine: 'underline'}}
                  onPress={() => Linking.openURL(check.link)}>
                  {check.text}
                </Text>
              </Text>
            ))}
          </View>
        )}
      </View>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: Constants.manifest?.splash?.backgroundColor,
            opacity: 1,
          },
        ]}>
        <Image
          style={{
            width: '100%',
            height: '100%',
            resizeMode: Constants.manifest?.splash?.resizeMode || 'contain',
          }}
          source={AppIcon}
        />
      </View>
    </View>
  );
};
StartupScreen.title = 'Minders';
StartupScreen.style = {nav: 'none'};

const S = StyleSheet.create({
  appChecks: {
    position: 'absolute',
    width: '100%',
    padding: 32,
    zIndex: 40,
  },
});

export default StartupScreen;
