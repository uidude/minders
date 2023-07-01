/**
 * @format
 */

// TODOs:
// - Try using Portal to avoid recreating equivalent menu
// - Try cascading styles
// - Stop initial flicker when opening menu

import * as React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';
import {unstable_batchedUpdates} from 'react-dom';
import {actionHook} from '@toolkit/core/client/Action';
import {ActionItemWithShortcut} from '@app/components/Actions';
import {IconButton, Menu} from '../components/AppComponents';

type Config = {icon: string; label: string; key?: string | string[]};

export type EnumConfig<T> = Map<T, Config>;

export type Props<T> = {
  enums: EnumConfig<T>;
  anchor: Trigger;
  onChange: (value: T) => void;
};

function capitalize(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

export function enumActions<T>(
  enums: EnumConfig<T>,
  handler: (enumValue: T) => void,
): ActionItemWithShortcut[] {
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
      id: 'Choose' + capitalize(String(enumValue)),
      icon: cfg.icon,
      label: cfg.label,
      key: cfg.key,
      action: actionHook(() => {
        return () => {
          onEnumChange(enumValue);
        };
      }),
    };
  });
}

type Trigger = (onPress: () => void) => React.ReactNode;

export function EnumMenu<T>(props: Props<T>) {
  const {enums, anchor, onChange} = props;
  const [menuVisible, setMenuVisible] = React.useState(false);

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
    <Menu visible={menuVisible} onDismiss={closeMenu} anchor={anchor(openMenu)}>
      {menuVisible &&
        Array.from(enums.keys()).map(enumValue => {
          return (
            <Menu.Item
              key={String(enumValue)}
              onPress={() => menuItemSelected(enumValue)}
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
  loading?: boolean;
};
// Icon button tied to an enum from an EnumConfig
export function EnumIconButton<T>(props: EnumIconButtonProps<T>) {
  const {enums, size, style, color, onPress, loading = false} = props;
  /** @ts-ignore */
  const enumValue: T = props.value || enums.keys().next.value;

  if (loading) {
    return (
      <ActivityIndicator size={size} style={[{width: 39, height: 39}, style]} />
    );
  }

  return (
    <IconButton
      /* @ts-ignore */
      icon={enums.get(enumValue)?.icon}
      accessibilityLabel={enums.get(enumValue)?.label}
      style={style}
      onPress={onPress}
      size={size}
      color={color}
    />
  );
}

export type EnumButtonProps<T> = {
  value?: T;
  enums: EnumConfig<T>;
  style?: StyleProp<TextStyle>;
  onPress: () => void;
  showIcon?: boolean;
  showText?: boolean;
  size?: number;
  color?: string;
  iconStyle?: StyleProp<ViewStyle>;
};

export function EnumTextButton<T>(props: EnumButtonProps<T>) {
  const {enums, style, onPress, size, color} = props;
  const {showIcon = true, showText = true, iconStyle} = props;
  /* @ts-ignore */
  const enumValue: T = props.value || enums.keys().next.value;

  return (
    <TouchableHighlight style={S.button} onPress={onPress}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        {showIcon && (
          <IconButton
            /* @ts-ignore */
            icon={enums.get(enumValue)?.icon}
            accessibilityLabel={enums.get(enumValue)?.label}
            style={iconStyle}
            onPress={onPress}
            size={size}
            color={color}
          />
        )}
        {showText && <Text style={style}>{enums.get(enumValue)?.label}</Text>}
      </View>
    </TouchableHighlight>
  );
}

const S = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});
