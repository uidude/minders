/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {APP_CONFIG, FIREBASE_CONFIG} from '@app/common/Config';
import {initFirebaseServer} from '@toolkit/providers/firebase/server/Config';
import {
  AuthenticateMiddleware,
  ResultLoggerMiddleware,
  RolesCheckMiddleware,
  initMiddlewares,
} from '@toolkit/providers/firebase/server/Handler';

// Follow the wiki below to enable Firestore security rule enforcement in Functions:
// https://www.internalfb.com/intern/wiki/NPE/Central_Engineering/NPE_Kit/Guides/Enforcing_Security_Rules_in_Firebase_Functions_or_Server_Code/
initFirebaseServer(FIREBASE_CONFIG, APP_CONFIG);

initMiddlewares([
  AuthenticateMiddleware,
  ResultLoggerMiddleware,
  RolesCheckMiddleware,
]);

exports.minders = require('./handlers');
