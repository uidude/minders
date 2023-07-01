import icon from '@assets/icon.png';
import {APP_INFO_KEY} from '@toolkit/core/client/Theme';
import {APP_CONFIG_KEY} from '@toolkit/core/util/AppConfig';
import {context} from '@toolkit/core/util/AppContext';

export const APP_CONFIG = context(APP_CONFIG_KEY, {
  product: 'hax-app-admin',
  fbAppId: '',
});

export const APP_INFO = context(APP_INFO_KEY, {
  appName: 'Hax App',
  appIcon: icon,
});
