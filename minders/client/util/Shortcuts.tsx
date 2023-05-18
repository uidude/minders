/**
 * @format
 */

import * as React from 'react';
import {Opt} from '@toolkit/core/util/Types';
import {UiToolsContext, useUiTool, type UiTool} from './UiTools';

const KeyEventTypes: Record<string, string> = {
  Tab: 'keydown',
  Escape: 'keydown',
  Backspace: 'keydown',
  ArrowDown: 'keydown',
  ArrowUp: 'keydown',
  ArrowLeft: 'keydown',
  ArrowRight: 'keydown',
  Enter: 'keydown',
};

const DefaultKeyEventType = 'keypress';

function applies(val: Opt<boolean>, match: boolean) {
  return val === undefined || match === val;
}

const ShortcutComponent = () => {
  const shortcutApi = Shortcuts.get();

  async function onKey(e: KeyboardEvent) {
    // Copying values as they can change while iterating
    const shortcuts = [...shortcutApi.values];
    const eventTypeToMatch = KeyEventTypes[e.key] || DefaultKeyEventType;
    if (eventTypeToMatch != e.type) {
      return;
    }

    // Bad logic for preventing shortcuts on text edits... need better
    // @ts-ignore
    const nodeType = e.srcElement.nodeName;
    const inText = nodeType == 'INPUT' || nodeType == 'TEXTAREA';
    for (const shortcut of shortcuts) {
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
      window.document.addEventListener('keypress', onKey, true);
      window.document.addEventListener('keydown', onKey, true);
      return () => {
        window.document.removeEventListener('keypress', onKey, true);
        window.document.removeEventListener('keydown', onKey, true);
      };
    }
  });

  return <></>;
};

export type ShortcutAction = () => boolean | void | Promise<boolean | void>;
export type Shortcut = {
  key: string;
  // If true, continue the processing
  action: ShortcutAction;
  shift?: boolean;
  inText?: boolean;
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

export function useShortcuts(cuts: Shortcut[]) {
  const shortcuts = Shortcuts.get();
  React.useEffect(() => {
    for (const shortcut of cuts) {
      shortcuts.add(shortcut);
    }
    return () => {
      for (const shortcut of cuts) {
        shortcuts.remove(shortcut);
      }
    };
  });
}

// Something wrong here about using an instance of messaging...
export const ShortcutTool: UiTool<Shortcuts> = {
  api: new Shortcuts(),
  component: ShortcutComponent,
};
