/**
 * @format
 */

import {useRoute} from '@react-navigation/native';
import {ActionItem, actionHook} from '@toolkit/core/client/Action';
import {useReload} from '@toolkit/core/client/Reload';
import {Opt} from '@toolkit/core/util/Types';
import {UpdaterValue} from '@toolkit/data/DataStore';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Minder, useMinderScreenState, useMinderStore} from '@app/model/Minders';
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
        //waitDialog.show(outliner, item);
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

export function useIndent(minder: Minder, prev: Opt<Minder>) {
  const reload = useReload();
  const minderStore = useMinderStore();

  return {
    id: 'indent',
    icon: 'format-indent-increase',
    label: 'Indent',
    action: async () => {
      let newParent;
      if (prev) {
        newParent = prev;
      } else {
        newParent = newParent = await minderStore.create({
          project: minder.project,
          parentId: minder.parentId,
          state: 'cur',
          text: '-',
        });
      }
      await minderStore.update(minder, {parentId: newParent.id});
      reload();
    },
  };
}

export function useOutdent(minder: Minder, grandparent: Opt<Minder>) {
  const reload = useReload();
  const minderStore = useMinderStore();

  return {
    id: 'outdent',
    icon: 'format-indent-decrease',
    label: 'Outdent',
    action: async () => {
      const updater = {
        parentId: grandparent ? grandparent.id : UpdaterValue.fieldDelete(),
      };
      await minderStore.update(minder, updater);
      reload();
    },
  };
}

export function useMinderActions(minder: Minder) {
  const minderStore = useMinderStore();
  const reload = useReload(); // TODO:Remove this
  const nav = useNav();

  const FocusOn: ActionItem = {
    id: 'focuson',
    icon: 'target',
    label: 'Focus on',
    action: () => {}, //setOutlineState({focus: item.id}),
  };

  const Bump: ActionItem = {
    id: 'bump',
    icon: 'format-vertical-align-top',
    label: 'Bump to top',
    action: () => {}, //outliner.bump(item),
  };

  const Snooze: ActionItem = {
    id: 'snooze',
    icon: 'alarm-snooze',
    label: 'Snooze',
    action: actionHook(() => {
      const waitDialog = WaitDialog.get();

      return () => {
        waitDialog.show(async ({snoozeTil}) => {
          await minderStore.update(minder, {snoozeTil, state: 'waiting'});
        });
      };
    }),
  };

  const DELETE_WARN = 'Are you sure you want to delete this item?';
  const Delete: ActionItem = {
    id: 'delete',
    icon: 'delete-outline',
    label: 'Delete',
    action: () => {
      setTimeout(() => {
        BinaryAlert(DELETE_WARN, null, () => minderStore.remove(minder.id));
      }, 0);
    },
  };

  const Pin: ActionItem = {
    id: 'pin',
    icon: 'pin',
    label: 'Pin',
    action: () => {}, //outliner.updateOutlineItem(item, {pinned: true}),
  };

  const Unpin: ActionItem = {
    id: 'unpin',
    icon: 'pin', // This is weird but it's for a button that is shown when pinned
    label: 'Unpin',
    action: () => {}, // outliner.updateOutlineItem(item, {pinned: false}),
  };

  const Mover: ActionItem = {
    id: 'mover',
    icon: 'arrow-top-right',
    label: 'Move Item',
    action: () => {}, //nav.navTo(OutlineMover, {focus: item.id}),
  };

  return {FocusOn, Bump, Snooze, Delete, Pin, Unpin, Mover};
}

export type ActionItemWithShortcut = ActionItem & {key?: string | string[]};

export const NewItem: ActionItemWithShortcut = {
  id: 'new',
  icon: 'plus',
  label: 'New item',
  key: ['+'],
  action: actionHook(() => {
    const route = useRoute();
    const outliner = useOutliner();
    const [outlineState] = useOutlineState();
    const minderStore = useMinderStore();
    const {requestSelect} = useMinderScreenState();
    return async () => {
      if (route.name === 'MinderList') {
        // TODO: Bind NewItem to a project
        const {projects} = await minderStore.getAll();
        const minder = await minderStore.create({
          project: projects[0],
          text: '',
          state: 'new',
        });
        requestSelect(minder.id, 'start');
      } else {
        const parent = outlineState.focusItem;
        const kids = getChildren(parent);
        outliner.createItemAfter(kids[kids.length - 1], '');
      }
    };
  }),
};

export const Up: ActionItemWithShortcut = {
  id: 'up',
  icon: 'arrow-up-bold-box-outline',
  label: 'Up',
  key: ['u', 'ArrowUp'],
  action: actionHook(() => {
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
