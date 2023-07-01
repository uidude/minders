/**
 * @format
 */

import * as React from 'react';
import {StyleSheet} from 'react-native';
import {
  IconButton as PaperIconButton,
  Menu as PaperMenu,
} from 'react-native-paper';

type MenuProps = React.ComponentProps<typeof PaperMenu>;

export const Menu = (props: MenuProps) => {
  const {style, contentStyle, ...rest} = props;

  return (
    <PaperMenu
      style={[S.menu, style]}
      contentStyle={[S.menuContent, contentStyle]}
      {...rest}
    />
  );
};

type MenuItemProps = React.ComponentProps<typeof PaperMenu.Item>;

Menu.Item = (props: MenuItemProps) => {
  const {style, ...rest} = props;
  return <PaperMenu.Item style={[S.menuItem, style]} {...rest} />;
};

type IconButtonProps = React.ComponentProps<typeof PaperIconButton>;
export const IconButton = (props: IconButtonProps) => {
  const {style, ...rest} = props;

  return <PaperIconButton style={[S.iconButton, style]} {...rest} />;
};

const S = StyleSheet.create({
  menu: {
    margin: 0,
    padding: 0,
    paddingBottom: 0,
    marginTop: 40,
  },
  menuContent: {
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
