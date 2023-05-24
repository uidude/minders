/**
 * @format
 */

import * as React from 'react';
import {useIsFocused, useNavigation, useRoute} from '@react-navigation/native';
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

/**
 * Cooloff after any user input in text before global shortcuts are accepted.
 *
 * There are a number of flows where text inputs are blurred while the user is typing,
 * and it is easy to accidentally trigger a global shortcut.
 */
const COOLOFF_MS = 200;
let lastInText = 0;

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
    const inTextNow = nodeType == 'INPUT' || nodeType == 'TEXTAREA';
    const now = Date.now();
    const wasJustInText = now < lastInText + COOLOFF_MS;
    if (inTextNow) {
      lastInText = now;
    }
    const inText = inTextNow || wasJustInText;
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

  length() {
    return this.values.length;
  }

  static get() {
    return useUiTool(ShortcutTool);
  }
}
/**
 * Add a shortcut for the scope of this component being mounted and
 * part of a focused screen.
 *
 * `enabled` params should be used for conditional shortcuts - if set
 * to false, the shortcut isn't enabled but the React hook order is maintained.
 */
export function useShortcut(shortcut: Shortcut, enable: boolean = true) {
  useShortcuts([shortcut], enable);
}

/**
 * Use a list of shortcuts.
 * To support keeping React hook usage constant, if there are a variable
 * number of shortcuts
 * If `enable` is false, shortcuts are not used but neededt
 * @param cuts Use
 * @param enable
 */
export function useShortcuts(cuts: Shortcut[], enable: boolean = true) {
  const shortcuts = Shortcuts.get();
  const navigation = useNavigation();
  const focused = React.useRef(true);
  const activeShorcuts = React.useRef<Shortcut[]>([]);

  function addCuts() {
    removeCuts();
    if (enable) {
      for (const shortcut of cuts) {
        shortcuts.add(shortcut);
      }
      activeShorcuts.current = cuts;
    }
    return () => removeCuts();
  }

  function removeCuts() {
    if (activeShorcuts.current.length > 0) {
      for (const shortcut of activeShorcuts.current) {
        shortcuts.remove(shortcut);
      }
      activeShorcuts.current = [];
    }
  }

  addCuts();

  React.useEffect(addCuts, []);
  React.useEffect(() => navigation.addListener('focus', () => addCuts()), []);
  React.useEffect(() => navigation.addListener('blur', removeCuts), []);
}

// Something wrong here about using an instance of messaging...
export const ShortcutTool: UiTool<Shortcuts> = {
  api: new Shortcuts(),
  component: ShortcutComponent,
};
