// @flow

import * as React from 'react';
import {type UiTool, UiToolsContext, useUiTool} from './UiTools';

const KeyEventTypes = {
  Tab: 'keydown',
  Escape: 'keydown',
  Backspace: 'keydown',
  ArrowDown: 'keydown',
  ArrowUp: 'keydown',
  ArrowLeft: 'keydown',
  ArrowRight: 'keydown',
};

const DefaultKeyEventType = 'keypress';

function applies(val?: boolean, match: boolean) {
  return val === undefined || match === val;
}

const ShortcutComponent = (): React.Node => {
  const shortcuts = Shortcuts.get();

  async function onKey(e) {
    const eventTypeToMatch = KeyEventTypes[e.key] || DefaultKeyEventType;
    if (eventTypeToMatch != e.type) {
      return;
    }

    // Bad logic for preventing shortcuts on text edits... need better
    const nodeType = e.srcElement.nodeName;
    const inText = nodeType == 'INPUT' || nodeType == 'TEXTAREA';
    for (const shortcut of shortcuts.values) {
      if (shortcut.inText || !inText) {
        // TODO: modifier state
        if (shortcut.key == e.key && applies(shortcut.shift, e.shiftKey)) {
          const keepGoing = await shortcut.action();
          if (!keepGoing) {
            e.stopPropagation();
            e.preventDefault();
          }
        }
      }
    }
  }

  React.useEffect(() => {
    if (window && window.document) {
      window.document.addEventListener('keydown', onKey, true);
      window.document.addEventListener('keypress', onKey, true);
      return () => {
        window.document.removeEventListener('keypress', onKey, true);
        window.document.removeEventListener('keydown', onKey, true);
      };
    }
  });

  return <></>;
};

type Shortcut = {
  key: string,
  // If true, continue the processing
  action: () => ?boolean | Promise<?boolean>,
  shift?: boolean,
  inText?: boolean,
};

export class Shortcuts {
  // TODO: More efficient lookup
  values: Shortcut[] = [];

  add(shortcut: Shortcut) {
    this.values.push(shortcut);
  }

  remove(shortcut: Shortcut) {
    const indexOf = this.values.indexOf(shortcut);
    if (indexOf != -1) {
      this.values.splice(indexOf, 1);
    }
  }

  static get() {
    return useUiTool(ShortcutTool);
  }
}

export function useShortcut(shortcut: Shortcut, enable: boolean = true) {
  const shortcuts = Shortcuts.get();
  React.useEffect(() => {
    if (!enable) {
      return;
    }
    shortcuts.add(shortcut);
    return () => shortcuts.remove(shortcut);
  });
}

// Something wrong here about using an instance of messaging...
export const ShortcutTool: UiTool<Shortcuts> = {
  api: new Shortcuts(),
  component: ShortcutComponent,
};
