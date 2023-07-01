import React from 'react';
import {StyleSheet} from 'react-native';
import {
  ButtonApi,
  ButtonProps,
  registerComponent,
} from '@toolkit/ui/components/Components';
import {Button, usePaperComponents} from '@toolkit/ui/components/Paper';

/**
 * Standard paper button with minor style overrides
 */
export const AppButton = (props: ButtonProps) => {
  const {labelStyle, ...rest} = props;
  const appLabelStyle = [labelStyle, S.buttonText];
  if (props.type === 'primary') {
    appLabelStyle.push(S.buttonPrimaryText);
  }
  return <Button labelStyle={appLabelStyle} {...rest} />;
};

export function registerUiComponents() {
  usePaperComponents();
  registerComponent(ButtonApi, AppButton);
}

const S = StyleSheet.create({
  buttonText: {textTransform: 'uppercase', fontSize: 14},
  buttonPrimaryText: {color: '#FFF'},
});
