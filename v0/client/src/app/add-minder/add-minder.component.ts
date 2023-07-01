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
import {Component, HostListener, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {DataService} from '../common/data-service';
import {Mutator} from '../common/mutator';
import {Nav, NavController} from '../common/nav-controller';
import {AddMinderRequest, MinderApi, STATE_LABELS} from '../minder-api/minder-service';

@Component({
  selector: 'app-add-minder',
  templateUrl: './add-minder.component.html',
  styleUrls: [
    './add-minder.component.css',
    '../common/common-styles.css'
  ]
})

export class AddMinderComponent implements OnInit, OnDestroy {
  private queryParams: any;
  public title: string = '';


  menuStates: String[] = [
    '3-later',
    '1-waiting',
    'obsolete',
    'closed',
  ];

  buttonStates: String[] = [
    '-new',
    '2-soon',
    '1-current',
    '0-urgent',
  ];

  stateLabels = STATE_LABELS;

  constructor(
      private route: ActivatedRoute, public nav: NavController,
      private data: DataService, private zone: NgZone,
      private mutator: Mutator) {
    this.queryParams = this.route.queryParams.subscribe(params => {
      if (params['prefill']) {
        this.title = params['prefill'];
      }
    });
  }

  ngOnInit(): void {
    this.nav.initNav('.add-nav-template', 'up');
    $('#title').focus();
  }

  ngOnDestroy(): void {
    this.queryParams.unsubscribe();
  }

  setStateAndSubmit(state: string): void {
    this.nav.closeAllMenus();
    if (!this.title) {
      return;
    }
    let req = {state: state, title: this.title, list: this.nav.listId} as AddMinderRequest;
    var msg = 'Created "' + this.title + '" with state ' + STATE_LABELS[state];
    this.mutator.do(MinderApi.ADD_MINDER, req, {msg: msg, path: Nav.BACK});
  }

  setTitle(value: string) {
    this.title = this.capitalize(value);
    $('.mdl-textfield').addClass('is-dirty');
    $('#title').focus();
  }

  private capitalize(value: string) {
    if (value == '') {
      return '';
    }
    return value.charAt(0).toUpperCase() + value.substring(1).toLowerCase()
  }

  listenForTitle() {
    let win:any = window;
    if (win['webkitSpeechRecognition']) {
      let recognition: any = new win['webkitSpeechRecognition']();
      recognition.start();
      recognition.onresult = (event:any) => {
        let val = event.results[0][0].transcript;
        this.zone.run(() => this.setTitle(val));
      };
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    var hasModifiers = event.metaKey || event.altKey;
    if (event.code == 'Escape' && !hasModifiers) {
      $('#title').blur();
      event.preventDefault();
    }
  }
}
