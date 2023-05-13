/**
 * @format
 */

import React, {createContext} from 'react';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import Promised from '@toolkit/core/util/Promised';
import {Opt} from '@toolkit/core/util/Types';
import {useNav, useNavState} from '@toolkit/ui/screen/Nav';
import {batch, useForceUpdate} from '../util/Useful';
import OutlineStore from './OutlineStore';
import type {OutlineItem, OutlineItemVisibilityFilter} from './outliner';
import Outliner from './outliner';

export type OutlineState = {
  focus: number;
  focusItem: OutlineItem;
  filter: OutlineItemVisibilityFilter;
};

export function useOutlineState(): [
  OutlineState,
  (state: Partial<OutlineState>) => void,
] {
  const nav = useNav();
  const outliner = useOutliner();
  const params = useNavState().location.params;
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

      const newFocus = state.focus;
      const defaultFocus = outliner.getData().id;
      const focusToSet = newFocus != defaultFocus ? newFocus : undefined;
      // Needed to save focus state
      if (focus != newFocus) {
        outliner.setFocusItem(outliner.getItem(newFocus, outliner.getData()));
        nav.setParams({focus: focusToSet});
      }
    });
  }

  return [{focus, focusItem, filter}, setOutlineState];
}

// Map of userId -> OutlineStore for that user
const outlines: Record<string, OutlineStore> = {};

async function initializeOutline(userId: string): Promise<void> {
  let outline = outlines[userId];
  if (!outline) {
    outline = new OutlineStore(userId);
    outlines[userId] = outline;
    return outline.load();
  }
  return;
}

/*
How should loading a persistent data structure work?
- Asking for data gives you a promise that throws suspsense if not available
- If data has been cachced, returns the cached version
- Ideally could refresh cache but not crticial for now

What should the API look like?
- Const outliner = useOutliner(userId) or useOutliner() and automatically gets for current user
- So same thing, but with a cache by user ID?
- Ideally would have a logout / clear cache variant
*/
export class OutlinerEnvironment {
  item: Opt<OutlineItem>;

  constructor(item?: OutlineItem) {
    this.item = item;
  }

  init(userId: string): Opt<Promise<void>> {
    return initializeOutline(userId);
  }

  // Throws the promise if not loaded - this interoperates with
  // React Suspense
  getOutliner(userId: string): Outliner {
    // Does nothing when called the 2nd+ time
    this.init(userId);
    const outlineStore = outlines[userId];

    if (outlineStore.loading) {
      throw outlineStore.loadPromise;
    }
    return outlineStore.outliner;
  }

  getOutlinerPromise(userId: string): Promised<void> {
    // Does nothing when called the 2nd+ time
    this.init(userId);
    const outlineStore = outlines[userId];

    if (outlineStore.loading) {
      return new Promised(outlineStore.loadPromise);
    }
    return new Promised(Promise.resolve());
  }
}

export function useOutliner(): Outliner {
  const user = requireLoggedInUser();
  const outliner = React.useContext(OutlinerContext).getOutliner(user.id);
  if (outliner == null) {
    throw Error("Outliner can't be null");
  }
  return outliner;
}

// Wrapped in case it becomes more complicated to pull in
export function useOutlineStore(): OutlineStore {
  const user = requireLoggedInUser();
  // This triggers throwing the promise
  React.useContext(OutlinerContext).getOutliner(user.id);

  return outlines[user.id];
}

const OutlinerContext = createContext<OutlinerEnvironment>(
  new OutlinerEnvironment(),
);
export default OutlinerContext;
