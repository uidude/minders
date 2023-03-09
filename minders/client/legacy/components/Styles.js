// @flow
import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  menu: {
    margin: 0,
    padding: 0,
    paddingBottom: 0,
    marginTop: 40,
  },
  menuContent: {
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  menuItem: {
    borderBottomWidth: 1,
    height: 48,
    paddingVertical: 3,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  iconButton: {opacity: 0.5},
});

export default styles;
