import React from 'react';
import icon from '@assets/icon.png';
import {Ionicons, MaterialCommunityIcons, Octicons} from '@expo/vector-icons';
import {Provider as PaperProvider} from 'react-native-paper';
import {
  setClientFallbackEnabled,
  setDefaultServerApi,
} from '@toolkit/core/api/DataApi';
import {LocalFlags} from '@toolkit/core/api/Flags';
import {ConsoleLogger, DevLogger, MultiLogger} from '@toolkit/core/api/Log';
import IdentityService from '@toolkit/core/api/Login';
import {StatusContainer} from '@toolkit/core/client/Status';
import {AppInfoKey} from '@toolkit/core/client/Theme';
import {Scope} from '@toolkit/core/providers/Client';
import {providesValue} from '@toolkit/core/providers/Providers';
import {initializeFirebase} from '@toolkit/providers/firebase/Config';
import {FirestoreFilestore} from '@toolkit/providers/firebase/FileStore';
import {FirestoreDatastoreWithCaching} from '@toolkit/providers/firebase/FirestoreDatastore';
import {firebaseFn} from '@toolkit/providers/firebase/client/FunctionsApi';
import {googleAuthProvider} from '@toolkit/providers/login/GoogleLogin';
import {BLACK_AND_WHITE} from '@toolkit/ui/QuickThemes';
import {Icon, registerIconPack} from '@toolkit/ui/components/Icon';
import {allowWebScreenDomains} from '@toolkit/ui/screen/WebScreen';
import {
  APP_CONFIG,
  CLIENT_FALLBACK_ENABLED,
  FIREBASE_CONFIG,
  GOOGLE_LOGIN_CONFIG,
  LEGAL_LINKS,
} from '@app/common/Config';
import {NOTIF_CHANNELS} from '@app/common/NotifChannels';
import AuthConfig from './app/AuthConfig';
import {registerUiComponents} from './app/Components';

type Props = {
  children: React.ReactNode;
};

/**
 * App-wide configuration, including setting up application-wide scope and providers.
 */
function AppConfig(props: Props) {
  const {children} = props;

  const loggers = [DevLogger, ConsoleLogger];

  const providers = [
    LocalFlags,
    MultiLogger(loggers),
    FirestoreDatastoreWithCaching,
    FirestoreFilestore,
    APP_CONFIG,
    AppInfo,
    NOTIF_CHANNELS,
  ];

  initializeFirebase(FIREBASE_CONFIG);
  IdentityService.addProvider(googleAuthProvider(GOOGLE_LOGIN_CONFIG));
  registerIconPack('ion', Ionicons);
  registerIconPack('oct', Octicons);
  registerIconPack('mci', MaterialCommunityIcons);
  registerUiComponents();

  setDefaultServerApi(firebaseFn);
  setClientFallbackEnabled(CLIENT_FALLBACK_ENABLED);
  allowWebScreenDomains(LEGAL_LINKS.map(l => l.url));

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

const AppInfo = providesValue(AppInfoKey, {
  appName: 'minders',
  appIcon: icon,
});

export default AppConfig;
