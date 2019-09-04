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
interface  GetFromCache<REQ, RESP> {
  getFromCache(req: REQ, service: any): Promise<RESP>;
}

export class DataIdParams<REQ, RESP> {
  endpoint!: string;
  useCache?: boolean; // Could be an enum
  getFromCache?: Function;
  onSuccess?: Function;
  handler?: Function;
}

export class DataId<REQ, RESP> {

  constructor(params: DataIdParams<REQ, RESP>) {
    this.endpoint = params.endpoint;
    this.useCache = params.useCache;
    this.onSuccess = params.onSuccess;
    this.getFromCache = params.getFromCache;
    this.handler = params.handler;
  }

  endpoint!: string;
  useCache?: boolean; // Could be an enum
  getFromCache?: Function;
  onSuccess?: Function;
  handler?: Function;
}
