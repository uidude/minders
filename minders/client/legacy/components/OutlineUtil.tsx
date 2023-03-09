// @flow

import React, {useContext, useEffect, useState} from 'react';
import Outliner from '../model/outliner';
import type {OutlineItem} from '../model/outliner';
import OutlinerContext, {useOutliner} from './OutlinerContext';
import * as OutlineState from '../model/OutlineState';
import {useForceUpdate} from './Useful';

function useRedrawOnItemUpdate(itemId?: number | Array<?number>) {
  const forceUpdate = useForceUpdate();
  useOnItemUpdate(itemId, forceUpdate);
}

function useOnItemUpdate(itemId?: number | Array<?number>, fn: () => void) {
  const outliner = useOutliner();
  const ids = itemId ? (typeof itemId == 'number' ? [itemId] : itemId) : [];

  useEffect(() => {
    const listenerRefs = ids.map((id) =>
      //outliner.listenForOutlineItemChange(id || 0, fn)
      OutlineState.listen(fn, OutlineState.itemKey(id || 0))
    );
    return () => {
      listenerRefs.forEach((listenerRef) =>
        //outliner.unlistenForOutlineItemChange(listener)
        OutlineState.unlisten(listenerRef)
      );
    };
  });
}

export default {useForceUpdate, useRedrawOnItemUpdate};
