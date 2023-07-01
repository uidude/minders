import {User} from '@toolkit/core/api/User';
import {Opt} from '@toolkit/core/util/Types';
import {useDataStore} from '@toolkit/data/DataStore';
import {AllowlistEntry} from '@toolkit/tbd/Allowlist';
import {Profile} from './DataTypes';

function newProfileFor(user: User): Partial<Profile> {
  return {
    id: user.id,
    user: user,
    name: user.name,
    ...(user.pic && {pic: user.pic}),
  };
}

function addDerivedFields(user: User, allowlist?: AllowlistEntry) {
  user.canLogin = true;
  if (user.name === '') {
    user.canLogin = false;
    user.cantLoginReason = 'onboarding';
  }
  user.roles = {id: user.id, roles: allowlist?.roles ?? []};
}

export type LoginUserInfo = {
  uid: string;
  displayName: Opt<string>;
  email: Opt<string>;
  phoneNumber: Opt<string>;
  photoURL: Opt<string>;
};

/**
 * Client version of creating user - this is for early development,
 * should switch to a server-based version for launch
 */
export function useGetOrCreateUser() {
  const users = useDataStore(User);
  const profiles = useDataStore(Profile);
  const allowlists = useDataStore(AllowlistEntry);

  return async (firebaseAccount: LoginUserInfo): Promise<User> => {
    const userId = firebaseAccount.uid;

    let [user, profile, allowlist] = await Promise.all([
      users.get(userId),
      profiles.get(userId),
      allowlists.query({
        where: [{field: 'user', op: '==', value: userId}],
      }),
    ]);

    if (user != null && profile != null) {
      addDerivedFields(user, allowlist[0]);
      return user;
    }

    const initialName =
      firebaseAccount.displayName || firebaseAccount.email || '';

    const newUser: User = {
      id: userId,
      name: initialName,
      pic: firebaseAccount.photoURL || undefined,
      email: firebaseAccount.email || undefined,
    };

    const newProfile = newProfileFor(newUser);

    // We have an example of doing these in a transaction (in server code)
    // but for simplicity, will make separate calls.
    if (user == null) {
      user = await users.create(newUser);
      addDerivedFields(user, allowlist[0]);
    }

    if (profile == null) {
      await profiles.create(newProfile);
      user.canLogin = false;
      user.cantLoginReason = 'onboarding';
    }

    return user;
  };
}

export function useUpdateUserAndProfile() {
  const userStore = useDataStore(User);
  const profileStore = useDataStore(Profile);

  return async function updateUserAndProfile(
    id: string,
    user: Partial<User>,
    profile: Partial<Profile>,
  ) {
    // Ensure user` has updated before updating profile
    console.log('user', {...user, id});
    await userStore.update({...user, id});

    const userFieldsToCopy = {
      name: user.name,
      ...(user.pic && {pic: user.pic}),
    };
    // TODO: Consider using transactions
    console.log('profile', {...profile, ...userFieldsToCopy, id});
    await profileStore.update({...profile, ...userFieldsToCopy, id});
    console.log('updato');
  };
}
