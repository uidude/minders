/**
 * @format
 */

import * as React from 'react';
import {FAB} from 'react-native-paper';
import {ActionItem, useAction} from '@toolkit/core/client/Action';
import {Shortcut, useShortcuts} from '@app/util/Shortcuts';
import {ActionItemWithShortcut} from './Actions';

type Props = {item: ActionItemWithShortcut} & Omit<
  React.ComponentProps<typeof FAB>,
  'icon'
>;
export default function ActionFAB(props: Props) {
  const {item, ...fabProps} = props;
  const [action] = useAction(item.action);

  const shortcuts: Shortcut[] = [];
  const keys = (typeof item.key == 'string' ? [item.key] : item.key) ?? [];
  for (const key of keys) {
    shortcuts.push({key, action});
  }

  useShortcuts(shortcuts);

  return (
    <>
      <FAB {...fabProps} icon={item.icon ?? ''} onPress={() => action()} />
    </>
  );
}
