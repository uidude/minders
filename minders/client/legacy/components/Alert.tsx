import { Alert } from 'react-native';

export const StdAlert = (title, desc, onPress = () => {}) => {
  Alert.alert(title, desc, [{ text: 'OK', onPress: () => onPress() }], {
    cancelable: false,
  });
};

export const BinaryAlert = (
  title,
  desc,
  onPositivePress = () => {},
  onNegativePress = () => {}
) => {
  Alert.alert(
    title,
    desc,
    [
      { text: 'OK', onPress: () => onPositivePress() },
      { text: 'Cancel', onPress: () => onNegativePress() },
    ],
    { cancelable: false }
  );
};
