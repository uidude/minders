/**
 * @format
 */
import * as React from 'react';
import {FAB} from 'react-native-paper';
import type {Action, HandlerRef} from './Actions';
import {actionHandlerComponent} from './Actions';

type Props = {action: Action} & React.ComponentProps<typeof FAB>;
export default function ActionFAB(props: Props) {
  const {action, ...fabProps} = props;

  const ActionComponent = actionHandlerComponent(action);
  const handlerRef: HandlerRef = {};

  return (
    <>
      <ActionComponent handler={handlerRef} />
      <FAB
        {...fabProps}
        icon={action.icon}
        onPress={() => handlerRef.current && handlerRef.current()}
      />
    </>
  );
}
