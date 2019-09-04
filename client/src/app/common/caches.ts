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
import {Injectable} from "@angular/core";
import {DataId} from "./data-id";

class CacheKey {
  type!: string;
  key!: any;
}

class CacheValue {
  type!: string;
  key!: any;
  value!: any;
}

@Injectable()
export class FetchCache {
    private cache: Map<string, Promise<any>> = new Map<string, Promise<any>>();

    constructor() {
    }

    put(type: string, key: any, promise: Promise<any>): void {
        //console.log('Caching', JSON.stringify({type: type, key: key}, value));
        this.cache.set(JSON.stringify({type: type, key: key}), promise);
    }

    get(type: string, key: any): Promise<any>|undefined {
        //console.log('Getting', JSON.stringify({type: type, key: key}));
        //console.log(this.cache.get(JSON.stringify({type: type, key: key})) != null);
        return this.cache.get(JSON.stringify({type: type, key: key}));
    }

    remove(type: string, key: any) {
        this.cache.delete(JSON.stringify({type: type, key: key}));
    }

    flush(): void {
        this.cache = new Map<string, Promise<any>>();
    }
}

@Injectable()
export class RequestCache {
  private cache: Map<string, CacheValue> = new Map<string, CacheValue>();

  constructor(private fetchCache: FetchCache) {}

  put<REQ, RESP>(dataId: DataId<REQ, RESP>, req: REQ, resp: RESP) {
    this.putInternal(dataId.endpoint, req, resp);
  }

  get<REQ, RESP>(dataId: DataId<REQ, RESP>, req: REQ): RESP|undefined {
    let cacheValue = this.getInternal(dataId.endpoint, req);
    if (cacheValue) {
      return cacheValue.value as RESP
    }
    return;
  }

  // Maybe add a type
  putInternal(type: string, key: any, value: any): void {
    this.cache.set(JSON.stringify({type: type, key: key}), {type: type, key: key, value: value});
  }

  private getInternal(type: string, key: any): CacheValue|undefined {
    return this.cache.get(JSON.stringify({type: type, key: key})) as CacheValue;
  }

  flush(): void {
    this.cache = new Map<string, CacheValue>();
    this.fetchCache.flush();
  }

  remove<REQ, RESP>(dataId: DataId<REQ, RESP>, req: REQ) {
    this.cache.delete(JSON.stringify({type: dataId.endpoint, key: req}));
  }

  printDebug(): void {
    console.log(this.cache);
  }
}

