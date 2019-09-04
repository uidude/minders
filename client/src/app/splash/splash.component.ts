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
import {Component, OnInit} from "@angular/core";

import {Cookies} from '../common/cookies';
import {DataService} from "../common/data-service";
import {NavController} from '../common/nav-controller';
import {MinderApi} from '../minder-api/minder-service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.css']
})
export class SplashComponent implements OnInit {
  constructor(
      private nav: NavController, private data: DataService,
      private cookies: Cookies) {}

  ngOnInit() {
    $(".mdl-layout__content").get()[0].style.marginTop = '0px';
    $(".mdl-layout__header").get()[0].style.display = 'none';

    // Preload - matches logic below. Would be better if it used real view logic
    this.data.req(MinderApi.GET_MINDER_LISTS, {}).then(resp => {
      if (resp.lists.length > 0) {
        var list: string = resp.lists[0].id;
        this.data.req(MinderApi.GET_MINDER_VIEW, {list: list, view: 'focus'});
        this.data.req(MinderApi.DONE_COUNT, {list: list});
      }
    });

    setTimeout(() => {
      // This will use same request if in flight, or cache if it has returned
      this.data.req(MinderApi.GET_MINDER_LISTS, {}).then(resp => {
        $('.mdl-layout__content').get()[0].style.marginTop = '';
        $('.mdl-layout__header').get()[0].style.display = '';
        if (resp.lists.length > 0) {
          let listId = this.cookies.getCookie('lastPad') || resp.lists[0].id;
          this.nav.navigate('/view', {list: listId, view: 'focus'});
        } else {
          this.nav.navigate('/welcome');
        }
      });
    }, 2000);
  }
}
