import React from 'react';
import firebase from 'firebase';
import {Account} from '@toolkit/core/api/Auth';
import {useApi} from '@toolkit/core/api/DataApi';
import {useBackgroundStatus} from '@toolkit/core/client/Status';
import {useHasAdminRole} from '@toolkit/core/util/Access';
import {FirebaseAuthService} from '@toolkit/providers/firebase/client/AuthService';
import {UnauthorizedError} from '@toolkit/tbd/CommonErrors';
import {GetUser} from '@app/common/Api';
import {LoginUserInfo} from '@app/common/AppLogic';

export default function AuthConfig(props: {children?: React.ReactNode}) {
  const getUser = useApi(GetUser);
  const hasAdminRole = useHasAdminRole();

  /**
   * Use this method to create an instance of your app's user when they log in.
   */
  const userCallback = async (
    account: Account,
    firebaseAccount: firebase.User,
  ) => {
    throwIfInvalidAccount(firebaseAccount, account.id);
    const loginInfo = loginFields(firebaseAccount);
    const isAdmin = await hasAdminRole();

    // Note: Server checks will also fail if user is not an admin.
    // This a just a nice error message vs. trying to render the admin panel
    if (!isAdmin) {
      throw UnauthorizedError();
    }
    const user = await getUser(loginInfo);

    return user;
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
