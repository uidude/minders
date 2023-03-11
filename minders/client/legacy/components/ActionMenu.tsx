/**
 * @format
 */

import * as React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {StyleSheet} from 'react-native';
import type {Action, HandlerRef} from './Actions';
import {actionHandlerComponent} from './Actions';
import {IconButton, Menu} from './AppComponents';

type Trigger = (onPress: () => void) => React.ReactNode;

export function VerticalDots(props: {
  size?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
  onPress: () => void;
}) {
  const {size = 18, style, color, onPress} = props;

  return (
    <IconButton
      icon="dots-vertical"
      style={style}
      onPress={onPress}
      size={size}
      color={color}
    />
  );
}

// TODO: Consider passing in ID
export default function ActionMenu(props: {
  actions: Array<Action>;
  children?: React.ReactNode;
  anchor: Trigger;
}) {
  const {actions, anchor} = props;
  const [menuVisible, setMenuVisible] = React.useState(false);

  function menuItemSelected(index: number): void {
    const handler = handlers[index].current;
    handler && handler();
    setMenuVisible(false);
  }

  function openMenu() {
    setMenuVisible(true);
  }

  function closeMenu() {
    setMenuVisible(false);
  }

  // This hackiness is necessary becuse the Menu.Items are
  // created in a different context. If we want actions to have
  // the react context for their place in the tree, they need
  // to have components created not as children of <Menu>
  const handlers: HandlerRef[] = [];

  const anchorEl = anchor(openMenu);

  return (
    <>
      {actions.map((action, index) => {
        const ActionComponent = actionHandlerComponent(action);
        const handlerRef: HandlerRef = {};
        handlers.push(handlerRef);
        return <ActionComponent key={index} handler={handlerRef} />;
      })}
      <Menu visible={menuVisible} onDismiss={closeMenu} anchor={anchorEl}>
        {menuVisible &&
          actions.map((action, index) => (
            <Menu.Item
              key={action.id}
              onPress={() => menuItemSelected(index)}
              icon={action.icon}
              title={action.label}
            />
          ))}
      </Menu>
    </>
  );
}
