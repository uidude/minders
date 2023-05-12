/**
 * @format
 */

import {Opt} from '@toolkit/core/util/Types';
import * as OutlineState from './OutlineState';

const STATE_VISIBILITY: Record<string, OutlineItemState[]> = {
  focus: ['cur', 'top'],
  review: ['new', 'waiting', 'soon'],
  pile: ['soon', 'later'],
  waiting: ['waiting'],
  all: ['cur', 'top', 'waiting', 'new', 'soon', 'later', 'done'],
  notdone: ['cur', 'top', 'new', 'soon', 'later'],
  done: ['done'],
};

const STATE_PRIORITY = [
  'waiting',
  'new',
  'top',
  'cur',
  'soon',
  'later',
  'done',
];

export type OutlineItemState =
  | 'waiting'
  | 'new'
  | 'top'
  | 'cur'
  | 'soon'
  | 'later'
  | 'done';
export type OutlineViewType = 'list' | 'outline';
export type OutlineItemVisibilityFilter =
  | 'focus'
  | 'review'
  | 'pile'
  | 'waiting'
  | 'all'
  | 'notdone'
  | 'done';

type OutlineItemUi = {
  view?: OutlineViewType;
  visibilityFilter?: OutlineItemVisibilityFilter;
  hidden?: boolean;
  kidsHidden?: boolean;
  closed?: boolean;
};

// Can we make this a class and still have
// useful data object semantics (e.g. safe to serialize)?
// We're already starting on this with "parent"...
export type OutlineItem = {
  parent: Opt<OutlineItem>;
  text: string;
  id: number;
  sub: Array<OutlineItem>;
  ui: OutlineItemUi;
  state: OutlineItemState;
  snoozedState?: OutlineItemState;
  created: Date;
  modified: Date;
  snoozeTil?: Opt<Date>;
  snoozeState?: Opt<OutlineItemState>;
  pinned?: boolean;
};

export type OutlineItemShape = Partial<OutlineItem>;

export type Outline = {
  top: Partial<OutlineItem>;
  version: number;
  baseVersion: number;
  focus?: number;
};

export const prioritySort = (lhs: OutlineItem, rhs: OutlineItem) => {
  const pridiff =
    STATE_PRIORITY.indexOf(lhs.state) - STATE_PRIORITY.indexOf(rhs.state);
  if (pridiff != 0) {
    return pridiff;
  }
  return 0;
};

function myIndex(item: OutlineItem) {
  if (!item.parent) {
    return 0;
  }
  return getChildren(item.parent).indexOf(item);
}

export const outlineSort = (lhs: OutlineItem, rhs: OutlineItem) => {
  if (isParent(lhs) && isParent(rhs)) {
    if (lhs.created.getTime() != rhs.created.getTime()) {
      // tag: DATELOGIC
      return rhs.created.getTime() - lhs.created.getTime();
    } else {
      // Hack for creation sort for items from before creation was saved
      return myIndex(rhs) - myIndex(rhs);
    }
  } else if (isParent(lhs) && !isParent(rhs)) {
    return -1;
  } else if (isParent(rhs) && !isParent(lhs)) {
    return 1;
  }

  const pridiff =
    STATE_PRIORITY.indexOf(lhs.state) - STATE_PRIORITY.indexOf(rhs.state);
  if (pridiff != 0) {
    return pridiff;
  }
  // tag: DATELOGIC
  const lhsmod = lhs.modified ? lhs.modified.getTime() : 0;
  const rhsmod = rhs.modified ? rhs.modified.getTime() : 0;
  return rhsmod - lhsmod;
};

export function outlineItem(
  values: Partial<OutlineItem>,
  justCreated: boolean = true,
): OutlineItem {
  const newDate = justCreated ? new Date() : new Date(0);
  return {
    state: values.state || 'new',
    id: values.id || nextItemId(),
    ui: values.ui || {},
    parent: values.parent,
    created: values.created != null ? values.created : newDate,
    modified: values.modified != null ? values.modified : newDate,
    snoozeTil: values.snoozeTil,
    snoozeState: values.snoozeState,
    sub: values.sub || [],
    text: values.text || '',
    pinned: values.pinned,
  };
}

function nextItemId() {
  return Math.round(Math.random() * 1000000000);
}

export default class Outliner {
  data: OutlineItem;
  outline: Outline;
  focusItem: OutlineItem;
  visibleStates: OutlineItemState[];
  itemMap: Record<number, OutlineItem> = {};
  pinned: Record<number, OutlineItem> = {};
  saver: Opt<(outliner: Outliner) => {}>;

  constructor(outline: Outline) {
    this.outline = outline;
    this.initialize(this.outline.top);
  }

