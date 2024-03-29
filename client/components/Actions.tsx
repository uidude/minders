/**
 * @format
 */

import {ActionItem, actionHook} from '@toolkit/core/client/Action';
import {useReload} from '@toolkit/core/client/Reload';
import {use} from '@toolkit/core/providers/Providers';
import {Opt} from '@toolkit/core/util/Types';
import {CacheManagerKey} from '@toolkit/data/DataCache';
import {FieldDelete, Updater} from '@toolkit/data/DataStore';
import {useNav, useNavState} from '@toolkit/ui/screen/Nav';
import {Minder, MinderProject, useMinderStore} from '@app/common/MinderApi';
import Minders from '@app/screens/Minders';
import Projects from '@app/screens/Projects';
import SettingsScreen from '@app/screens/SettingsScreen';
import {BinaryAlert} from '@app/util/Alert';
import {useMinderListParams} from '@app/util/UiUtil';
import {SnoozeDialog} from './SnoozerChooser';

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
      await minderStore.update({
        id: minder.id,
        parentId: newParent.id,
        checkVersion: minder.updatedAt,
      });
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
      const fields = {
        id: minder.id,
        parentId: grandparent ? grandparent.id : FieldDelete,
        checkVersion: minder.updatedAt,
      };
      await minderStore.update(fields);
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
      await minderStore.update({
        id: minder.id,
        updatedAt: Date.now(),
        checkVersion: minder.updatedAt,
      });
    },
  };

  const Snooze: ActionItem = {
    id: 'snooze',
    icon: 'alarm-snooze',
    label: 'Snooze',
    action: actionHook(() => {
      const snoozeDialog = SnoozeDialog.get();
      const unsnoozedState =
        minder.state == 'waiting' ? minder.unsnoozedState : minder.state;

      return () => {
        snoozeDialog.show(async ({snoozeTil}) => {
          await minderStore.update(
            {
              id: minder.id,
              snoozeTil,
              state: 'waiting',
              checkVersion: minder.updatedAt,
              unsnoozedState,
            },
            {optimistic: true},
          );
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
    // For testing purposes
    action: async () => {
      const moveTo = 'project:cdbaaee0-35f3-4665-9ba1-bdd0a48194ac';
      await minderStore.update({
        id: minder.id,
        state: 'cur',
        project: {id: moveTo},
        checkVersion: minder.updatedAt,
      });
    }, //nav.navTo(OutlineMover, {focus: item.id}),
  };

  return {FocusOn, Bump, Snooze, Delete, Pin, Unpin, Mover};
}

export type ActionItemWithShortcut = ActionItem & {key?: string | string[]};

// Separate from global actions as it is rendered without suspense
export const NewItem: ActionItemWithShortcut = {
  id: 'new',
  icon: 'plus',
  label: 'New item',
  key: ['+'],
  action: actionHook(() => {
    const minderStore = useMinderStore();
    const {top: topId} = useMinderListParams();
    return async () => {
      let projectId = topId;
      if (topId.indexOf('minder') === 0) {
        const minder = (await minderStore.get(topId, {
          edges: [MinderProject],
        }))!;
        projectId = minder.project!.id;
      }
      const fields: Updater<Minder> = {
        project: {id: projectId},
        text: '',
        state: 'new',
      };
      await minderStore.create(fields, {optimistic: true});
    };
  }),
};

export function useGlobalActions() {
  const minderStore = useMinderStore();
  const {top: topId} = useMinderListParams();
  const nav = useNav();
  const {location} = useNavState();
  const reload = useReload();

  const Up: ActionItemWithShortcut = {
    id: 'up',
    icon: 'arrow-up-bold-box-outline',
    label: 'Up',
    key: ['u', 'ArrowUp'],
    action: async () => {
      const isProject = topId.indexOf('project') == 0;
      if (isProject) {
        return;
      }
      const minder = (await minderStore.get(topId, {edges: [MinderProject]}))!;
      const newTopId = minder.parentId ?? minder.project!.id;
      const newTop = newTopId.replace(':', '>');
      nav.navTo(location.screen, {...location.params, top: newTop});
    },
  };

  const Expand: ActionItemWithShortcut = {
    id: 'expand',
    icon: 'expand-all-outline',
    label: 'Expand All',
    key: 'x',
    action: async () => {},
    /*
    const outliner = useOutliner();
    return () => {
      if (!outliner) {
        return;
      }
      const item: OutlineItem = outliner.getFocusItem();
      batch(() => outliner.expandAll(item));
    };*/
  };

  const Collapse: ActionItemWithShortcut = {
    id: 'collapse',
    icon: 'collapse-all-outline',
    label: 'Collapse All',
    key: 'c',
    action: async () => {},
    /*
    const outliner = useOutliner();
    return () => {
      if (!outliner) {
        return;
      }
      const item: OutlineItem = outliner.getFocusItem();
      batch(() => outliner.collapseAll(item));
    };*/
  };

  const Home: ActionItemWithShortcut = {
    id: 'home',
    icon: 'home',
    label: 'Home',
    key: 'h',
    action: async () => nav.reset(Minders),
  };

  const Settings: ActionItemWithShortcut = {
    id: 'settings',
    icon: 'ion:settings-outline',
    label: 'Settings',
    action: async () => nav.navTo(SettingsScreen),
  };

  const Import: ActionItem = {
    id: 'projects',
    icon: 'folder-multiple-outline',
    label: 'Projects',
    action: async () => nav.navTo(Projects),
  };

  const Refresh: ActionItemWithShortcut = {
    id: 'refresh',
    icon: 'reload',
    label: 'Refresh',
    key: 'u',
    action: actionHook(() => {
      const cacheManager = use(CacheManagerKey);
      return async () => {
        await cacheManager.clear();
        reload();
      };
    }),
  };

  return {Collapse, Expand, Home, NewItem, Settings, Up, Import, Refresh};
}
