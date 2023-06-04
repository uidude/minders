import React from 'react';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {Provider as PaperProvider} from 'react-native-paper';
import {
  setClientFallbackEnabled,
  setDefaultServerApi,
} from '@toolkit/core/api/DataApi';
import {LocalFlags} from '@toolkit/core/api/Flags';
import {ConsoleLogger} from '@toolkit/core/api/Log';
import IdentityService from '@toolkit/core/api/Login';
import {StatusContainer} from '@toolkit/core/client/Status';
import {Scope} from '@toolkit/core/providers/Client';
import {InMemoryDataCache} from '@toolkit/data/DataCache';
import {initializeFirebase} from '@toolkit/providers/firebase/Config';
import {FirestoreDatastore} from '@toolkit/providers/firebase/DataStore';
import {firebaseFn} from '@toolkit/providers/firebase/client/FunctionsApi';
import {googleAuthProvider} from '@toolkit/providers/login/GoogleLogin';
import {BLACK_AND_WHITE} from '@toolkit/ui/QuickThemes';
import {Icon, registerIconPack} from '@toolkit/ui/components/Icon';
import {usePaperComponents} from '@toolkit/ui/components/Paper';
import {
  APP_CONFIG,
  APP_INFO,
  CLIENT_FALLBACK_ENABLED,
  FIREBASE_CONFIG,
  GOOGLE_LOGIN_CONFIG,
} from '@app/common/Config';
import {NOTIF_CHANNELS} from '@app/common/NotifChannels';
import AuthConfig from './AuthConfig';

type Props = {
  children: React.ReactNode;
};

/**
 * App-wide configuration, including setting up application-wide scope and providers.
 */
function AppConfig(props: Props) {
  const {children} = props;
  const providers = [
    LocalFlags,
    ConsoleLogger,
    InMemoryDataCache,
    FirestoreDatastore,
    APP_CONFIG,
    APP_INFO,
    NOTIF_CHANNELS,
  ];

  initializeFirebase(FIREBASE_CONFIG);
  IdentityService.addProvider(googleAuthProvider(GOOGLE_LOGIN_CONFIG));
  registerIconPack('ion', Ionicons);
  registerIconPack('mci', MaterialCommunityIcons);
  usePaperComponents();

  setDefaultServerApi(firebaseFn);
  setClientFallbackEnabled(CLIENT_FALLBACK_ENABLED);

  return (
    <Scope providers={providers}>
      <PaperProvider theme={BLACK_AND_WHITE} settings={{icon: Icon}}>
        <StatusContainer top={true}>
          <AuthConfig>{children}</AuthConfig>
        </StatusContainer>
      </PaperProvider>
    </Scope>
  );
}

export default AppConfig;
