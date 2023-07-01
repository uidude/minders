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
import {HttpClient} from "@angular/common/http";
import {FetchCache, RequestCache} from "./caches";
import {Debugger} from "./debugger";
import {DataId} from "./data-id";

@Injectable()
export class DataService {
  constructor(private http: HttpClient,
              private cache: RequestCache,
              private fetchCache: FetchCache,
              private debug: Debugger) {
  }


  req<REQ, RESP>(to: DataId<REQ, RESP>, req: REQ): Promise<RESP> {
    this.debug.log('Making request: ', req);

    if (to.handler) {
      return to.handler(req);
    }

    if (to.getFromCache) {
      let result = to.getFromCache(req, this.cache);
      if (result) {
        return result;
      }
    } else if (to.useCache) {
      let cached = this.cache.get(to, req);
      if (cached) {
        this.debug.log('Found in cache: ', cached);
        return Promise.resolve(cached);
      }
      let inFlightPromise = this.fetchCache.get(to.endpoint, req);
      if (inFlightPromise) {
        this.debug.log('Sharing outbound RPC');
        return inFlightPromise;
      }
    }

    let promise = this.http.post<RESP>('api/' + to.endpoint, req)
        .toPromise()
        .then(networkResponse => {
          //let resp = networkResponse.json() as RESP;
          let resp = networkResponse as RESP;
          this.debug.log('Got response from network', resp);
          if (to.useCache) {
            this.cache.put(to, req, resp);
            this.fetchCache.remove(to.endpoint, req);
          }
          if (to.onSuccess) {
            to.onSuccess(req, resp, this.cache);
          }
          return resp;
        })
        .catch(this.handleError);

    this.fetchCache.put(to.endpoint, req, promise);

    return promise;

  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  flushCache() {
    this.cache.flush();
  }
}
