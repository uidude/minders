/**
 * @format
 */

import React from 'react';
import {StyleProp, View, ViewStyle} from 'react-native';
import {useAction} from '@toolkit/core/client/Action';
import {useDataListen} from '@toolkit/data/DataStore';
import {Minder, OutlineItemState, useMinderStore} from '@app/common/Minders';
import {EnumConfig, EnumIconButton, EnumMenu} from '../util/Enum';

const VisibilityStateEnums: EnumConfig<OutlineItemState> = new Map([
  ['top', {icon: 'star-outline', label: 'Starred'}],
  ['cur', {icon: 'eye-outline', label: 'Current'}],
  ['soon', {icon: 'clock-outline', label: 'Soon'}],
  ['later', {icon: 'alarm-off', label: 'Later'}],
  ['done', {icon: 'check-circle-outline', label: 'Done'}],
  ['waiting', {icon: 'timer-sand-empty', label: 'Waiting'}],
  ['new', {icon: 'new-box', label: 'New'}],
]);

type PropsM = {
  minder: Minder;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function EditableStatusM(props: PropsM) {
  const {minder, size, style} = props;
  const minderStore = useMinderStore();
  const [onChange] = useAction('UpdateState', updateState);
  const [state, setState] = React.useState(minder.state);

  useDataListen(Minder, minder.id, m => setState(m.state));

  async function updateState(newState: OutlineItemState) {
    if (newState !== state) {
      const newValues = {id: minder.id, state: newState};
      await minderStore.update(minder, newValues, {optimistic: true});
    }
  }

  // This is inefficient (too many menus, but I guess OK for now?)
  return (
    <EnumMenu
      enums={VisibilityStateEnums}
      onChange={onChange}
      anchor={onPress => (
        <EnumIconButton
          enums={VisibilityStateEnums}
          value={state}
          size={size}
          style={style}
          onPress={onPress}
        />
      )}
    />
  );
}
