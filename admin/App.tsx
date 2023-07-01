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
