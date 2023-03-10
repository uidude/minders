/**
 * @format
 */

import * as React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {IconButton} from 'react-native-paper';
import type {Action, HandlerRef} from './Actions';
import {actionHandlerComponent} from './Actions';

// TODO: Consider passing in ID
export default function ActionButton(props: {
  action: Action;
  size?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
  type?: React.ComponentType<any>;
}) {
  const {action, size = 18, style, type, color} = props;
  const ButtonType = type || IconButton;

  const ActionComponent = actionHandlerComponent(action);
  const handlerRef: HandlerRef = {};

  return (
    <>
      <ActionComponent handler={handlerRef} />
      <ButtonType
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