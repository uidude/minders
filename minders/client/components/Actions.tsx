/**
 * @format
 */

import {ActionItem, actionHook} from '@toolkit/core/client/Action';
import {useReload} from '@toolkit/core/client/Reload';
import {Opt} from '@toolkit/core/util/Types';
import {UpdaterValue} from '@toolkit/data/DataStore';
import {useNav, useNavState} from '@toolkit/ui/screen/Nav';
import {
  Minder,
  MinderProject,
  nonNull,
  useMinderListParams,
  useMinderScreenState,
  useMinderStore,
} from '@app/model/Minders';
import SettingsScreen from '@app/screens/SettingsScreen';
import {BinaryAlert} from '@app/util/Alert';
import {WaitDialog} from './WaitDialog';

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
  const nav = useNav();
  const {location} = useNavState();

  const FocusOn: ActionItem = {
    id: 'focuson',
    icon: 'target',
    label: 'Focus on',
    action: () => {
      const newTop = minder.id.replace(':', '>');
      nav.navTo(location.screen, {...location.params, top: newTop});
    },
  };

  const Bump: ActionItem = {
    id: 'bump',
    icon: 'format-vertical-align-top',
    label: 'Bump to top',
    action: async () => {
      await minderStore.update(minder, {updatedAt: Date.now()});
    },
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
    const minderStore = useMinderStore();
    const {requestSelect} = useMinderScreenState();
    const {top: topId} = useMinderListParams();
    return async () => {
      // TODO: More efficient call to get project
      const {project} = await minderStore.getAll(topId, 'all');
      const minder = await minderStore.create({
        project: project,
        text: '',
        state: 'new',
      });
      requestSelect(minder.id, 'start');
    };
  }),
};

export const Up: ActionItemWithShortcut = {
  id: 'up',
  icon: 'arrow-up-bold-box-outline',
  label: 'Up',
  key: ['u', 'ArrowUp'],
  action: actionHook(() => {
    const minderStore = useMinderStore();
    const {top: topId} = useMinderListParams();
    const nav = useNav();
    const {location} = useNavState();

    return async () => {
      const isProject = topId.indexOf('project') == 0;
      if (isProject) {
        return;
      }
      const minder = (await minderStore.get(topId, {edges: [MinderProject]}))!;

      const newTopId = minder.parentId ?? minder.project!.id;

      const newTop = newTopId.replace(':', '>');
      nav.navTo(location.screen, {...location.params, top: newTop});
    };
  }),
};

export const Expand: ActionItemWithShortcut = {
  id: 'expand',
  icon: 'expand-all-outline',
  label: 'Expand All',
  key: 'x',
  action: actionHook(() => {
    return () => {};
    /*
    const outliner = useOutliner();
    return () => {
      if (!outliner) {
        return;
      }
      const item: OutlineItem = outliner.getFocusItem();
      batch(() => outliner.expandAll(item));
    };*/
  }),
};

export const Collapse: ActionItemWithShortcut = {
  id: 'collapse',
  icon: 'collapse-all-outline',
  label: 'Collapse All',
  key: 'c',
  action: actionHook(() => {
    return () => {};
    /*
    const outliner = useOutliner();
    return () => {
      if (!outliner) {
        return;
      }
      const item: OutlineItem = outliner.getFocusItem();
      batch(() => outliner.collapseAll(item));
    };*/
  }),
};

export const Home: ActionItemWithShortcut = {
  id: 'home',
  icon: 'home',
  label: 'Home',
  key: 'h',
  action: actionHook(() => {
    return () => {};
    /*
    const [, setOutlineState] = useOutlineState();
    return () => {
      setOutlineState({focus: undefined});
    };*/
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
