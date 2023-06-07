import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {Title} from 'react-native-paper';
import {useApi} from '@toolkit/core/api/DataApi';
import {useAction} from '@toolkit/core/client/Action';
import Banner from '@toolkit/screens/admin/BroadcastNotificationModal';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {useComponents} from '@toolkit/ui/components/Components';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {useBackgroundStatus} from '@app/admin/../../npe-toolkit/lib/core/client/Status';
import {BroadcastNotif} from '@app/common/Api';

const BroadcastNotificationModal: Screen<{}> = () => {
  const [TitleInput, title] = useTextInput('');
  const [BodyInput, body] = useTextInput('');
  const {setMessage} = useBackgroundStatus();
  const nav = useNav();
  const [sendNotifAction, sending] = useAction(sendNotif);
  const sendBroadcast = useApi(BroadcastNotif);
  const {Button} = useComponents();

  async function sendNotif() {
    await sendBroadcast({title, body});
    nav.back();
    setMessage('Notification sent');
  }

  return (
    <View style={S.modal}>
      <Title>Send Push to all users</Title>
      <Banner
        iconProps={{name: 'ion:warning', color: 'white'}}
        color="#eed202"
        text="This will send a push notification to all users. Please use carefully"
      />
      <TitleInput type="primary" label="Title" style={{marginTop: 10}} />
      <BodyInput type="primary" label="Body" style={{marginTop: 10}} />
      <View style={S.modalFooter}>
        <Button type="secondary" onPress={nav.back}>
          Cancel
        </Button>
        <View style={{width: 10}} />
        <Button
          onPress={sendNotifAction}
          loading={sending}
          disabled={body === '' || sending}
          type="primary">
          Send
        </Button>
      </View>
    </View>
  );
};

BroadcastNotificationModal.style = {
  type: 'modal',
  nav: 'none',
};

const S = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    width: 550,
    alignSelf: 'center',
    borderRadius: 7,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignContent: 'center',
    marginTop: 20,
  },
});

export default BroadcastNotificationModal;
