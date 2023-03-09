// @flow

import {type OutlineItem, outlineItem} from './outliner';
import Outliner from './outliner';
import * as OutlineState from './OutlineState';
import {Picker} from 'react-native';

function getSiblings(item: OutlineItem): OutlineItem[] {
  if (!item.parent || !item.parent.sub) {
    return [];
  }
  return item.parent.sub;
}

export async function updateItem(
  item: OutlineItem,
  values: $Shape<OutlineItem>
): Promise<OutlineItem> {
  let modified = false;
  for (const key in values) {
    if (item[key] !== values[key]) {
      item[key] = values[key];
      modified = true;
    }
  }
  return item;
}

export async function touch(item: OutlineItem): Promise<OutlineItem> {
  const newItem = await updateItem(item, {modified: new Date()});
  OutlineState.fire(OutlineState.itemKey(item.id));
  return newItem;
}

type TouchParams = {
  itemId: number,
};

type OutlineAction<Req, Resp> = {
  do: (req: Req) => Promise<Resp>,
};

export async function outlineDo<Req, Resp>(
  doer: OutlineAction<Req, Resp>,
  req: Req
): Promise<Resp> {
  // Get outline
  // Pass in outline
  const resp = await doer.do(req);
  // save outline
  return resp;
}
