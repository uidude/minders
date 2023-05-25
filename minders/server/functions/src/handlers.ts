import {ExportJob, GetUser, UpdateUser} from '@app/common/Api';
import {Profile} from '@app/common/DataTypes';
import {ApiKey, serverApi} from '@toolkit/core/api/DataApi';
import {User, UserRoles} from '@toolkit/core/api/User';
import {CodedError} from '@toolkit/core/util/CodedError';
import {Updater, getRequired} from '@toolkit/data/DataStore';
import {firebaseStore} from '@toolkit/providers/firebase/DataStore';
import {
  requireAccountInfo,
  requireLoggedInUser,
  requireRole,
  setAccountToUserCallback,
} from '@toolkit/providers/firebase/server/Auth';
import {getFirebaseConfig} from '@toolkit/providers/firebase/server/Config';
import {getDataStore} from '@toolkit/providers/firebase/server/Firestore';
import {registerHandler} from '@toolkit/providers/firebase/server/Handler';
import {getAllowlistMatchedRoles} from '@toolkit/providers/firebase/server/Roles';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {AuthData} from 'firebase-functions/lib/common/providers/https';

import 'firebase/functions';
import {getFunction, toThrownError} from './lib';

// Uncomment the next line to enable notifications
// export * from './notifications'

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

export const scheduled = functions.pubsub
  .schedule('every hour')
  .onRun(async () => {
    functions.logger.log('Running scheduled export');
    const exportJob = await getFunction(ExportJob, 'export');
    try {
      await exportJob();
    } catch (e: any) {
      throw toThrownError(e);
    }
  });

export const exportJob = registerHandler(ExportJob, async () => {
  requireRole('export');

  // TODO: Add export logic
  functions.logger.log('Running Exporter');
});

/**
 * Endpoint for manually triggering the export handler.
 * TODO: Expose with role-based access in admin console.
 */
export const AdminExportTrigger = serverApi<void, void>('adminExportTrigger');

export const adminExportTrigger = registerHandler(
  AdminExportTrigger,
  async () => {
    functions.logger.log('Trying to call Exporter');

    const exportJob = await getFunction(ExportJob, 'export');
    try {
      const result = await exportJob();
      functions.logger.log('Result', result);
    } catch (e: any) {
      throw toThrownError(e);
    }
  },
);
