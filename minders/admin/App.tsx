/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React, {Suspense} from 'react';
import {SimpleUserMessaging} from '@toolkit/core/client/Status';
import {filterHandledExceptions} from '@toolkit/core/util/Environment';
import AuthConfig from '@app/admin/app/AuthConfig';
import DrawerNavigator from '@app/admin/app/DrawerNavigator';
import AppConfig from './AppConfig';

filterHandledExceptions();

export default function AppShell() {
  return (
    <AppConfig>
      <Suspense fallback={null}>
        <SimpleUserMessaging style={{bottom: 100}} />
        <AuthConfig>
          <DrawerNavigator />
        </AuthConfig>
      </Suspense>
    </AppConfig>
  );
}
