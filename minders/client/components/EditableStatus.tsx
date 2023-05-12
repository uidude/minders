/**
 * @format
 */

import React from 'react';
import {StyleProp, View, ViewStyle} from 'react-native';
import OutlineUtil from '@app/model/OutlineUtil';
import {useOutliner} from '../model/OutlinerContext';
import type {OutlineItem, OutlineItemState} from '../model/outliner';
import {EnumConfig, EnumIconButton, EnumMenu} from '../util/Enum';

type Props = {
  item: OutlineItem;
  size?: number;
  style?: StyleProp<ViewStyle>;
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
        onChange={value => outliner.updateOutlineItem(item, {state: value})}
        anchor={onPress => (
          <EnumIconButton
            enums={VisibilityStateEnums}
            value={item.state}
            size={size}
            style={style}
            onPress={onPress}
          />
        )}
      />
    </View>
  );
}