  initialize(rawData: Partial<OutlineItem>): void {
    this.data = this.initialProcess(rawData, null);
    if (!this.data.ui) {
      return; // Should throw exception
    }

    this.data.ui.visibilityFilter = this.data.ui?.visibilityFilter || 'focus';
    this.data.ui.view = this.data.ui.view || 'outline';
    let filter = this.data.ui.visibilityFilter;

    // Renames
    // @ts-ignore
    if (filter == 'cur') {
      filter = 'focus';
    }
    // @ts-ignore
    if (filter == 'open') {
      filter = 'pile';
    }
    this.setVisibilityFilter(filter, true); // To force updates

    const focused = this.outline.focus
      ? this.itemMap[this.outline.focus]
      : this.data;
    this.setFocusItem(focused);
  }

  // In future, this will take just an ID and return void
  _outlineItemChange(item: OutlineItem) {
    OutlineState.fire(OutlineState.itemKey(item.id || 0));
  }

  setSnoozeValues(item: OutlineItem, newValues: Partial<OutlineItem>) {
    // Clear out snooze values when waking up
    if (newValues.state && newValues.state != 'waiting') {
      newValues.snoozeTil = null;
      newValues.snoozeState = null;
    }

    // Set snoozeState to current state (except when already waiting)
    if (
      newValues.state == 'waiting' &&
      item.state != 'waiting' &&
      !newValues.snoozeState
    ) {
      newValues.snoozeState = item.state;
    }
  }

  // In future, will take id + sparse item
  updateOutlineItem(
    item: OutlineItem,
    newValues: Partial<OutlineItem>,
    save: boolean = true,
  ) {
    let modified = false;

    this.setSnoozeValues(item, newValues);

    for (const fieldStr in newValues) {
      const field = fieldStr as keyof OutlineItem;
      if (item[field] !== newValues[field]) {
        // @ts-ignore
        item[field] = newValues[field];
        modified = true;
      }
    }

    if (getChildren(item).length == 0) {
      getItemUi(item).hidden = this._isHidden(item);
    }
    if (modified) {
      item.modified = new Date();

      if (save) {
        this.save();
      }

      if (item.pinned) {
        this.pinned[item.id] = item;
      } else {
        delete this.pinned[item.id];
      }
      this._outlineItemChange(item);
    }
  }

  save() {
    this.saver && this.saver(this);
  }

  // This should handle actual updating
  // of item as well, but requires refactoring
  _parentUpdated(item: OutlineItem, save: boolean = false) {
    item.modified = new Date();
    this._outlineItemChange(item);
    if (save) {
      this.save();
    }
  }

  expandAll(item: OutlineItem) {
    if (isParent(item)) {
      this.updateOutlineItemUi(item, {closed: false}, false);
      for (const child of getChildren(item)) {
        this.expandAll(child);
      }
    }
    /*this.save();*/
  }

  collapseAll(item: OutlineItem, recursive: boolean = false) {
    if (isParent(item)) {
      for (const child of getChildren(item)) {
        this.updateOutlineItemUi(child, {closed: true}, false);
        if (recursive) {
          this.collapseAll(child, true);
        }
      }
    }
    /*this.save();*/
  }

  getTopItems(parentsOnly: boolean): OutlineItem[] {
    let items: OutlineItem[] = [...getChildren(this.getData())];
    for (let itemId in this.pinned) {
      items.push(this.pinned[Number(itemId)]);
    }
    if (parentsOnly) {
      items = items.filter(item => isParent(item));
    }
    return items;
  }

  // In future, will take id + sparse item
  updateOutlineItemUi(
    item: OutlineItem,
    newValues: OutlineItemUi,
    save: boolean = true,
  ) {
    item.ui = item.ui || {};
    for (const fieldStr in newValues) {
      const field = fieldStr as keyof OutlineItemUi;
      // @ts-ignore
      item.ui[field] = newValues[field];
    }
    if (save) {
      this.save();
    }
    this._outlineItemChange(item);
  }

  sortChildren(item: OutlineItem) {
    if (isParent(item)) {
      getChildren(item).sort(outlineSort);
      // Update UI?
    }
  }

  initialProcess(rawItem: Partial<OutlineItem>, parent: Opt<OutlineItem>) {
    const item = outlineItem({...rawItem, parent}, false);

    // @ts-ignore
    item.sub = getChildren(rawItem).map(child =>
      this.initialProcess(child, item),
    );

    this.itemMap[item.id] = item;
    if (item.pinned) {
      this.pinned[item.id] = item;
    }
    return item;
  }

  getData() {
    return this.data;
  }

  getFocusItem() {
    return this.focusItem || this.data;
  }

