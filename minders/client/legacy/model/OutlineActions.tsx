/**
 * @format
 */

import * as OutlineState from './OutlineState';
import {type OutlineItem} from './outliner';

function getSiblings(item: OutlineItem): OutlineItem[] {
  if (!item.parent || !item.parent.sub) {
    return [];
  }
  return item.parent.sub;
}

export async function updateItem(
  item: OutlineItem,
  values: Partial<OutlineItem>,
): Promise<OutlineItem> {
  let modified = false;
  for (const keyStr in values) {
    const key = keyStr as keyof OutlineItem;
    if (item[key] !== values[key]) {
      // @ts-ignore
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

type OutlineAction<Req, Resp> = {
  do: (req: Req) => Promise<Resp>;
};

export async function outlineDo<Req, Resp>(
  doer: OutlineAction<Req, Resp>,
  req: Req,
): Promise<Resp> {
  // Get outline
  // Pass in outline
  const resp = await doer.do(req);
  // save outline
  return resp;
}
