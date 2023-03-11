/**
 * @format
 */

import * as React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {StyleSheet} from 'react-native';
import {IconButton, Menu} from 'react-native-paper';
import type {Action, HandlerRef} from './Actions';
import {actionHandlerComponent} from './Actions';

type Trigger = (onPress: () => void) => React.ReactNode;

export function VerticalDots(props: {
  size?: number;
  style?: StyleProp<ViewStyle>;
  type?: React.ComponentType<any>;
  color?: string;
  onPress: () => void;
}) {
  const {size = 18, style, type, color, onPress} = props;
  const ButtonType = type || IconButton;
  return (
    <ButtonType
      icon="dots-vertical"
      style={[S.iconButton, style]}
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
      <Menu
        visible={menuVisible}
        onDismiss={closeMenu}
        style={S.menu}
        contentStyle={S.menuContent}
        anchor={anchorEl}>
        {menuVisible &&
          actions.map((action, index) => (
            <Menu.Item
              key={action.id}
              onPress={() => menuItemSelected(index)}
              style={S.menuItem}
              icon={action.icon}
              title={action.label}
            />
          ))}
      </Menu>
    </>
  );
}

const S = StyleSheet.create({
  menu: {
    margin: 0,
    padding: 0,
    marginTop: 40,
  },
  menuContent: {
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    paddingBottom: 0,
    borderRadius: 12,
  },
  menuItem: {
    borderBottomWidth: 1,
    height: 48,
    paddingVertical: 3,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  iconButton: {opacity: 0.5},
});
