/**
 * @format
 */

// Client-side state for outliner

import {Opt} from '@toolkit/core/util/Types';
import {type OutlineItem} from './outliner';

// Listeners
// Goal is to have unique string key per listener
// Structure (for now) is listen to Type, ID -> function (ID)
// Listener ref is type + ID +
export type ListenerKey = {
  type: string;
  id: string;
};

export type ListenerRef = {
  key: ListenerKey;
  ref: number;
};

export type Listener = () => void;

let nextRef = 1;

// Type+ID -> key -> listener
const listeners: Record<string, Record<number, Listener>> = {};

export function listen(fn: Listener, key: ListenerKey): ListenerRef {
  const mapKey = key.type + ':' + key.id;
  if (!listeners[mapKey]) {
    listeners[mapKey] = {};
  }
  const listenersByKey = listeners[mapKey];
  const ref = nextRef++;
  listenersByKey[ref] = fn;
  return {key, ref};
}

export function unlisten(ref: ListenerRef) {
  const key = ref.key;
  const mapKey = key.type + ':' + key.id;
  const listenersByKey = listeners[mapKey];
  if (!listenersByKey[ref.ref]) {
    console.error('Unlistening to invalid ref', ref);
  }
  delete listenersByKey[ref.ref];
}

// TODO: Better name
export function fire(key: ListenerKey) {
  const mapKey = key.type + ':' + key.id;
  const listenersByKey = listeners[mapKey];
  for (const ref in listenersByKey) {
    listenersByKey[Number(ref)]();
  }
}

export const FocusStateKey: ListenerKey = {type: 'FocusState', id: ''};

export function itemKey(itemId: number): ListenerKey {
  return {type: 'OutlineItem', id: String(itemId)};
}

// Selections

export type Selection = {start: number; end: number};

// Currently use global selection state, would be good to localize
let selectedOutlineItem: Opt<number>;
let selection: Selection = {start: 0, end: 0};

export function setSelection(item: OutlineItem, sel?: Selection) {
  const itemChanged = selectedOutlineItem != item.id;
  selectedOutlineItem = item.id;
  selection = sel || {start: 0, end: item?.text?.length || 0};
  // TODO: Figure out how to fire on external selection changes...
  if (itemChanged) {
    fire(itemKey(item.id));
  }
}

export function clearSelection() {
  const oldItem = selectedOutlineItem;
  selectedOutlineItem = null;
  if (oldItem) {
    fire(itemKey(oldItem));
  }
}

export function isSelected(item: OutlineItem): boolean {
  return item.id == selectedOutlineItem;
}

export function getSelection(): Selection {
  return selection;
}
