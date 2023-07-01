import {GetUser} from '@app/common/Api';
import {LoginUserInfo} from '@app/common/AppLogic';
import {Account} from '@toolkit/core/api/Auth';
import {useApi} from '@toolkit/core/api/DataApi';
import {useOnAllowlist} from '@toolkit/core/util/Access';
import {CodedError} from '@toolkit/core/util/CodedError';
import {FirebaseAuthService} from '@toolkit/providers/firebase/client/AuthService';
import firebase from 'firebase';
import React from 'react';

export default function AuthConfig(props: {children?: React.ReactNode}) {
  const getUser = useApi(GetUser);
  const getOnAllowlist = useOnAllowlist();

  /**
   * Use this method to create an instance of your app's user when they log in.
   */
  const userCallback = async (
    account: Account,
    firebaseAccount: firebase.User,
  ) => {
    throwIfInvalidAccount(firebaseAccount, account.id);
    const loginInfo = loginFields(firebaseAccount);
    const onAllowlist = await getOnAllowlist();

    // Note: All data access checks will fail if app is enforcing an allowlist
    // and user is not on the allowlist. This a just a nice error message.
    if (!onAllowlist) {
      throw new CodedError('npe.adhoc', "You're not on the guest list yet");
    }
    return await getUser(loginInfo);
  };

  return (
    <FirebaseAuthService userCallback={userCallback}>
      {props.children}
    </FirebaseAuthService>
  );
}

function throwIfInvalidAccount(
  firebaseAccount: firebase.User,
  expectedId: string,
) {
  if (
    firebaseAccount.uid !== expectedId ||
    (firebaseAccount.email == null && firebaseAccount.phoneNumber == null)
  ) {
    throw Error('Invalid account for login');
  }
}

function loginFields(firebaseAccount: firebase.User): LoginUserInfo {
  return {
    uid: firebaseAccount.uid,
    displayName: firebaseAccount.displayName,
    email: firebaseAccount.email,
    phoneNumber: firebaseAccount.phoneNumber,
    photoURL: firebaseAccount.photoURL,
  };
}