  deleteItem(item: OutlineItem, save: boolean = true, toSelect?: OutlineItem) {
    if (!item.parent || !item.parent.sub) {
      return;
    }
    var parent = item.parent;
    var subs = getChildren(parent);
    var index = subs.indexOf(item);

    if (OutlineState.isSelected(item)) {
      const prevItem = toSelect ?? this.firstVisibleItemBefore(item);
      if (prevItem) {
        const len = prevItem.text?.length || 0;
        OutlineState.selectText(prevItem, {start: len, end: len});
      }
    }

    if (index != -1) {
      subs.splice(index, 1);
    }
    this._parentUpdated(parent, save);
  }

  firstVisibleItemBefore(item: OutlineItem) {
    if (!item.parent || !item.parent.sub) {
      return;
    }

    const parent = item.parent;
    const subs = getChildren(parent);
    var index = subs.indexOf(item);
    for (let i = index - 1; i >= 0; i--) {
      if (!getItemUi(subs[i]).hidden) {
        return subs[i];
      }
    }
    return parent;
  }

  createItemAfter(
    item: OutlineItem,
    text: string,
    save: boolean = true,
  ): Opt<OutlineItem> {
    if (!item.parent || !item.parent.sub) {
      return;
    }
    const parent = item.parent;
    const subs = item.parent.sub;
    const index = subs.indexOf(item);
    if (index != -1) {
      const newItem = outlineItem({
        state: text == '' ? 'new' : item.state,
        parent: item.parent,
        text: text,
      });
      getItemUi(newItem).hidden = this._isHidden(newItem);
      subs.splice(index + 1, 0, newItem);
      this.itemMap[newItem.id] = newItem;
      OutlineState.selectText(newItem, {start: 0, end: 0});

      if (save) {
        this.save();
      }

      this._parentUpdated(parent);
      return newItem;
    }
  }

  nest(item: OutlineItem) {
    if (!item.parent) {
      return;
    }

    const parent = item.parent;
    const subs = getChildren(parent);
    const index = subs.indexOf(item);

    var previousVisibleItemIndex = -1;
    for (var i = index - 1; i >= 0; i--) {
      if (!getItemUi(subs[i]).hidden) {
        previousVisibleItemIndex = i;
        break;
      }
    }

    const movedItem = subs.splice(index, 1)[0];
    let newParent;
    if (previousVisibleItemIndex == -1) {
      newParent = outlineItem({
        text: '-',
        state: 'cur',
        parent: item.parent,
      });
      subs.splice(0, 0, newParent);
      this.itemMap[newParent.id] = newParent;
    } else {
      newParent = subs[previousVisibleItemIndex];
    }

    if (subs.length == 0) {
      //delete item.parent.sub;
    }
    movedItem.parent = newParent;
    const newParentSubs = getChildren(newParent);
    newParentSubs.push(movedItem);

    this._parentUpdated(parent);
    this._parentUpdated(newParent);
    this.save();
  }

  unnest(item: OutlineItem) {
    if (!item.parent || !item.parent.parent) {
      return;
    }
    const parent = item.parent;
    const grandparent = item.parent.parent;

    const subs = getChildren(item.parent);
    const index = subs.indexOf(item);
    const movedItem = subs.splice(index, 1)[0];

    var grandparentSubs = getChildren(grandparent);
    var parentIndex = grandparentSubs.indexOf(parent);
    grandparentSubs.splice(parentIndex + 1, 0, movedItem);
    movedItem.parent = grandparent;
    this._parentUpdated(parent);
    this._parentUpdated(grandparent);
    this.save();
  }

  move(item: OutlineItem, newParent: OutlineItem) {
    if (!item.parent) {
      return;
    }
    // Check this is OK to move

    // Move it
    const parent = item.parent;
    const subs = getChildren(item.parent);
    const index = subs.indexOf(item);
    const movedItem = subs.splice(index, 1)[0];

    const newParentSubs = getChildren(newParent);
    newParentSubs.push(movedItem);
    movedItem.parent = newParent;
    this._parentUpdated(parent);
    this._parentUpdated(newParent);
    this._outlineItemChange(item);
    this.save();
  }

  bump(item: OutlineItem) {
    if (!item.parent || !item.parent.sub) {
      return;
    }
    item.modified = new Date();
    var parent = item.parent;
    var subs = item.parent.sub;
    var index = subs.indexOf(item);
    subs.splice(index, 1);
    subs.splice(0, 0, item);
    this.save();
    this._outlineItemChange(item);
    this._outlineItemChange(parent);
  }

  touch(item: OutlineItem) {
    item.modified = new Date();
    this.save();
    this._outlineItemChange(item);
  }

  getFlatList(item: OutlineItem) {
    var result: OutlineItem[] = [];
    this.getFlatListInternal(item, result, true);
    result.sort(outlineSort);
    return result;
  }

