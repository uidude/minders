/**
 * TODO: Describe what this screen is doing :)
 */

import {TestNotif} from '@app/common/Api';
import {Profile} from '@app/common/DataTypes';
import {registerForPushNotificationsAsync} from '@app/lib/Notifications';
import {useApi} from '@toolkit/core/api/DataApi';
import {eventToString, getDevLogs} from '@toolkit/core/api/Log';
import {User, requireLoggedInUser} from '@toolkit/core/api/User';
import {useAction} from '@toolkit/core/client/Action';
import {useBackgroundStatus} from '@toolkit/core/client/Status';
import {AdhocError} from '@toolkit/core/util/CodedError';
import {
  getNetworkDelayMs,
  useSetNetworkDelay,
} from '@toolkit/core/util/DevUtil';
import {getRequired, useDataStore} from '@toolkit/data/DataStore';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {useComponents} from '@toolkit/ui/components/Components';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import * as React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import Onboarding from './Onboarding';

type Props = {
  async: {
    networkDelay: number;
    user: User;
    profile: Profile;
  };
};

const DevSettings: Screen<Props> = props => {
  requireLoggedInUser();
  const {networkDelay, user, profile} = props.async;
  const delayText = delayString(networkDelay);
  const {Body, H2} = useComponents();
  const {Button} = useComponents();
  const [DelayField, newDelay, setDelayText] = useTextInput(delayText);
  const setNetworkDelay = useSetNetworkDelay();
  const sendTestNotification = useApi(TestNotif);
  const [notify, sending] = useAction('TestNotification', testNotif);
  const {setMessage} = useBackgroundStatus();
  const {navTo} = useNav();
  const devLogs = getDevLogs();
  const [showLogs, setShowLogs] = React.useState(false);

  async function testNotif() {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) {
      throw AdhocError('Failed to get push token');
    }
    const req = {
      token: pushToken.data,
      type: pushToken.type,
      sandbox: false,
    };
    await sendTestNotification(req);
  }

  async function setDelay() {
    const delay = parseInt(newDelay, 10);
    if (!isNaN(delay)) {
      await setNetworkDelay(delay);
      setMessage(`Network delay set to ${delay}ms`);
    }
  }

  async function clearDelay() {
    await setNetworkDelay(0);
    setDelayText('');
    setMessage(`Cleared network delay`);
  }

  return (
    <ScrollView style={S.container}>
      <H2>Notifications</H2>
      <Body>Test that notifications are working end-to-end</Body>
      <Button
        type="secondary"
        onPress={notify}
        loading={sending}
        style={S.button}>
        Send Test Notification
      </Button>
      <H2 style={{marginTop: 12}}>Network Delay</H2>
      <DelayField label="Delay in milliseconds" type="primary" />
      <View style={S.buttonRow}>
        <Button type="tertiary" onPress={clearDelay} style={S.button}>
          Clear Delay
        </Button>
        <View style={{width: 12}} />
        <Button type="secondary" onPress={setDelay} style={S.button}>
          Set
        </Button>
      </View>

      <H2 style={{marginTop: 12}}>Onboarding</H2>
      <Button
        type="secondary"
        onPress={() => navTo(Onboarding, {user})}
        style={S.button}>
        Test Onboarding
      </Button>

      <H2 style={{marginTop: 12}}>App Logs</H2>
      <Button onPress={() => setShowLogs(!showLogs)} style={S.button}>
        {showLogs ? 'Hide' : 'Show'}
      </Button>
      {showLogs && (
        <View style={{marginTop: 12}}>
          {devLogs.reverse().map((event, i) => (
            <View key={i} style={S.log}>
              <Body>{eventToString(event).replace(', ', '\n')}</Body>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};
DevSettings.title = 'Dev Settings';

DevSettings.load = async () => {
  const user = requireLoggedInUser();
  const profileStore = useDataStore(Profile);
  const [networkDelay, profile] = await Promise.all([
    getNetworkDelayMs(),
    getRequired(profileStore, user.id),
  ]);

  return {networkDelay, profile, user};
};

function delayString(delay: number) {
  return delay === 0 ? '' : `${delay}`;
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
  },
  row: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    alignSelf: 'flex-end',
    marginTop: 20,
    minWidth: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  log: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
});

export default DevSettings;
