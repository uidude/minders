import {BroadcastNotif, SendAdminNotif, TestNotif} from '@app/common/Api';
import {NOTIF_CHANNELS} from '@app/common/NotifChannels';
import {User} from '@toolkit/core/api/User';
import {getAdminDataStore} from '@toolkit/providers/firebase/server/Firestore';
import {registerHandler} from '@toolkit/providers/firebase/server/Handler';
import {
  apnsToFCMToken,
  getSender,
} from '@toolkit/providers/firebase/server/PushNotifications';
import {PushToken} from '@toolkit/services/notifications/NotificationTypes';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
const {defineSecret} = require('firebase-functions/params');

const notificationApiKey = defineSecret('fcm_server_key');

async function convertPushTokenImpl(pushToken: PushToken) {
  if (pushToken.type !== 'ios') {
    return;
  }

  const apnsToken = pushToken.token;
  functions.logger.debug('Converting token: ', apnsToken);
  const fcmTokenResp = Object.values(
    await apnsToFCMToken(
      pushToken.sandbox ? 'com.uidude.minders' : 'com.uidude.minders',

      notificationApiKey.value(),
      [apnsToken],
      pushToken.sandbox,
    ),
  );
  if (fcmTokenResp.length !== 1) {
    throw new Error('Unexpected response when converting APNs token to FCM');
  }
  const fcmToken = fcmTokenResp[0];
  return fcmToken;
}

/**
 * Send a test notification to the device associated with the
 * push token passed in. This is the simplest "lights-on" test that
 * notifications is working - if this fails then there are likely
 * configuration issues.
 *
 * TODO: Add link to notification setup docs
 */
export const testNotif = registerHandler(
  TestNotif,
  async (pushToken: PushToken) => {
    const fcm = await convertPushTokenImpl(pushToken);
    if (!fcm) {
      return;
    }
    functions.logger.debug('Got FCM Token: ', fcm);
    const payload = {
      notification: {title: 'Ahoy!', body: 'We have contact 🚀'},
    };
    const resp = await admin.messaging().sendToDevice(fcm, payload);
    functions.logger.debug(resp.results[0]);
  },
  {secrets: [notificationApiKey]},
);

export const convertPushToken = functions
  .runWith({secrets: [notificationApiKey]})
  .firestore.document('instance/minders/push_tokens/{token}')
  .onCreate(async (change, context) => {
    if (change.get('type') !== 'ios') {
      return;
    }

    const apnsToken = change.get('token');
    const fcmTokenResp = Object.values(
      await apnsToFCMToken(
        change.get('sandbox') ? 'com.uidude.minders' : 'com.uidude.minders',
        notificationApiKey.value(),
        [apnsToken],
        change.get('sandbox'),
      ),
    );
    if (fcmTokenResp.length !== 1) {
      throw new Error('Unexpected response when converting APNs token to FCM');
    }
    const fcmToken = fcmTokenResp[0];

    return change.ref.set({fcmToken}, {merge: true});
  });

export const sendAdminNotif = registerHandler(
  SendAdminNotif,
  async ({user, title, body}) => {
    functions.logger.debug('<<<HELLO!>>>');
    const channel = NOTIF_CHANNELS.admin;
    const send = getSender();
    await send(user.id, channel, {title: title != null ? title : ''}, {body});
  },
  {allowedRoles: ['admin']},
);

export const broadcastNotif = registerHandler(
  BroadcastNotif,
  async ({title = '', body}) => {
    const channel = NOTIF_CHANNELS.admin;
    const userStore = await getAdminDataStore(User);
    const allUsers = await userStore.getAll();
    const send = getSender();

    await Promise.all(
      allUsers.map(user => send(user.id, channel, {title}, {body})),
    );
  },
  {allowedRoles: ['admin']},
);
