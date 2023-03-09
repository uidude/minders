// @flow
// @format
// TODOs:
// - Try using Portal to avoid recreating equivalent menu
// - Try cascading styles
// - Stop initial flicker when opening menu

import * as React from 'react';
import {Menu, IconButton, Button} from 'react-native-paper';
import {StyleSheet, View, Text, TouchableHighlight} from 'react-native';
import {unstable_batchedUpdates} from 'react-dom';
import {useShortcut} from './Shortcuts';
import Styles from './Styles';
import {type Action} from './Actions';
import ActionMenu from './ActionMenu';

import type {
  OutlineItemVisibilityFilter,
  OutlineItemState,
} from '../model/outliner';

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

type Config = {icon: string, label: string, key?: string | string[]};

export type EnumConfig<T> = Map<T, Config>;

export type Props<T> = {
  enums: EnumConfig<T>,
  anchor: Trigger,
  onChange: (value: T) => void,
};

function useEnumShortcuts<T>(enums: EnumConfig<T>, fn: (T) => void) {
  for (const [enumValue, config] of enums) {
    useEnumShortcut(enumValue, config, fn);
  }
}

function useEnumShortcut<T>(enumValue: T, cfg: Config, fn: (T) => void) {
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
  handler: (enumValue: T) => void
): Action[] {
  function onEnumChange(enumValue: T) {
    unstable_batchedUpdates(() => {
      handler && handler(enumValue);
    });
  }
  return Array.from(enums.keys()).map((enumValue) => {
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

type Trigger = (onPress: () => void) => React.Node;

export function EnumMenu<T>(props: Props<T>) {
  const {enums, anchor, onChange} = props;
  const [menuVisible, setMenuVisible] = React.useState(false);

  useEnumShortcuts(enums, (enumValue) => {
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
      anchor={anchor(openMenu)}
    >
      {menuVisible &&
        Array.from(enums.keys()).map((enumValue) => {
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
  value?: T,
  enums: EnumConfig<T>,
  size?: number,
  style?: ViewStyleProp,
  color?: string,
  onPress: () => void,
  type?: React.ComponentType<any>,
};
// Icon button tied to an enum from an EnumConfig
export function EnumIconButton<T>(props: EnumIconButtonProps<T>) {
  const {enums, size, style, color, onPress, type} = props;
  const enumValue: T = props.value || enums.keys().next.value;
  const ButtonType = type || IconButton;

  return (
    <ButtonType
      icon={enums.get(enumValue)?.icon}
      accessibilityLabel={enums.get(enumValue)?.label}
      style={[Styles.iconButton, style]}
      onPress={onPress}
      size={size}
      style={style}
      color={color}
    />
  );
}

export type EnumTextButtonProps<T> = {
  value?: T,
  enums: EnumConfig<T>,
  style?: ViewStyleProp,
  onPress: () => void,
};

export function EnumTextButton<T>(props: EnumTextButtonProps<T>) {
  const {enums, style, onPress} = props;
  const enumValue: T = props.value || enums.keys().next.value;

  return (
    <TouchableHighlight onPress={onPress} style={style}>
      <Text>{enums.get(enumValue)?.label}</Text>
    </TouchableHighlight>
  );
}

export function EnumDualButton<T>(props: EnumIconButtonProps<T>) {
  const {enums, onPress, size, style, type, color} = props;
  const enumValue: T = props.value || enums.keys().next.value;
  const ButtonType = type || IconButton;

  if (enums.size != 2) {
    throw Error('Enum buttons must have two values... try using EnumMenu');
  }

  useEnumShortcuts(enums, () => {
    // For now trying "toggle" behavior, where either
    // shortcut toggles between. This helps when people
    // toggle one way and then want to immediately toggle back
    for (const enumKey of enums.keys()) {
      if (enumKey != enumValue) {
        onPress();
        return;
      }
    }
  });

  function myOnPress(): void {
    const allEnums: Iterator<T> = enums.keys();
    for (const curEnum of allEnums) {
      if (curEnum != enumValue && onPress) {
        onPress();
      }
    }
  }

  return <EnumIconButton {...props} onPress={myOnPress} />;
}

// DEPRECATED, just keeping until we're sure we haven't just broken things

export type DeprecatedMode = 'icon' | 'text'; // Should have icon+text option

export type DeprecatedProps<T> = {
  value?: T,
  enums: EnumConfig<T>,
  onChange: (value: T) => void,
  size?: number,
  style?: ViewStyleProp,
  type?: React.ComponentType<any>,
  color?: string,
  children?: React.Node,
  mode?: DeprecatedMode,
};

export function EnumMenu_DEPRECATED<T>(props: DeprecatedProps<T>) {
  const {enums, onChange, size, style, type, color, mode = 'icon'} = props;
  const [menuVisible, setMenuVisible] = React.useState(false);
  const enumValue: T = props.value || enums.keys().next.value;
  const ButtonType = type || IconButton;

  useEnumShortcuts(enums, (enumValue) => {
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

  const pageContent =
    mode == 'text' ? (
      <TouchableHighlight onPress={openMenu}>
        <Text>{enums.get(enumValue)?.label}</Text>
      </TouchableHighlight>
    ) : (
      <IconButton
        icon={enums.get(enumValue)?.icon}
        accessibilityLabel={enums.get(enumValue)?.label}
        style={[Styles.iconButton, style]}
        onPress={openMenu}
        size={size}
        type={type}
        color={color}
      />
    );

  return (
    <Menu
      visible={menuVisible}
      onDismiss={closeMenu}
      style={Styles.menu}
      contentStyle={Styles.menuContent}
      anchor={pageContent}
    >
      {menuVisible &&
        Array.from(enums.keys()).map((enumValue) => {
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

export default EnumMenu;
