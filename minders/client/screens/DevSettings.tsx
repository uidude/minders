/**
 * TODO: Describe what this screen is doing :)
 */

import * as React from 'react';
import {Linking, ScrollView, StyleSheet, View} from 'react-native';
import {Checkbox} from 'react-native-paper';
import {useApi} from '@toolkit/core/api/DataApi';
import {Flag, useFlags} from '@toolkit/core/api/Flags';
import {
  ConsoleLoggerEnabled,
  eventToString,
  getDevLogs,
} from '@toolkit/core/api/Log';
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
import {AdminExportTrigger, TestNotif} from '@app/common/Api';
import {Profile} from '@app/common/DataTypes';
import {registerForPushNotificationsAsync} from '@app/util/Notifications';
import {downloadOrShareJson} from '@app/util/Useful';
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

      <FlagSection />
      <ExportSection />
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

function ExportSection() {
  const {Body, H2, Button} = useComponents();
  const adminExport = useApi(AdminExportTrigger);
  const [onExport, exporting] = useAction(tryExport);
  const [exported, setExported] = React.useState<{name: string; url: string}>();

  async function tryExport() {
    const res = await adminExport();
    setExported(res);
  }

  async function download() {
    if (exported) {
      downloadOrShareJson(exported.name, exported.url);
      // Linking.openURL(exported.url);
    }
  }

  return (
    <>
      <H2 style={{marginTop: 12}}>Export Tools</H2>
      {exported && !exporting && <Body>Exported file: {exported.name}</Body>}

      <View style={S.buttonRow}>
        <Button onPress={onExport} loading={exporting} style={S.button}>
          Trigger Export
        </Button>
        {exported && (
          <Button type="primary" onPress={download} style={S.button}>
            Download
          </Button>
        )}
      </View>
    </>
  );
}

/**
 * Turn a developer ID into a semi-human-readable string, by adding spaces before capitals
 * that aren't at start or repeated.
 *
 * We can probably make this more robust in future for other types of Ids
 */
function toHumanReadable(flag: Flag<boolean>) {
  return flag.id.replace(/(\b[A-Z])(?=[^A-Z])/g, ' $1');
}

function FlagSection() {
  const flagsToShow = [ConsoleLoggerEnabled];
  const {Body, H2} = useComponents();
  const flags = useFlags();
  const [refresh, setRefresh] = React.useState(0);

  async function toggle(flag: Flag<boolean>) {
    await flags.set(flag, !flags.enabled(flag));
    setRefresh(refresh + 1);
  }

  function checked(flag: Flag<boolean>) {
    return flags.enabled(flag) ? 'checked' : 'unchecked';
  }

  return (
    <View style={{marginBottom: 12}}>
      <H2 style={{marginTop: 12}}>Flags</H2>
      {flagsToShow.map(flag => (
        <View style={S.checkRow} key={flag.id}>
          <Checkbox status={checked(flag)} onPress={() => toggle(flag)} />
          <Body style={{marginLeft: 6}}>{toHumanReadable(flag)}</Body>
        </View>
      ))}
    </View>
  );
}

function delayString(delay: number) {
  return delay === 0 ? '' : `${delay}`;
}

const S = StyleSheet.create({
  container: {
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
    minWidth: 80,
    marginLeft: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  log: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
});

export default DevSettings;
