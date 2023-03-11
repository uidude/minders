/**
 * @format
 */

import * as React from 'react';
import {Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useOutliner} from './OutlinerContext';

const HomeRedirector = () => {
  const outliner = useOutliner();
  const nav = useNavigation();
  // TODO: Remember last view?
  const focusItem = outliner.getFocusItem();
  const defaultFocusItem = outliner.getData();
  const focusItemId =
    focusItem.id != defaultFocusItem.id ? focusItem.id : undefined;
  // @ts-ignore
  nav.replace('outline', {focus: focusItemId});
  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
};

export default HomeRedirector;
