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
import {Injectable} from '@angular/core';

@Injectable()
export class Cookies {
  constructor() {}

  setCookie(key: string, value: string, msUntilExpires: number) {
    let expires = new Date(new Date().getTime() + msUntilExpires);
    let cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) +
        ';' +
        'expires=' + expires.toUTCString() + ';';

    document.cookie = cookie;
  }

  getCookie(key: string): string|undefined {
    let parts = document.cookie.split(/; ?/);
    for (let i = 0; i < parts.length; i++) {
      let keyValue = parts[i].split('=');
      if (keyValue[0] == key) {
        return keyValue[1];
      }
    }
    return;
  }
}
