/**
 * @format
 */

import * as React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import type {Action, HandlerRef} from './Actions';
import {actionHandlerComponent} from './Actions';
import {IconButton} from './AppComponents';

// TODO: Consider passing in ID
export default function ActionButton(props: {
  action: Action;
  size?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
}) {
  const {action, size = 18, style, color} = props;

  const ActionComponent = actionHandlerComponent(action);
  const handlerRef: HandlerRef = {};

  return (
    <>
      <ActionComponent handler={handlerRef} />
      <IconButton
        icon={action.icon}
        accessibilityLabel={action.label}
        onPress={() => handlerRef.current && handlerRef.current()}
        style={style}
        size={size}
        color={color}
      />
    </>
  );
}
