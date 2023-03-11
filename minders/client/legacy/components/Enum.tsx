/**
 * @format
 */

// TODOs:
// - Try using Portal to avoid recreating equivalent menu
// - Try cascading styles
// - Stop initial flicker when opening menu

import * as React from 'react';
import {Text, TouchableHighlight} from 'react-native';
import {StyleProp, ViewStyle} from 'react-native';
import {unstable_batchedUpdates} from 'react-dom';
import {IconButton, Menu} from 'react-native-paper';
import {type Action} from './Actions';
import {useShortcut} from './Shortcuts';
import Styles from './Styles';

type Config = {icon: string; label: string; key?: string | string[]};

export type EnumConfig<T> = Map<T, Config>;

export type Props<T> = {
  enums: EnumConfig<T>;
  anchor: Trigger;
  onChange: (value: T) => void;
};

function useEnumShortcuts<T>(enums: EnumConfig<T>, fn: (t: T) => void) {
  /** @ts-ignore */
  for (const [enumValue, config] of enums) {
    useEnumShortcut(enumValue, config, fn);
  }
}

function useEnumShortcut<T>(enumValue: T, cfg: Config, fn: (t: T) => void) {
  if (cfg.key) {
    const keys: string[] = typeof cfg.key == 'string' ? [cfg.key] : cfg.key;
    for (const key of keys) {
      useShortcut({
        key: key,
        action: () => {
          fn(enumValue);
        },
      });
    }
  }
}

export function enumActions<T>(
  enums: EnumConfig<T>,
  handler: (enumValue: T) => void,
): Action[] {
  function onEnumChange(enumValue: T) {
    unstable_batchedUpdates(() => {
      handler && handler(enumValue);
    });
  }
  return Array.from(enums.keys()).map(enumValue => {
    const cfg = enums.get(enumValue);
    if (!cfg) {
      throw 'invalid enum config';
    }
    return {
      id: 'change_' + String(enumValue),
      icon: cfg.icon,
      label: cfg.label,
      handle: () => {
        useEnumShortcut(enumValue, cfg, onEnumChange);
        return () => {
          onEnumChange(enumValue);
        };
      },
    };
  });
}

type Trigger = (onPress: () => void) => React.ReactNode;

export function EnumMenu<T>(props: Props<T>) {
  const {enums, anchor, onChange} = props;
  const [menuVisible, setMenuVisible] = React.useState(false);

  useEnumShortcuts(enums, enumValue => {
    setMenuVisible(false);
    unstable_batchedUpdates(() => {
      onChange && onChange(enumValue);
    });
  });

  function openMenu() {
    setMenuVisible(true);
  }

  function closeMenu(): void {
    setMenuVisible(false);
  }

  function menuItemSelected(enumValue: T): void {
    setMenuVisible(false);
    unstable_batchedUpdates(() => {
      onChange && onChange(enumValue);
    });
  }

  return (
    <Menu
      visible={menuVisible}
      onDismiss={closeMenu}
      style={Styles.menu}
      contentStyle={Styles.menuContent}
      anchor={anchor(openMenu)}>
      {menuVisible &&
        Array.from(enums.keys()).map(enumValue => {
          return (
            <Menu.Item
              key={String(enumValue)}
              onPress={() => menuItemSelected(enumValue)}
              style={Styles.menuItem}
              icon={enums.get(enumValue)?.icon}
              title={enums.get(enumValue)?.label}
            />
          );
        })}
    </Menu>
  );
}

export type EnumIconButtonProps<T> = {
  value?: T;
  enums: EnumConfig<T>;
  size?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
  onPress: () => void;
  type?: React.ComponentType<any>;
};
// Icon button tied to an enum from an EnumConfig
export function EnumIconButton<T>(props: EnumIconButtonProps<T>) {
  const {enums, size, style, color, onPress, type} = props;
  /** @ts-ignore */
  const enumValue: T = props.value || enums.keys().next.value;
  const ButtonType = type || IconButton;

  return (
    <ButtonType
      /* @ts-ignore */
      icon={enums.get(enumValue)?.icon}
      accessibilityLabel={enums.get(enumValue)?.label}
      style={[Styles.iconButton, style]}
      onPress={onPress}
      size={size}
      color={color}
    />
  );
}

export type EnumTextButtonProps<T> = {
  value?: T;
  enums: EnumConfig<T>;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
};

export function EnumTextButton<T>(props: EnumTextButtonProps<T>) {
  const {enums, style, onPress} = props;
  /* @ts-ignore */
  const enumValue: T = props.value || enums.keys().next.value;

  return (
    <TouchableHighlight onPress={onPress} style={style}>
      <Text>{enums.get(enumValue)?.label}</Text>
    </TouchableHighlight>
  );
}

export function EnumDualButton<T>(props: EnumIconButtonProps<T>) {
  const {enums, onPress, size, style, type, color} = props;
  /* @ts-ignore */
  const enumValue: T = props.value || enums.keys().next.value;

  if (enums.size != 2) {
    throw Error('Enum buttons must have two values... try using EnumMenu');
  }

  useEnumShortcuts(enums, () => {
    // For now trying "toggle" behavior, where either
    // shortcut toggles between. This helps when people
    // toggle one way and then want to immediately toggle back
    /* @ts-ignore */
    for (const enumKey of enums.keys()) {
      if (enumKey != enumValue) {
        onPress();
        return;
      }
    }
  });

  function myOnPress(): void {
    const allEnums: Iterator<T> = enums.keys();
    for (const curEnum in allEnums) {
      if (curEnum != enumValue && onPress) {
        onPress();
      }
    }
  }

  return <EnumIconButton {...props} onPress={myOnPress} />;
}

export default EnumMenu;
