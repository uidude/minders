/**
 * @format
 */

import React, {createContext} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import firebase from 'firebase/app';
import {Opt} from '@toolkit/core/util/Types';
import {FIREBASE_CONFIG} from '@app/common/Config';
import OutlineStore from '../model/OutlineStore';
import Outliner from '../model/outliner';
import type {OutlineItem, OutlineItemVisibilityFilter} from '../model/outliner';
import {batch, useForceUpdate} from './Useful';

export type OutlineState = {
  focus: number;
  focusItem: OutlineItem;
  filter: OutlineItemVisibilityFilter;
};

export function useOutlineState(): [
  OutlineState,
  (state: Partial<OutlineState>) => void,
] {
  const nav = useNavigation();
  const outliner = useOutliner();
  const route = useRoute();
  const params = route.params as Opt<OutlineState>;
  const focus = params?.focus ?? -1;
  const filter = outliner.getData().ui?.visibilityFilter || 'focus';
  // This is internal functionality - should expose officially
  const focusItem = outliner.getItem(focus, outliner.getData());
  const forceUpdate = useForceUpdate();

  function setOutlineState(state: Partial<OutlineState>) {
    batch(() => {
      if (state.filter) {
        outliner.setVisibilityFilter(state.filter);
        forceUpdate();
      }
      if (state.focus != null) {
        const newFocus = state.focus;
        const defaultFocus = outliner.getData().id;
        const focusToSet = newFocus != defaultFocus ? newFocus : undefined;
        // TODO: Is this still needed?
        outliner.setFocusItem(outliner.getItem(newFocus, outliner.getData()));
        if (focus != newFocus) {
          /* @ts-ignore */
          nav.push(route.name, {focus: focusToSet});
        }
      }
    });
  }

  return [{focus, focusItem, filter}, setOutlineState];
}

const outlineStore: OutlineStore = new OutlineStore();
let outlineInitialized: boolean = false;

function initializeOutline(): Promise<void> {
  firebase.initializeApp(FIREBASE_CONFIG);
  outlineInitialized = true;
  return outlineStore.load();
}

export class OutlinerEnvironment {
  item: Opt<OutlineItem>;

  constructor(item?: OutlineItem) {
    this.item = item;
  }

  init(): Opt<Promise<void>> {
    if (!outlineInitialized) {
      return initializeOutline();
    }
    return null;
  }

  // Throws the promise if not loaded - this interoperates with
  // React Suspend
  getOutliner(): Outliner {
    if (outlineStore.loading) {
      throw outlineStore.loadPromise;
    }
    // @ts-ignore
    window.outliner = outlineStore.outliner;
    return outlineStore.outliner;
  }
}

export function useOutliner(): Outliner {
  const outliner = React.useContext(OutlinerContext).getOutliner();
  if (outliner == null) {
    throw Error("Outliner can't be null");
  }
  return outliner;
}

// Wrapped in case it becomes more complicated to pull in
export function useOutlineStore(): OutlineStore {
  // This triggers throwing the promise
  React.useContext(OutlinerContext).getOutliner();

  return outlineStore;
}

// Hack to return same context for same items
// TODO: Find a cleaner way for this;=
const itemContextMap: {[idx: number]: OutlinerEnvironment} = {};
export function itemContext(item: OutlineItem) {
  if (!itemContextMap[item.id]) {
    itemContextMap[item.id] = new OutlinerEnvironment(item);
  }
  return itemContextMap[item.id];
}

const OutlinerContext = createContext<OutlinerEnvironment>(
  new OutlinerEnvironment(),
);
export default OutlinerContext;
