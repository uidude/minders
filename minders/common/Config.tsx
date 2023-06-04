/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

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
      useEmulator: true,
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

// Add legal links here for easy reference.
export const LEGAL_LINKS = [
  {
    id: 'tos',
    label: 'Terms of Service',
    url: 'https://facebookincubator.github.io/npe-toolkit/docs/release/tos.html',
  },
];

export const MIXPANEL_TOKEN = null;

providesValue(NotificationChannelsKey, NOTIF_CHANNELS);
