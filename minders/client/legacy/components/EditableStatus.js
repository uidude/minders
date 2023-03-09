// @flow

import React, {useState, useContext, useEffect} from 'react';
import {IconButton, Menu, Divider, Text, Button} from 'react-native-paper';
import {Picker, View} from 'react-native';
import type {OutlineItem, OutlineItemState} from '../model/outliner';
import OutlinerContext, {useOutliner} from './OutlinerContext';
import OutlineUtil from './OutlineUtil';
import type {EnumConfig} from './Enum.js';
import {EnumMenu, EnumIconButton} from './Enum';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

type Props = {
  item: OutlineItem,
  size?: number,
  style?: ViewStyleProp,
};

const VisibilityStateEnums: EnumConfig<OutlineItemState> = new Map([
  ['top', {icon: 'star-outline', label: 'Starred'}],
  ['cur', {icon: 'eye-outline', label: 'Current'}],
  ['soon', {icon: 'clock-outline', label: 'Soon'}],
  ['later', {icon: 'alarm-off', label: 'Later'}],
  ['done', {icon: 'check-circle-outline', label: 'Done'}],
  ['waiting', {icon: 'timer-sand-empty', label: 'Waiting'}],
  ['new', {icon: 'new-box', label: 'New'}],
]);

export function EditableStatus(props: Props) {
  const {item, size, style} = props;
  const outliner = useOutliner();
  OutlineUtil.useRedrawOnItemUpdate(item.id);

  // This is inefficient (too many menus, but I guess OK for now?)
  return (
    <View>
      <EnumMenu
        enums={VisibilityStateEnums}
        onChange={(value) => outliner.updateOutlineItem(item, {state: value})}
        anchor={(onPress) => (
          <EnumIconButton
            enums={VisibilityStateEnums}
            value={item.state}
            size={size}
            style={style}
            onPress={onPress}
            onChange={() => {}}
          />
        )}
      />
    </View>
  );
}
