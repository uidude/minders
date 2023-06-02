import React from 'react';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {Provider as PaperProvider} from 'react-native-paper';
import {
  setClientFallbackEnabled,
  setDefaultServerApi,
} from '@toolkit/core/api/DataApi';
import {LOCAL_FLAGS} from '@toolkit/core/api/Flags';
import {CONSOLE_LOGGER} from '@toolkit/core/api/Log';
import IdentityService from '@toolkit/core/api/Login';
import {StatusContainer} from '@toolkit/core/client/Status';
import {registerAppConfig} from '@toolkit/core/util/AppConfig';
import {AppContextProvider} from '@toolkit/core/util/AppContext';
import {IN_MEMORY_DATA_CACHE} from '@toolkit/data/DataCache';
import {initializeFirebase} from '@toolkit/providers/firebase/Config';
import {FIRESTORE_DATASTORE} from '@toolkit/providers/firebase/DataStore';
import {firebaseFn} from '@toolkit/providers/firebase/client/FunctionsApi';
import {googleAuthProvider} from '@toolkit/providers/login/GoogleLogin';
import {BLACK_AND_WHITE} from '@toolkit/ui/QuickThemes';
import {Icon, registerIconPack} from '@toolkit/ui/components/Icon';
import {usePaperComponents} from '@toolkit/ui/components/Paper';
import {
  CLIENT_FALLBACK_ENABLED,
  FIREBASE_CONFIG,
  GOOGLE_LOGIN_CONFIG,
} from '@app/common/Config';
import AuthConfig from './AuthConfig';
import {APP_CONFIG, APP_INFO, NOTIF_CHANNELS_CONTEXT} from './Config';

const APP_CONTEXT = [
  APP_CONFIG,
  APP_INFO,
  FIRESTORE_DATASTORE,
  CONSOLE_LOGGER,
  NOTIF_CHANNELS_CONTEXT,
  IN_MEMORY_DATA_CACHE,
  LOCAL_FLAGS,
];

type Props = {
  children: React.ReactNode;
};

/**
 * App-wide configuration.
 */
function AppConfig(props: Props) {
  const {children} = props;

  registerAppConfig(APP_CONFIG);
  initializeFirebase(FIREBASE_CONFIG);
  IdentityService.addProvider(googleAuthProvider(GOOGLE_LOGIN_CONFIG));
  registerIconPack('ion', Ionicons);
  registerIconPack('mci', MaterialCommunityIcons);
  usePaperComponents();

  setDefaultServerApi(firebaseFn);
  setClientFallbackEnabled(CLIENT_FALLBACK_ENABLED);

  return (
    <PaperProvider theme={BLACK_AND_WHITE} settings={{icon: Icon}}>
      <AppContextProvider ctx={APP_CONTEXT}>
        <StatusContainer top={true}>
          <AuthConfig>{children}</AuthConfig>
        </StatusContainer>
      </AppContextProvider>
    </PaperProvider>
  );
}

export default AppConfig;
