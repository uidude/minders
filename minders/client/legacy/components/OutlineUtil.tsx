/**
 * @format
 */

import {useEffect} from 'react';
import {Opt} from '@toolkit/core/util/Types';
import * as OutlineState from '../model/OutlineState';
import {useOutliner} from './OutlinerContext';
import {useForceUpdate} from './Useful';

function useRedrawOnItemUpdate(itemId: number | Array<Opt<number>>) {
  const forceUpdate = useForceUpdate();
  useOnItemUpdate(itemId, forceUpdate);
}

function useOnItemUpdate(itemId: number | Array<Opt<number>>, fn: () => void) {
  const ids = itemId ? (typeof itemId == 'number' ? [itemId] : itemId) : [];

  useEffect(() => {
    const listenerRefs = ids.map(id =>
      //outliner.listenForOutlineItemChange(id || 0, fn)
      OutlineState.listen(fn, OutlineState.itemKey(id || 0)),
    );
    return () => {
      listenerRefs.forEach(listenerRef =>
        //outliner.unlistenForOutlineItemChange(listener)
        OutlineState.unlisten(listenerRef),
      );
    };
  });
}

export default {useForceUpdate, useRedrawOnItemUpdate};
