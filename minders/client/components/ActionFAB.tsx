/**
 * @format
 */

import * as React from 'react';
import {FAB} from 'react-native-paper';
import {ActionItem, useAction} from '@toolkit/core/client/Action';

type Props = {item: ActionItem} & Omit<
  React.ComponentProps<typeof FAB>,
  'icon'
>;
export default function ActionFAB(props: Props) {
  const {item, ...fabProps} = props;
  const [action] = useAction(item.action);

  return (
    <>
      <FAB {...fabProps} icon={item.icon ?? ''} onPress={() => action()} />
    </>
  );
}
