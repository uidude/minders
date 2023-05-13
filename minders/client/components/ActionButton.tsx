/**
 * @format
 */

import * as React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {ActionItem, useAction} from '@toolkit/core/client/Action';
import {IconButton} from './AppComponents';

export function ActionButton(props: {
  item: ActionItem;
  size?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
}) {
  const {item, size = 18, style, color} = props;
  const [action] = useAction(item.action);

  return (
    <>
      <IconButton
        icon={item.icon ?? ''}
        accessibilityLabel={item.label}
        onPress={() => action()}
        style={style}
        size={size}
        color={color}
      />
    </>
  );
}
