import {
  AdminExportTrigger,
  ExportJob,
  GetUser,
  UpdateUser,
} from '@app/common/Api';
import {Profile} from '@app/common/DataTypes';
import {User, UserRoles} from '@toolkit/core/api/User';
import {CodedError} from '@toolkit/core/util/CodedError';
import {Updater, useDataStore} from '@toolkit/data/DataStore';
import {
  requireAccountInfo,
  requireLoggedInUser,
  requireRole,
  setAccountToUserCallback,
} from '@toolkit/providers/firebase/server/Auth';
import {registerHandler} from '@toolkit/providers/firebase/server/Handler';
import {getAllowlistMatchedRoles} from '@toolkit/providers/firebase/server/Roles';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {AuthData} from 'firebase-functions/lib/common/providers/https';
import {Minder, MinderProject, useMinderStore} from '@app/common/MinderApi';
import 'firebase/functions';
import {getFunction, toThrownError} from './lib';

// Uncomment the next line to enable notifications
// export * from './notifications'

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
  const userStore = useDataStore(User);
  const profileStore = useDataStore(Profile);
  const userId = auth.uid;

  let [user, profile] = await Promise.all([
    userStore.get(userId, {edges: [UserRoles]}),
    profileStore.get(userId),
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
    user = await userStore.create(newUser);
    addDerivedFields(user);
  }

  if (profile == null) {
    await profileStore.create(newProfile);
  }

  // Todo: Give higher privileges to set roles
  const roleStore = useDataStore(UserRoles);

  // TODO: Re-enable transactions when we have a clean way of supporting
  await userStore.create({...newUser, roles: {id: newUser.id}});
  await profileStore.create(newProfile);
  await roleStore.create({roles, id: newUser.id});

  const createdUser = await userStore.get(newUser.id, {edges: [UserRoles]});
  addDerivedFields(createdUser!);
  return createdUser!;
}
setAccountToUserCallback(accountToUser);

export const getUser = registerHandler(GetUser, async () => {
  const account = requireAccountInfo();
  const userStore = useDataStore(User);
  const user = await userStore.required(account.uid, {edges: [UserRoles]});
  addDerivedFields(user);
  return user;
});

export const updateUser = registerHandler(
  UpdateUser,
  async (values: Updater<User>) => {
    const user = requireLoggedInUser();
    const userStore = useDataStore(User);
    const profileStore = useDataStore(Profile);
    // This should be also checked by firestore rules so could remove
    if (values.id != user.id) {
      // TODO: coded typed error
      throw new Error('Not allowed');
    }
    // TODO: Re-enable transaction
    const profileValues = newProfileFor(values);
    userStore.update(values);
    profileStore.update(profileValues);

    const updatedUser = await userStore.get(values.id);
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

async function exportProject(
  projectId: string,
  mindersApi: ReturnType<typeof useMinderStore>,
  userId: string,
  date: Date,
) {
  const {name, json} = await mindersApi.exportProject(projectId);
  const url = await saveBackupFile(json, userId, 'project', name, date);
  return {name, url, json};
}

async function saveBackupFile(
  jsonStr: string,
  userId: string,
  type: string,
  name: string,
  date: Date,
) {
  const storage = admin.storage();
  const datestr = date.toLocaleString('en-CA', {
    timeZone: 'America/Los_Angeles',
    hour12: false,
  });
  const filename = `[${datestr}] ${name}`
    .replace(/,/g, '')
    .replace(/\//g, '-')
    .replace(/\:/g, '-');

  const path = `minders/backup/${userId}/${type}/${filename}.json`;

  const file = storage.bucket().file(path);
  await file.save(jsonStr);
  await file.setMetadata({
    contentType: 'application/json',
    cacheControl: 'private,max-age=86400',
  });
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 86400,
    responseDisposition: 'attachment',
  });
  return url;
}

export const exportJob = registerHandler(ExportJob, async () => {
  requireRole('export');

  functions.logger.log('Running Exporter');
  // TODO: Use context based on the specific user
  const minderStore = useDataStore(Minder);
  const projectStore = useDataStore(MinderProject);

  // TODO: Iterate through all user IDs
  const userId = 'MmiLowCe0Ye221H7m2oqKLrfUjC2';
  const minderCtx = {minderStore, projectStore, user: {id: userId}};

  // TODO: Switch to using server-side app context
  const mindersApi = useMinderStore(minderCtx);
  const projects = await mindersApi.getProjects();

  let result = {name: '', url: ''};
  const date = new Date(Date.now());
  const results = await Promise.all(
    projects.map(p => exportProject(p.id, mindersApi, userId, date)),
  );

  const fullBackup = {
    userId: userId,
    projects: results.map(r => JSON.parse(r!.json)),
  };

  const fullJson = JSON.stringify(fullBackup, null, 2);
  const url = await saveBackupFile(fullJson, userId, 'all', 'Backup', date);
  return {name: 'Backup', url};
});

export const adminExportTrigger = registerHandler(
  AdminExportTrigger,
  async () => {
    const user = requireLoggedInUser();
    const exportJob = await getFunction(ExportJob, 'export');
    try {
      const result = await exportJob();
      return result;
    } catch (e: any) {
      throw toThrownError(e);
    }
  },
);
