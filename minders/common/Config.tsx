import {providesValue} from '@toolkit/core/providers/Providers';
import {AppConfigKey} from '@toolkit/core/util/AppConfig';
import {FirebaseConfig} from '@toolkit/providers/firebase/Config';
import {NotificationChannelsKey} from '@toolkit/services/notifications/NotificationChannel';
import {NOTIF_CHANNELS} from '@app/common/NotifChannels';

let localConf: Record<string, any> = {};
try {
  // @ts-ignore
  localConf = require('./.localconf.json');
} catch (_ignored) {}

/**
 * Fill in the Firebase config from values at
 * https://console.firebase.google.com/project/YOUR_PROJECT/settings/general/, under "Web apps"
 */
export const FIREBASE_CONFIG: FirebaseConfig = localConf['firebase'] ?? {
  apiKey: 'AIzaSyBPg-GJwR4N63turpv1G3tfUjYkXtu1GCA',
  authDomain: 'minders-2d5bf.firebaseapp.com',
  projectId: 'minders-2d5bf',
  storageBucket: 'minders-2d5bf.appspot.com',
  messagingSenderId: '729397867154',
  appId: '1:729397867154:web:3f82a3e71427edd01dec4b',
  measurementId: 'G-T7BP96L0C5',
  namespace: 'minders',
  emulators: {
    functions: {
      useEmulator: false,
    },
  },
};

export const APP_CONFIG = {
  product: 'minders',
  dataEnv: 'prod',
  fbAppId: '',
};

providesValue(AppConfigKey, APP_CONFIG);

/**
 * Fill in the client IDs from
 * https://console.cloud.google.com/apis/credentials
 *
 * You also will need to add redirect URIs in the console, see
 * https://github.com/facebookincubator/npe-toolkit/blob/main/docs/getting-started/Firebase.md
 */
export const GOOGLE_LOGIN_CONFIG = localConf['google-login'] ?? {
  iosClientId:
    '729397867154-o7pdcviop9n916p65ptf8j37v1kd9tl9.apps.googleusercontent.com',
  webClientId:
    '729397867154-rbsrjlb7cvm3jfcq04gei4j730qo4jtc.apps.googleusercontent.com',
  androidClientId:
    '729397867154-uc1noac34lfecpu5lj6m0mc292aha24u.apps.googleusercontent.com',
  expoId: '@uidude/minders',
};

export const CLIENT_FALLBACK_ENABLED = true;

export const LEGAL_LINKS = [
  {
    id: 'tos',
    label: 'Terms of Service',
    url: 'https://app.termly.io/document/terms-of-service/477358a4-d5ec-4635-8eed-739005f7968b',
  },
  {
    id: 'privacy-policy',
    label: 'Privacy Policy',
    url: 'https://app.termly.io/document/privacy-policy/158a201a-46b3-4c47-9434-e9a012757ea6',
  },
];

export const LOGIN_SCREEN_TOS =
  'By continuing, you accept our [Terms of Service](https://app.termly.io/document/terms-of-service/477358a4-d5ec-4635-8eed-739005f7968b) ' +
  'and [Privacy Policy](https://app.termly.io/document/privacy-policy/158a201a-46b3-4c47-9434-e9a012757ea6).';

export const MIXPANEL_TOKEN = null;

providesValue(NotificationChannelsKey, NOTIF_CHANNELS);
