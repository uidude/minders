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
 *
 * @fileoverview Common flow control flow around mutations.
 *
 * Supports the following cases:
 * - Client wants to navigate on success and show toast
 * - Client wants to show error on failure, flush cache, and navigate
 *
 * Possible future enhancements:
 * - More navigation options on failure (different location, no nav)
 * - Don't show toast on success (it worked, shouldn't be surprising... right?)
 * - Different errors on response, possibly using data request error info
 */

import {Injectable} from '@angular/core';

import {DataId} from './data-id';
import {DataService} from './data-service';
import {Nav, NavController} from './nav-controller';

@Injectable()
export class Mutator {
  constructor(private nav: NavController, private data: DataService) {}

  do
    <REQ, RESP>(dataId: DataId<REQ, RESP>, req: REQ, navTo: Nav) {
      let curNavState = this.nav.navState;
      this.nav.setSpinnerVisible(true);
      this.data.req(dataId, req)
          .then(() => {
            this.nav.setSpinnerVisible(false);
            this.nav.to(navTo, curNavState);
          })
          .catch(() => {
            this.data.flushCache();

            // TODO: Probably should clone here
            navTo.isError = true;
            navTo.msg =
                navTo.msg ? 'Request failed: ' + navTo.msg : 'Request failed';
            this.nav.setSpinnerVisible(false);
            this.nav.to(navTo, curNavState);
          });
    }
}
