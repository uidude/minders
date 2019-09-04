/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//import "rxjs/add/operator/toPromise";
import {RequestCache} from "../common/caches";
import {DataId} from "../common/data-id";

import {defaultMinderSort, MINDER_VIEW_SPECS} from "./minder-view-specs";

export class Minder {
  id!: string;
  priority?: string;
  title?: string;
  priorityText?: string;
  rowNum?: number;
  created?: string;
  snoozeUntil?: string;
  lastModified?: string;
  snoozed?: boolean;
}

export class MinderView {
  id!: string;
  title!: string;
  minders!: Minder[];
}

export class MinderList {
  id!: string;
  title!: string;
  archived?: boolean;
}

export class GetMinderViewRequest {
  list!: string;
  view?: string;
}

export class GetMinderViewResponse extends MinderView {
}

export class GetMinderViewsRequest {
  list!: string;
}

export class GetMinderViewsResponse {
  views!: MinderView[];
}

export class GetMinderRequest {
  list!: string;
  id!: string;
}

export class GetMinderResponse extends Minder {

}

export class AddMinderRequest {
  list!: string;
  title!: string;
  state!: string;
}

export class AddMinderResponse extends Minder {
}

export class UpdateMinderRequest {
  list!: string;
  minder!: Minder;
}

export class UpdateMinderResponse {
  minder!: Minder;
}

export class DeleteMinderRequest {
  list!: string;
  minder!: Minder;
}

export class DeleteMinderResponse {}

export class CreateMinderListRequest {
  title!: string;
}

export class CreateMinderListResponse extends MinderList {

}

export class DoneCountRequest {
  list!: string;
}

export class DoneCountResponse {
  count!: number;
}

export class GetMinderListsRequest { includeArchived?: boolean; }

export class GetMinderListsResponse {
  lists!: MinderList[];
}


export const MinderApi =
    {
      UPDATE_MINDER: new DataId<UpdateMinderRequest, UpdateMinderResponse>({
        endpoint: 'updateMinder',
        useCache: false,
        onSuccess: function(
            req: UpdateMinderRequest, resp: UpdateMinderResponse,
            cache: RequestCache) {
          updateDoneCount(req.list, req.minder, cache);
          cacheUpdatedMinder(req.list, resp.minder, cache);
        }
      }),

      DELETE_MINDER: new DataId<DeleteMinderRequest, DeleteMinderResponse>({
        endpoint: 'deleteMinder',
        useCache: false,
        onSuccess: function(
            req: DeleteMinderRequest, resp: DeleteMinderResponse,
            cache: RequestCache) {
          cache.flush();
        }
      }),

      ADD_MINDER: new DataId<AddMinderRequest, AddMinderResponse>({
        endpoint: 'addMinder',
        useCache: false,
        onSuccess: function(
            req: AddMinderRequest, resp: AddMinderResponse,
            cache: RequestCache) {
          updateDoneCount(req.list, resp, cache);
          cacheUpdatedMinder(req.list, resp, cache);
        }
      }),

      DONE_COUNT: new DataId<DoneCountRequest, DoneCountResponse>(
          {endpoint: 'getDoneCount', useCache: true}),

      GET_MINDER_LISTS:
          new DataId<GetMinderListsRequest, GetMinderListsResponse>(
              {endpoint: 'getMinderLists', useCache: true}),

      GET_MINDER_VIEW: new DataId<GetMinderViewRequest, GetMinderViewResponse>({
        endpoint: 'getMinderView',
        useCache: false,
        getFromCache: function(req: GetMinderViewRequest, cache: RequestCache):
                          Promise<GetMinderViewResponse>|
            null {
              let minderView = getMinderViewFromCache(req, cache);
              if (minderView) {
                return Promise.resolve(minderView);
              }
              return null;
            },
        onSuccess: function(
            req: GetMinderViewRequest, resp: GetMinderViewResponse,
            cache: RequestCache) {
          cacheMinderView(req, resp, cache);
        }
      }),

      GET_MINDER: new DataId<GetMinderRequest, GetMinderResponse>(
          {endpoint: 'getMinder', useCache: true}),

      CREATE_MINDER_LIST:
          new DataId<CreateMinderListRequest, CreateMinderListResponse>({
            endpoint: 'createMinderList',
            useCache: false,
            onSuccess: function(
                req: CreateMinderListRequest, resp: CreateMinderListResponse,
                cache: RequestCache) {
              cache.flush();
            }
          }),

      GET_MINDER_VIEWS:
          new DataId<GetMinderViewsRequest, GetMinderViewsResponse>({
            endpoint: 'getMinderViews',
            handler: function(req: GetMinderViewsRequest) {
              return Promise.resolve(
                  {views: SPARSE_MINDER_VIEWS} as GetMinderViewsResponse);
            }
          })
    }

