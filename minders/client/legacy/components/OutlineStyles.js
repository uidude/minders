// @flow

import { Platform } from 'react-native';

export default {
  fontFamily: Platform.select({
    ios: 'Futura',
    android: 'Roboto',
    web: 'Roboto, Arial',
  }),
};
