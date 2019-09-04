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

import {Cookies} from '../common/cookies';
import {DataId} from '../common/data-id';
import {DataService} from '../common/data-service';
import {NavController} from '../common/nav-controller';
import {Voice} from '../common/voice';
import {AddMinderRequest, MinderApi, MinderList} from '../minder-api/minder-service';
import {MINDER_VIEW_SPECS} from '../minder-api/minder-view-specs';

@Component({
  selector: 'minderbot',
  templateUrl: './minderbot.component.html',
  styleUrls: ['../common/common-styles.css', './minderbot.component.css']
})
export class MinderbotComponent implements OnInit, OnDestroy {
  navigationInitialized: boolean = false;
  private params: any;
  private handlers: any = {
    'exit': () => this.exitVoiceCommand(),
    'empty': () => this.exitVoiceCommand(),
    'goodbye': () => this.exitVoiceCommand(),
    'error': () => this.exitVoiceCommand(),
    'list': () => this.listMinders('focus'),
    'focus': () => this.listMinders('focus'),
    'in focus': () => this.listMinders('focus'),
    'review': () => this.listMinders('review'),
    'to review': () => this.listMinders('review'),
    'pile': () => this.listMinders('pile'),
    'the pile': () => this.listMinders('pile'),
    'completed': () => this.listMinders('completed'),
    'pads': () => this.listMinderPads(),
    'minder pads': () => this.listMinderPads(),
    'error:aborted': () => {}
  };

  private matchers: any = {
    '^switch to (.*)': (params: string[]) => this.switchTo(params[0]),
    '^go to (.*)': (params: string[]) => this.switchTo(params[0]),
    '^remind me to (.*)': (params: string[]) => this.remindMeTo(params[0]),
    '^what\'s (.*)': (params: string[]) => this.listMinders(params[0]),
    '^what is (.*)': (params: string[]) => this.listMinders(params[0])
  };
  private minderPadTitle!: string;
  private minderPads!: MinderList[];
  private listId!: string;
  private welcomed: boolean = false;

  private static SIGNOFF: string = 'Minder-baught out. Eggzihting.';

  constructor(
      public nav: NavController, private zone: NgZone,
      private data: DataService, private route: ActivatedRoute,
      public voice: Voice, private cookies: Cookies) {
    // Preload voices - takes a little time for Chrome to load
    window.speechSynthesis.getVoices();
  }

  ngOnDestroy() {
    this.voice.deactivate(MinderbotComponent.SIGNOFF);
  }

  ngOnInit() {
    this.voice.activate();
    this.params = this.route.params.subscribe(params => {
      this.data.req(MinderApi.GET_MINDER_LISTS, {}).then(resp => {
        this.minderPads = resp.lists;
        if (params['list']) {
          this.listId = params['list'];
          if (!this.navigationInitialized) {
            this.nav.initNav(
                '.minderbot-nav-template', 'drawer',
                '/minderbot-manifest.json');
            this.navigationInitialized = true;
          }

          for (let i = 0; i < this.minderPads.length; i++) {
            if (this.minderPads[i].id == this.listId) {
              this.minderPadTitle = this.minderPads[i].title;
            }
          }
          setTimeout(() => this.startMinderbot(), 500);
        } else {
          // Need better way to decide on a starting list
          if (this.minderPads.length > 0) {
            let listId =
                this.cookies.getCookie('lastPad') || this.minderPads[0].id;
            this.nav.navigate('/minderbot', {list: listId});
          }
        }
      });
    });
  }

  private getVoice(name: string, lang: string) {
    let voice = null;
    let voices = window.speechSynthesis.getVoices();
    for (let i = 0; i < voices.length; i++) {
      if (voices[i].name === name && voices[i].lang === lang) {
        voice = voices[i];
      }
    }
    return voice;
  }

  startMinderbot() {
    var prompt = 'You\'re using ' + this.minderPadTitle + ' pad. What next?';
    if (!this.welcomed) {
      prompt = 'Welcome to minders. ' + prompt;
      this.welcomed = true;
    }
    this.voice.speakAndRecordCommand(
        prompt, (cmd: string) => this.processCommand(cmd));
  }

