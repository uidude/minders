/**
 * @format
 */

import * as React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {ActionItem, useAction} from '@toolkit/core/client/Action';
import {Shortcut, useShortcuts} from '@app/util/Shortcuts';
import {ActionItemWithShortcut} from './Actions';
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

export function ActionMenu(props: {items: Array<ActionItem>; anchor: Trigger}) {
  const key = props.items.map(item => item.id).join(',');

  // By providing a different key based on menu items, this ensures that
  // the same number of `useAction()` hooks are called each render
  return <ActionMenuImpl key={key} {...props} />;
}

function ActionMenuImpl(props: {
  items: Array<ActionItemWithShortcut>;
  anchor: Trigger;
}) {
  const {items, anchor} = props;
  const handlers = items.map(item => {
    const [handler] = useAction(item.id, item.action);
    return handler;
  });
  const shortcuts: Shortcut[] = [];
  items.forEach((item, index) => {
    const keys = (typeof item.key == 'string' ? [item.key] : item.key) ?? [];
    for (const key of keys) {
      shortcuts.push({key, action: handlers[index]});
    }
  });
  useShortcuts(shortcuts);

  const [menuVisible, setMenuVisible] = React.useState(false);

  function menuItemSelected(index: number): void {
    handlers[index]();
    setMenuVisible(false);
  }

  const show = () => setMenuVisible(true);
  const hide = () => setMenuVisible(false);

  const anchorEl = anchor(show);

  return (
    <Menu visible={menuVisible} onDismiss={hide} anchor={anchorEl}>
      {menuVisible &&
        items.map((item, index) => (
          <Menu.Item
            key={item.id}
            onPress={() => menuItemSelected(index)}
            icon={item.icon}
            title={item.label}
          />
        ))}
    </Menu>
  );
}
