import React from 'react';
import {StyleSheet} from 'react-native';
import {User, requireLoggedInUser} from '@toolkit/core/api/User';
import {useDataStore} from '@toolkit/data/DataStore';
import DataTable from '@toolkit/ui/components/DataTable';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {actionHook} from '@app/admin/../../npe-toolkit/lib/core/client/Action';
import BroadcastNotificationModal from './BroadcastNotificationModal';
import SendNotificationModal from './SendNotificationModal';

type Props = {
  async: {
    users: User[];
  };
};

const NotificationsScreen: Screen<Props> = ({async: {users}}: Props) => {
  const nav = useNav();
  const {Row, TextCell, ButtonCell} = DataTable;

  return (
    <DataTable style={S.table}>
      {users.map((user, i) => (
        <Row key={i}>
          <TextCell title="Name" value={user.name} />
          <ButtonCell
            title="Notify"
            label="Send Push"
            labelStyle={{paddingHorizontal: 12}}
            onPress={() => nav.navTo(SendNotificationModal, {user})}
          />
        </Row>
      ))}
    </DataTable>
  );
};

NotificationsScreen.title = 'Notifications';

NotificationsScreen.load = async () => {
  requireLoggedInUser();
  const userStore = useDataStore(User);
  return {users: await userStore.getAll()};
};

const SHOW_BROADCAST_MODAL_ACTION = {
  id: 'showBroadcastModal',
  label: 'Send Broadcast',
  icon: 'oct:megaphone',
  action: actionHook(() => {
    const nav = useNav();
    return () => nav.navTo(BroadcastNotificationModal);
  }),
};

NotificationsScreen.actions = [SHOW_BROADCAST_MODAL_ACTION];

const S = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default NotificationsScreen;
