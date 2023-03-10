/**
 * @format
 */

import * as React from 'react';
import {Snackbar} from 'react-native-paper';
import {Opt} from '@toolkit/core/util/Types';
import {useUiTool, type UiTool} from './UiTools';

const MessagingComponent = () => {
  const [visible, setVisible] = React.useState(false);
  const messaging = Messaging.get();
  const [message, setMessage] = React.useState<Opt<Message>>();

  function onDismiss() {
    setVisible(false);
  }

  messaging.listen(() => {
    const newMessage = messaging.getNextMessage();
    if (newMessage) {
      setMessage(newMessage);
      setVisible(true);
    }
  });

  const style = message?.type == 'error' ? styles.error : null;

  return (
    <Snackbar visible={visible} onDismiss={onDismiss} style={style}>
      {message?.text}
    </Snackbar>
  );
};

type Message = {
  text: string;
  type: 'error' | 'warning' | 'info';
};

export class Messaging {
  messages: Message[] = [];
  listeners: Set<() => void> = new Set();

  showMessage(message: Message) {
    this.messages.push(message);
    /** @ts-ignore */
    for (const listener of this.listeners) {
      listener();
    }
  }

  getNextMessage(): Opt<Message> {
    if (this.messages.length == 0) {
      return null;
    }
    return this.messages.splice(0, 1)[0];
  }

  listen(listener: () => void) {
    this.listeners.add(listener);
  }

  unlisten(listener: () => void) {
    this.listeners.delete(listener);
  }

  static get(): Messaging {
    return useUiTool(MessagingTool);
  }

  static foo: string;
}

// Something wrong here about using an instance of messaging...
export const MessagingTool: UiTool<Messaging> = {
  api: new Messaging(),
  component: MessagingComponent,
};

const styles = {
  error: {
    backgroundColor: '#BB0000',
  },
};
