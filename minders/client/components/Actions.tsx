/**
 * @format
 */

import * as React from 'react';
import {useContext} from 'react';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {Opt} from '@toolkit/core/util/Types';
import {useNav} from '@toolkit/ui/screen/Nav';
import OutlinerContext, {
  useOutlineState,
  useOutliner,
} from '@app/model/OutlinerContext';
import OutlineMover from '@app/screens/OutlineMover';
import SettingsScreen from '@app/screens/SettingsScreen';
import {BinaryAlert} from '@app/util/Alert';
import {Shortcuts, useShortcut} from '@app/util/Shortcuts';
import {batch} from '@app/util/Useful';
import type {OutlineItem} from '../model/outliner';
import {getChildren} from '../model/outliner';
import {WaitDialog} from './WaitDialog';

export type Handler = () => Promise<void> | void;
export type HandlerRef = {current?: Opt<Handler>};

export type Action = {
  id: string;
  icon: string;
  label: string;
  key?: string | string[];
  handle: () => Handler;
};

export function useAction(action: Action): Handler {
  const handler = action.handle();
  if (action.key) {
    const keys: string[] =
      typeof action.key == 'string' ? [action.key] : action.key;
    for (const key of keys) {
      useShortcut({key: key, action: handler});
    }
  }
  return handler;
}

// Useful for variable # of actions displayed
// As useContext calls needs to be same per component render
export function actionHandlerComponent(action: Action) {
  const handlerComponent = (props: {handler: HandlerRef}) => {
    props.handler.current = useAction(action);
    return <></>;
  };
  return handlerComponent;
}

export const FocusOn: Action = {
  id: 'focuson',
  icon: 'target',
  label: 'Focus on',
  handle: () => {
    const context = useContext(OutlinerContext);
    const [outlineState, setOutlineState] = useOutlineState();
    return () => {
      if (!context || !context.item) {
        return;
      }
      setOutlineState({focus: context.item.id});
    };
  },
};

export const Bump: Action = {
  id: 'bump',
  icon: 'format-vertical-align-top',
  label: 'Bump to top',
  handle: () => {
    const user = requireLoggedInUser();
    const context = useContext(OutlinerContext);
    return () => {
      if (!context || !context.item) {
        return;
      }
      const item: OutlineItem = context.item;
      context.getOutliner(user.id).bump(item);
    };
  },
};

export const Snooze: Action = {
  id: 'snooze',
  icon: 'alarm-snooze', //'timer-sand-empty',
  label: 'Snooze',
  handle: () => {
    const outliner = useOutliner();
    const context = useContext(OutlinerContext);
    const waitDialog = WaitDialog.get();
    return () => {
      waitDialog.show(outliner, context.item);
    };
  },
};

export const Indent: Action = {
  id: 'indent',
  icon: 'format-indent-increase',
  label: 'Indent',
  handle: () => {
    const user = requireLoggedInUser();
    const context = useContext(OutlinerContext);
    return () => {
      if (!context || !context.item) {
        return;
      }
      const item: OutlineItem = context.item;
      context.getOutliner(user.id).nest(item);
    };
  },
};

export const Outdent: Action = {
  id: 'outdent',
  icon: 'format-indent-decrease',
  label: 'Outdent',
  handle: () => {
    const user = requireLoggedInUser();
    const context = useContext(OutlinerContext);
    return () => {
      if (!context || !context.item) {
        return;
      }
      const item: OutlineItem = context.item;
      context.getOutliner(user.id).unnest(item);
    };
  },
};

export const Delete: Action = {
  id: 'delete',
  icon: 'delete-outline',
  label: 'Delete',
  handle: () => {
    const user = requireLoggedInUser();
    const context = useContext(OutlinerContext);
    return () => {
      if (!context || !context.item) {
        return;
      }
      const item = context.item;

      setTimeout(
        () =>
          BinaryAlert('Are you sure you want to delete this item?', null, () =>
            context.getOutliner(user.id).deleteItem(item),
          ),
        0,
      );
    };
  },
};

export const Pin: Action = {
  id: 'pin',
  icon: 'pin',
  label: 'Pin',
  handle: () => {
    const user = requireLoggedInUser();
    const context = useContext(OutlinerContext);
    return () => {
      if (!context || !context.item) {
        return;
      }
      const item = context.item;
      context.getOutliner(user.id).updateOutlineItem(item, {pinned: true});
    };
  },
};

export const Unpin: Action = {
  id: 'unpin',
  icon: 'pin', // This is weird but it's for a button that is shown when pinned
  label: 'Unpin',
  handle: () => {
    const user = requireLoggedInUser();
    const context = useContext(OutlinerContext);
    return () => {
      if (!context || !context.item) {
        return;
      }
      const item = context.item;
      context.getOutliner(user.id).updateOutlineItem(item, {pinned: false});
    };
  },
};

export const Mover: Action = {
  id: 'mover',
  icon: 'arrow-top-right',
  label: 'Move Item',
  handle: () => {
    const nav = useNav();
    const context = useContext(OutlinerContext);
    return () => {
      if (!context || !context.item) {
        return;
      }
      nav.navTo(OutlineMover, {focus: context.item.id});
    };
  },
};

// Possibly make this part o what is returned?
function withShortcut(key: string, action: () => void | Promise<void>) {
  const shortcut = {key, action};
  const shortcuts = Shortcuts.get();
  React.useEffect(() => {
    shortcuts.add(shortcut);
    return () => shortcuts.remove(shortcut);
  });
  return action;
}

export const NewItem: Action = {
  id: 'new',
  icon: 'plus',
  label: 'New item',
  key: ['+'],
  handle: () => {
    const outliner = useOutliner();
    const [outlineState, setOutlineState] = useOutlineState();
    return () => {
      const parent = outlineState.focusItem;
      const kids = getChildren(parent);
      outliner.createItemAfter(kids[kids.length - 1], '');
    };
  },
};

export const Up: Action = {
  id: 'up',
  icon: 'arrow-up-bold-box-outline',
  label: 'Up',
  key: ['u', 'ArrowUp'],
  handle: () => {
    const outliner = useOutliner();
    const [outlineState, setOutlineState] = useOutlineState();

    return () => {
      const parent = outlineState.focusItem.parent;
      parent && setOutlineState({focus: parent.id});
    };
  },
};

export const Expand: Action = {
  id: 'expand',
  icon: 'expand-all-outline',
  label: 'Expand All',
  key: 'x',
  handle: () => {
    const outliner = useOutliner();
    return () => {
      if (!outliner) {
        return;
      }
      const item: OutlineItem = outliner.getFocusItem();
      batch(() => outliner.expandAll(item));
    };
  },
};

export const Collapse: Action = {
  id: 'collapse',
  icon: 'collapse-all-outline',
  label: 'Collapse All',
  key: 'c',
  handle: () => {
    const outliner = useOutliner();
    return () => {
      if (!outliner) {
        return;
      }
      const item: OutlineItem = outliner.getFocusItem();
      batch(() => outliner.collapseAll(item));
    };
  },
};

export const Home: Action = {
  id: 'home',
  icon: 'home',
  label: 'Home',
  key: 'h',
  handle: () => {
    const [outlineState, setOutlineState] = useOutlineState();
    return () => {
      setOutlineState({focus: undefined});
    };
  },
};

export const Login: Action = {
  id: 'settings',
  icon: 'wrench-outline',
  label: 'Settings',
  handle: () => {
    const {navTo} = useNav();
    return async () => {
      navTo(SettingsScreen);
    };
  },
};