  getFlatListInternal(
    item: OutlineItem,
    outArray: OutlineItem[],
    pinOk: boolean = false,
  ) {
    if (isParent(item)) {
      if (pinOk || !item.pinned) {
        for (var child of getChildren(item)) {
          this.getFlatListInternal(child, outArray);
        }
      }
    } else {
      outArray.push(item);
    }
  }

  getVisibilityFilter(): OutlineItemVisibilityFilter {
    return this.getData().ui?.visibilityFilter || 'focus';
  }

  setVisibilityFilter(
    value: OutlineItemVisibilityFilter,
    noSave: boolean = false,
  ) {
    this.visibleStates = STATE_VISIBILITY[value];
    this.updateOutlineItemUi(this.getData(), {visibilityFilter: value}, false);
    this._recursiveUpdateVisibility(this.getData());
    if (!noSave) {
      this.save();
    }
  }

  getItem(itemId: Opt<number>, defaultItem: OutlineItem): OutlineItem {
    if (itemId == null) {
      return defaultItem;
    }
    return this.itemMap[itemId] || defaultItem;
  }

  setFocusItem(item: OutlineItem) {
    this.focusItem = item;
    this.outline.focus = item.id;
    // TODO: Save focus state locally
    this.save();
  }

  setView(view: OutlineViewType) {
    this.updateOutlineItemUi(this.getData(), {view: view});
  }

  _isHidden(item: OutlineItem) {
    let hidden = !this.visibleStates.includes(item.state);

    // Review only goes back 60 days
    if (this.getVisibilityFilter() == 'review' && item.state == 'soon') {
      // tag: DATELOGIC
      const modified = item.modified ? item.modified.getTime() : 0;
      const daysBack = (Date.now() - modified) / (1000 * 3600 * 24);
      hidden = daysBack > 60;
    }
    // New items show up everywhere for 5 minutes
    if (item.state == 'new') {
      // tag: DATELOGIC
      const modified = item.modified ? item.modified.getTime() : 0;
      const minutesBack = (Date.now() - modified) / (1000 * 60);
      if (minutesBack < 5) {
        hidden = false;
      }
    }
    // Waiting items always show up in waiting view
    if (item.state == 'waiting' && this.getVisibilityFilter() == 'waiting') {
      hidden = false;
    }
    // In other views are hidden until snoozeTil, and after only show
    // up where they would have surfaced based on previous state
    // (or if view shows waiting)
    if (item.state == 'waiting' && this.getVisibilityFilter() != 'waiting') {
      const snoozeTil = item.snoozeTil || new Date(0);
      const snoozed = new Date() < snoozeTil;
      const prevState = item.snoozeState || 'waiting';

      hidden =
        snoozed ||
        (!this.visibleStates.includes(prevState) &&
          !this.visibleStates.includes('waiting'));
    }

    return hidden;
  }

  _recursiveUpdateVisibility(item: OutlineItem): {
    done: boolean;
    hidden: boolean;
  } {
    if (isParent(item)) {
      let allDone = true;
      let hasVisibleKids = false;

      for (var child of getChildren(item)) {
        let childVis = this._recursiveUpdateVisibility(child);
        allDone = allDone && childVis.done;
        hasVisibleKids = hasVisibleKids || !childVis.hidden;
      }

      // Hide if all done AND done items aren't visible
      const hidden = allDone && !this.visibleStates.includes('done');
      const kidsHidden = !hasVisibleKids;
      this.updateOutlineItemUi(item, {hidden, kidsHidden}, false);
      return {done: allDone, hidden: !hasVisibleKids};
    } else {
      const hidden = this._isHidden(item);
      const done = item.state == 'done';
      //stateIndex = STATE_PRIORITY.indexOf(item.state);
      this.updateOutlineItemUi(item, {hidden}, false);
      return {done, hidden};
    }
  }
}

export function getChildren(item: OutlineItem): Array<OutlineItem> {
  item.sub = item.sub || [];
  return item.sub;
}

export function getItemUi(item: OutlineItem): OutlineItemUi {
  item.ui = item.ui || {};
  return item.ui;
}

export function isParent(item: OutlineItem) {
  return getChildren(item).length > 0;
}

export function hasVisibleKids(item: OutlineItem) {
  return getChildren(item).reduce((anyVisible, item) => {
    return anyVisible || !item.ui.hidden;
  }, false);
}

export function isChild(item: OutlineItem) {
  return getChildren(item).length == 0;
}

export function pathTo(outliner: Outliner, item: Opt<OutlineItem>): string {
  if (!item || item == outliner.getData()) {
    return '';
  }

  if (item.parent == outliner.getData()) {
    return item.text || '';
  } else {
    return pathTo(outliner, item.parent) + ' : ' + (item.text || '');
  }
}
