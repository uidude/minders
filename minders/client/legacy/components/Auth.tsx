/**
 * @format
 */

import * as Fb from 'expo-facebook';
import firebase from 'firebase/app';
import 'firebase/auth';
import {Platform} from 'react-native';

const FB_APP_ID = '1806885586123115';
const PERMISSIONS = ['public_profile', 'email'];

export default class Auth {
  static async getUser() {
    //const credential = firebase.auth.FacebookAuthProvider.credential(token);
    // was signInAndRetrieveDataWithCredential
    //const fbprofile = await firebase.auth().signInWithCredential(credential);
  }

  static async login(canPrompt: boolean = false): Promise<boolean> {
    // TODO: Check every N hours to make sure app has still granted permissions
    if (firebase.auth().currentUser) {
      return true;
    }
    if (Platform.OS === 'web') {
      const provider = new firebase.auth.FacebookAuthProvider();
      firebase.auth().useDeviceLanguage();

      try {
        const result = await firebase.auth().signInWithRedirect(provider);

        /* @ts-ignore but don't know how this will work. Luckily we'll be removing */
        const {credential} = result;
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        var token = credential.accessToken;

        await firebase
          .auth()
          .setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        firebase.auth.FacebookAuthProvider.credential(token);
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    } else {
      const opts = {permissions: PERMISSIONS};

      /** @ts-ignore This ain't gonna work, but being deleted */
      const result = await Fb.logInWithReadPermissionsAsync(FB_APP_ID, opts);
      /** @ts-ignore Ditto */
      const {type, token} = result;
      console.log('outline:fablogin', result);

      if (type == 'cancel') {
        return false;
      }

      await firebase
        .auth()
        .setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      const cred = firebase.auth.FacebookAuthProvider.credential(token);
      console.log('outline:fibcred', cred);
      const firebaseSignin = await firebase.auth().signInWithCredential(cred);
      console.log('outline:fibsignin', firebaseSignin);
      return true;
    }
  }
}
