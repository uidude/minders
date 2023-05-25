import {
  BroadcastNotif,
  GetUser,
  SendAdminNotif,
  TestNotif,
  UpdateUser,
} from '@app/common/Api';
import {Profile} from '@app/common/DataTypes';
import {NOTIF_CHANNELS} from '@app/common/NotifChannels';
import {User, UserRoles} from '@toolkit/core/api/User';
import {CodedError} from '@toolkit/core/util/CodedError';
import {Updater, getRequired} from '@toolkit/data/DataStore';
import {firebaseStore} from '@toolkit/providers/firebase/DataStore';
import {
  requireAccountInfo,
  requireLoggedInUser,
  setAccountToUserCallback,
} from '@toolkit/providers/firebase/server/Auth';
import {getFirebaseConfig} from '@toolkit/providers/firebase/server/Config';
import {
  getAdminDataStore,
  getDataStore,
} from '@toolkit/providers/firebase/server/Firestore';
import {registerHandler} from '@toolkit/providers/firebase/server/Handler';
import {
  apnsToFCMToken,
  getSender,
} from '@toolkit/providers/firebase/server/PushNotifications';
import {getAllowlistMatchedRoles} from '@toolkit/providers/firebase/server/Roles';
import {PushToken} from '@toolkit/services/notifications/NotificationTypes';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {AuthData} from 'firebase-functions/lib/common/providers/https';
const {defineSecret} = require('firebase-functions/params');

const notificationApiKey = defineSecret('fcm_server_key');
const firebaseConfig = getFirebaseConfig();

function newProfileFor(user: Updater<User>): Updater<Profile> {
  const id = user.id!;
  return {
    id,
    user: {id},
    name: user.name,
    ...(user.pic && {pic: user.pic}),
  };
}

function addDerivedFields(user: User) {
  user.canLogin = true;
}

/**
 * Convert Firebase Auth account to User
 */
async function accountToUser(auth: AuthData): Promise<User> {
  // TODO: Make `firestore` role-based (e.g. firestoreForRole('ACCOUNT_CREATOR'))
  // @ts-ignore
  const users = await getDataStore(User);
  const profiles = await getDataStore(Profile);
  const userId = auth.uid;

  let [user, profile] = await Promise.all([
    users.get(userId, {edges: [UserRoles]}),
    profiles.get(userId),
  ]);
  const roles = await getAllowlistMatchedRoles(auth);
  if (user != null && profile != null) {
    if (!user.roles) {
      user.roles = {id: user.id, roles: []};
    }
    user.roles.roles = user.roles.roles ?? [];
    user.roles.roles.push(...roles);
    addDerivedFields(user);
    functions.logger.debug(user, roles);
    return user;
  }

  // TODO: Potentially fix this logic
  // If the user matches any role, make them a user.
  if (roles.length === 0) {
    throw new CodedError('AUTH.ERROR', 'You are not in allowlist');
  }

  const firebaseAccount = auth.token!;

  const name =
    firebaseAccount.displayName ||
    firebaseAccount.email ||
    firebaseAccount.phoneNumber ||
    'No Name';

  const newUser: User = {
    id: auth.uid,
    name,
    pic: firebaseAccount.picture || undefined,
    email: firebaseAccount.email || undefined,
  };

  const newProfile = newProfileFor(newUser);

  // We have an example of doing these in a transaction (in server code)
  // but for simplicity, will make separate calls.
  if (user == null) {
    user = await users.create(newUser);
    addDerivedFields(user);
  }

  if (profile == null) {
    await profiles.create(newProfile);
  }

  //return user;

  const fs = admin.firestore();
  await fs.runTransaction(async (txn: any) => {
    // @ts-ignore: hack to pass in `transaction`
    const userStoreInTxn = firebaseStore(User, fs, txn, firebaseConfig);
    // @ts-ignore: ditto
    const profileStoreInTxn = firebaseStore(Profile, fs, txn, firebaseConfig);
    // @ts-ignore: ditto
    const rolesStoreInTxn = firebaseStore(UserRoles, fs, txn, firebaseConfig);

    userStoreInTxn.create({...newUser, roles: {id: newUser.id}});
    profileStoreInTxn.create(newProfile);
    rolesStoreInTxn.create({roles, id: newUser.id});
  });

  const createdUser = await users.get(newUser.id, {edges: [UserRoles]});
  addDerivedFields(createdUser!);
  return createdUser!;
}
setAccountToUserCallback(accountToUser);

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

export const getUser = registerHandler(GetUser, async () => {
  const account = requireAccountInfo();
  const store = await getDataStore(User);
  const user = await getRequired(store, account.uid, {edges: [UserRoles]});
  addDerivedFields(user);
  return user;
});

export const updateUser = registerHandler(
  UpdateUser,
  async (values: Updater<User>) => {
    const user = requireLoggedInUser();
    // This should be also checked by firestore rules so could remove
    if (values.id != user.id) {
      // TODO: coded typed error
      throw new Error('Not allowed');
    }
    const fs = admin.firestore();
    await fs.runTransaction(async txn => {
      // @ts-ignore: hack to pass in `transaction`
      const userStoreInTxn = firebaseStore(User, fs, txn, firebaseConfig);
      // @ts-ignore: ditto
      const profileStoreInTxn = firebaseStore(Profile, fs, txn, firebaseConfig);
      const profileValues = newProfileFor(values);
      userStoreInTxn.update(values);
      profileStoreInTxn.update(profileValues);
    });
    const store = await getDataStore(User);
    const updatedUser = await store.get(values.id);
    addDerivedFields(updatedUser!);
    return updatedUser!;
  },
);

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