  promptForNextCommand(preamble?: string) {
    var prompt = ', What next?';
    if (preamble) {
      prompt = preamble + prompt;
    }
    this.voice.speakAndRecordCommand(
        prompt, (cmd: string) => this.processCommand(cmd));
  }

  processCommand(cmd: string) {
    console.log('Processing(' + cmd + ')');
    cmd = cmd || 'empty';
    cmd = cmd.toLowerCase();

    if (this.handlers[cmd]) {
      this.handlers[cmd]();
      return;
    }

    for (let matcher in this.matchers) {
      var match = cmd.match(matcher);
      if (match) {
        this.matchers[matcher](match.slice(1));
        return;
      }
    }

    this.promptForNextCommand('Unrecognized command.');
  }

  exitVoiceCommand() {
    this.voice.speakAndThen(MinderbotComponent.SIGNOFF);
  }

  remindMeTo(what: string) {
    console.log('remindeMeTo: ("' + what + '")');
    var title = what.substring(0, 1).toUpperCase() + what.substring(1);
    var msg = 'I\'ll remind you to ' + title;

    let req = {state: '-new', title: title, list: this.listId} as
        AddMinderRequest;
    this.processRequest(MinderApi.ADD_MINDER, req, msg, NavController.NONAV);
    this.promptForNextCommand(msg);
  }

  switchTo(minderPadTitle: string) {
    console.log('switchTo: ("' + minderPadTitle + '")');

    // Remove trailing 'pad'
    if (minderPadTitle.endsWith(' pad')) {
      minderPadTitle = minderPadTitle.substring(0, minderPadTitle.length - 4);
    }

    for (let i = 0; i < this.minderPads.length; i++) {
      let minderPad = this.minderPads[i];
      if (minderPad.title.toLowerCase() == minderPadTitle) {
        this.nav.navigate('/minderbot', {list: minderPad.id});
        return;
      }
    }

    this.promptForNextCommand('Could not find ' + minderPadTitle + ' pad.');
  }

  listMinderPads() {
    let padUtterances: string[] = [];
    for (var i = 0; i < this.minderPads.length; i++) {
      padUtterances.push(this.minderPads[i].title);
    }
    if (padUtterances.length > 0) {
      padUtterances[0] = 'Listing minder pads: ' + padUtterances[0];
      padUtterances[padUtterances.length - 1] += ',, That\'s all. What next?';
    }

    this.voice.speakListWithPausesForCommands(
        padUtterances, (cmd: string) => this.processListCommand(cmd));
  }

  // Process command after a specific item in the minder list;
  processListCommand(cmd: string) {
    if (cmd == 'stop' || cmd == 'done') {
      this.promptForNextCommand();
      return;
    }
    this.processCommand(cmd);
  }

  listMinders(view: string) {
    if (view in MINDER_VIEW_SPECS) {
      var req = {list: this.listId, view: view};
      this.data.req(MinderApi.GET_MINDER_VIEW, req).then(minderView => {
        var minderList: string[] = [];

        for (let i = 0; i < minderView.minders.length; i++) {
          minderList.push(minderView.minders[i].title as string);
        }
        if (minderList.length > 0) {
          minderList[0] =
              MINDER_VIEW_SPECS[view].title + ' minders:' + minderList[0];
          minderList[minderList.length - 1] += ',, That\'s all. What next?';
        }

        this.voice.speakListWithPausesForCommands(
            minderList, (cmd: string) => this.processListCommand(cmd));
      });
      return;
    }

    this.promptForNextCommand('Could not list ' + view + ' view.');
  }

  // Same as in minder.component, needs to be moved to a (likely new, common)
  // class
  processRequest<REQ, RESP>(
      to: DataId<REQ, RESP>, req: REQ, msg: string, navTo: string,
      params?: any) {
    this.data.req(to, req)
        .then(() => this.nav.navigateWithMessage(navTo, msg, params))
        .catch(() => {
          this.data.flushCache();
          this.nav.navigateWithMessage(
              navTo, 'Request failed: ' + msg, params, true);
        });
  }

  @HostListener('window:focus', ['$event'])
  onFocus(event: any): void {
    this.voice.activate();
  }

  @HostListener('window:blur', ['$event'])
  onBlur(event: any): void {
    this.voice.deactivate(MinderbotComponent.SIGNOFF);
  }
}