function updateDoneCount(listId: string, minder: Minder, cache: RequestCache) {
  if (minder.priority == 'closed') {
    let cacheKey: DoneCountRequest = {list: listId};
    let doneCount = cache.get(MinderApi.DONE_COUNT, cacheKey);
    if (doneCount) {
      doneCount.count = doneCount.count + 1;
    } else {
      doneCount = {count: 1};
    }
    cache.put(MinderApi.DONE_COUNT, cacheKey, doneCount);
  }
}

function cacheUpdatedMinder(
    listId: string, minder: Minder, cache: RequestCache) {
  let startTime = new Date();
  let viewId: string;
  let snoozeUntil: Date =
      minder.snoozeUntil ? new Date(minder.snoozeUntil) : new Date();
  minder.snoozed = snoozeUntil > new Date();
  for (let viewId in MINDER_VIEW_SPECS) {
    let cacheKey = {list: listId, view: viewId} as GetMinderViewRequest;
    let viewSpec: any;
    viewSpec = MINDER_VIEW_SPECS[viewId];
    let cachedView = getMinderViewFromCache(cacheKey, cache);

    if (cachedView) {
      // Not worth holding on to large views
      if (cachedView.minders.length > 200) {
        cache.remove(MinderApi.GET_MINDER_VIEW, cacheKey);
        break;
      }

      let shouldBeInView = viewSpec.filter(minder);
      let inView = false;
      for (let i = 0; i < cachedView.minders.length; i++) {
        if (cachedView.minders[i].id == minder.id) {
          inView = true;
          if (shouldBeInView) {
            cachedView.minders[i] = minder;
          } else {
            cachedView.minders.splice(i, 1);
          }
          break;
        }
      }

      if (!inView && shouldBeInView) {
        cachedView.minders.push(minder);
      }

      if (inView || (inView != shouldBeInView)) {
        defaultMinderSort(cachedView.minders);
        cacheMinderView(cacheKey, cachedView, cache);
      }
    }
  }
}


function getMinderViewFromCache(req: GetMinderViewRequest, cache: RequestCache):
    GetMinderViewResponse|null {
      let cached = cache.get(MinderApi.GET_MINDER_VIEW, req);
      if (cached) {
        // Quick and lame way to clone
        let minderView: MinderView = JSON.parse(JSON.stringify(cached));
        for (let i = 0; i < minderView.minders.length; i++) {
          let minder = cache.get(
              MinderApi.GET_MINDER,
              {list: req.list, id: minderView.minders[i].id});
          minderView.minders[i] = minder as Minder;  // TODO:Change to clone
        }
        return minderView;
      }
      return null;
    }

function cacheMinderView(
    req: GetMinderViewRequest, resp: GetMinderViewResponse,
    cache: RequestCache) {
  let sparseMinderView: MinderView = {
    id: resp.id,
    title: resp.title,
    minders: new Array<Minder>()
  };

  for (let i = 0; i < resp.minders.length; i++) {
    let minder = resp.minders[i];
    let sparseMinder: Minder = {id: minder.id};
    sparseMinderView.minders.push(sparseMinder);
    cache.put(MinderApi.GET_MINDER, {list: req.list, id: minder.id}, minder);
  }
  cache.put(MinderApi.GET_MINDER_VIEW, req, sparseMinderView);
}

export const STATE_LABELS: any = {
  '-new': 'New',
  '0-urgent': 'Starred',
  '1-current': 'In focus',
  '1-waiting': 'Waiting',
  '2-soon': 'Soon',
  '3-later': 'Later',
  'to read': 'To read',
  'closed': 'Closed',
  'obsolete': 'Obsolete',
  'snooze': 'Snooze',
  'bump': 'Bump to top of list'
};

const SPARSE_MINDER_VIEWS: MinderView[] = [
  {id: 'focus', title: 'In focus', minders: []},
  {id: 'review', title: 'To review', minders: []},
  {id: 'waiting', title: 'Waiting', minders: []},
  {id: 'pile', title: 'The pile', minders: []},
  {id: 'done', title: 'Completed', minders: []}
];
