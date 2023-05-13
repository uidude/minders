/**
 * @format
 */

import {ActionItem, actionHook} from '@toolkit/core/client/Action';
import {useNav} from '@toolkit/ui/screen/Nav';
import {useOutlineState, useOutliner} from '@app/model/OutlinerContext';
import OutlineMover from '@app/screens/OutlineMover';
import SettingsScreen from '@app/screens/SettingsScreen';
import {BinaryAlert} from '@app/util/Alert';
import {batch} from '@app/util/Useful';
import {OutlineItem, getChildren} from '../model/outliner';
import {WaitDialog} from './WaitDialog';

export function useItemActions(item: OutlineItem) {
  const [, setOutlineState] = useOutlineState();
  const outliner = useOutliner();
  const nav = useNav();

  const FocusOn: ActionItem = {
    id: 'focuson',
    icon: 'target',
    label: 'Focus on',
    action: () => setOutlineState({focus: item.id}),
  };

  const Bump: ActionItem = {
    id: 'bump',
    icon: 'format-vertical-align-top',
    label: 'Bump to top',
    action: () => outliner.bump(item),
  };

  const Snooze: ActionItem = {
    id: 'snooze',
    icon: 'alarm-snooze',
    label: 'Snooze',
    action: actionHook(() => {
      const waitDialog = WaitDialog.get();
      return () => {
        waitDialog.show(outliner, item);
      };
    }),
  };

  const Indent: ActionItem = {
    id: 'indent',
    icon: 'format-indent-increase',
    label: 'Indent',
    action: () => outliner.nest(item),
  };

  const Outdent: ActionItem = {
    id: 'outdent',
    icon: 'format-indent-decrease',
    label: 'Outdent',
    action: () => outliner.unnest(item),
  };

  const DELETE_WARN = 'Are you sure you want to delete this item?';
  const Delete: ActionItem = {
    id: 'delete',
    icon: 'delete-outline',
    label: 'Delete',
    action: () => {
      setTimeout(
        () => BinaryAlert(DELETE_WARN, null, () => outliner.deleteItem(item)),
        0,
      );
    },
  };

  const Pin: ActionItem = {
    id: 'pin',
    icon: 'pin',
    label: 'Pin',
    action: () => outliner.updateOutlineItem(item, {pinned: true}),
  };

  const Unpin: ActionItem = {
    id: 'unpin',
    icon: 'pin', // This is weird but it's for a button that is shown when pinned
    label: 'Unpin',
    action: () => outliner.updateOutlineItem(item, {pinned: false}),
  };

  const Mover: ActionItem = {
    id: 'mover',
    icon: 'arrow-top-right',
    label: 'Move Item',
    action: () => nav.navTo(OutlineMover, {focus: item.id}),
  };

  return {FocusOn, Bump, Snooze, Indent, Outdent, Delete, Pin, Unpin, Mover};
}

export type ActionItemWithShortcut = ActionItem & {key?: string | string[]};

export const NewItem: ActionItemWithShortcut = {
  id: 'new',
  icon: 'plus',
  label: 'New item',
  key: ['+'],
  action: actionHook(() => {
    const outliner = useOutliner();
    const [outlineState, setOutlineState] = useOutlineState();
    return () => {
      const parent = outlineState.focusItem;
      const kids = getChildren(parent);
      outliner.createItemAfter(kids[kids.length - 1], '');
    };
  }),
};

export const Up: ActionItemWithShortcut = {
  id: 'up',
  icon: 'arrow-up-bold-box-outline',
  label: 'Up',
  key: ['u', 'ArrowUp'],
  action: actionHook(() => {
    const outliner = useOutliner();
    const [outlineState, setOutlineState] = useOutlineState();

    return () => {
      const parent = outlineState.focusItem.parent;
      parent && setOutlineState({focus: parent.id});
    };
  }),
};

export const Expand: ActionItemWithShortcut = {
  id: 'expand',
  icon: 'expand-all-outline',
  label: 'Expand All',
  key: 'x',
  action: actionHook(() => {
    const outliner = useOutliner();
    return () => {
      if (!outliner) {
        return;
      }
      const item: OutlineItem = outliner.getFocusItem();
      batch(() => outliner.expandAll(item));
    };
  }),
};

export const Collapse: ActionItemWithShortcut = {
  id: 'collapse',
  icon: 'collapse-all-outline',
  label: 'Collapse All',
  key: 'c',
  action: actionHook(() => {
    const outliner = useOutliner();
    return () => {
      if (!outliner) {
        return;
      }
      const item: OutlineItem = outliner.getFocusItem();
      batch(() => outliner.collapseAll(item));
    };
  }),
};

export const Home: ActionItemWithShortcut = {
  id: 'home',
  icon: 'home',
  label: 'Home',
  key: 'h',
  action: actionHook(() => {
    const [, setOutlineState] = useOutlineState();
    return () => {
      setOutlineState({focus: undefined});
    };
  }),
};

export const Settings: ActionItemWithShortcut = {
  id: 'settings',
  icon: 'ion:settings-outline',
  label: 'Settings',
  action: actionHook(() => {
    const {navTo} = useNav();
    return async () => {
      navTo(SettingsScreen);
    };
  }),
};
