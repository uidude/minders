/**
 * @format
 */

import {Alert} from 'react-native';
import {Opt} from '@toolkit/core/util/Types';

export const StdAlert = (title: string, desc: string, onPress = () => {}) => {
  Alert.alert(title, desc, [{text: 'OK', onPress: () => onPress()}], {
    cancelable: false,
  });
};

export const BinaryAlert = (
  title: string,
  desc: Opt<string>,
  onPositivePress = () => {},
  onNegativePress = () => {},
) => {
  Alert.alert(
    title,
    desc !== null ? desc : undefined,
    [
      {text: 'Cancel', onPress: () => onNegativePress()},
      {text: 'OK', onPress: () => onPositivePress()},
    ],
    {cancelable: false},
  );
};
