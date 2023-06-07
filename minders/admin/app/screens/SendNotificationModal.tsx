import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {useApi} from '@toolkit/core/api/DataApi';
import {User} from '@toolkit/core/api/User';
import {useAction} from '@toolkit/core/client/Action';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {useComponents} from '@toolkit/ui/components/Components';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {SendAdminNotif} from '@app/common/Api';

type Props = {user: User};
const SendNotificationModal: Screen<Props> = ({user}: Props) => {
  const [TitleField, title] = useTextInput('');
  const [BodyField, body] = useTextInput('');
  const {Title, Subtitle, Button} = useComponents();
  const [onSend, sending] = useAction('SendNotification', sendNotification);

  const nav = useNav();
  const sendAdminNotif = useApi(SendAdminNotif);

  async function sendNotification() {
    await sendAdminNotif({user, title, body});
    nav.back();
  }

  function isDisabled() {
    return body === '' || sending;
  }

  return (
    <View style={S.modal}>
      <Title>Send Push</Title>
      <Subtitle>To: {user.name}</Subtitle>
      <Subtitle>ID: {user.id}</Subtitle>
      <View style={{height: 10}} />
      <TitleField type="primary" label="Title" style={S.input} />
      <BodyField type="primary" label="Body" style={S.input} />
      <View style={S.modalFooter}>
        <Button type="tertiary" onPress={nav.back}>
          Cancel
        </Button>
        <Button
          onPress={onSend}
          loading={sending}
          disabled={isDisabled()}
          type="primary">
          Send
        </Button>
      </View>
    </View>
  );
};

SendNotificationModal.style = {
  type: 'modal',
  nav: 'none',
};

const S = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    minWidth: 500,
    alignSelf: 'center',
    borderRadius: 7,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignContent: 'center',
    marginTop: 20,
  },
  input: {
    height: 40,
    marginTop: 10,
  },
});

export default SendNotificationModal;
