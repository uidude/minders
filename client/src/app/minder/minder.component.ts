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
import {ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {DataId} from '../common/data-id';
import {DataService} from '../common/data-service';
import {Mutator} from '../common/mutator';
import {Nav, NavController} from '../common/nav-controller';
import {DeleteMinderRequest, Minder, MinderApi, MinderView, STATE_LABELS, UpdateMinderRequest} from '../minder-api/minder-service';

@Component({
  selector: 'app-minder',
  templateUrl: './minder.component.html',
  styleUrls: [
    './minder.component.css',
    '../common/common-styles.css'
  ]
})
export class MinderComponent implements OnInit, OnDestroy {
  id!: string;
  minder!: Minder;
  minderView!: MinderView;
  minderIndex!: number;
  nextMinderId!: string;
  prevMinderId!: string;
  private curDialog!: any;

  menuStates: String[] = [
    '0-urgent',
    '1-current',
    '2-soon',
    '3-later',
    'obsolete',
    'closed',
  ];

  buttonStates: String[] = [
    '2-soon',
    '1-current',
    '0-urgent',
    'closed',
  ];

  stateLabels = STATE_LABELS;

  snoozeDialogDays = [
    {title: '1 day', days: 1},
    {title: '9 days', days: 9},
    {title: '5 days', days: 5},
    {title: '17 days', days: 17},
  ];

  waitDialogDays = [
    {title: '0 days', days: 0},
    {title: '3 days', days: 3},
    {title: '14 days', days: 14},
    {title: '1 day', days: 1},
    {title: '7 days', days: 7},
    {title: '28 days', days: 28},
  ];

  iconMap = {
    '1-waiting': 'waiting',
    'obsolete': 'obsolete',
    'closed': 'done',
    '1-current': 'current',
    '2-soon': 'soon',
    '-new': 'new'
  };

  isTitleEditable = false;
  private params: any;

  constructor(
      private route: ActivatedRoute, public nav: NavController,
      private data: DataService, private cd: ChangeDetectorRef,
      private mutator: Mutator) {
    this.params = this.route.params.subscribe(params => {
      delete this.minderIndex;
      this.id = params['id'];
      let listId = params['list'] as string;
      let viewId = params['view'] as string;

      // Chaining these requests shouldn't slow things down in the normal case -
      // when navigating from a minder view this will load the cached version.
      // However when the view isn't already loaded (on reload, for example),
      // this will ensure the page loads properly, as there isn't an API yet
      // to get a single minder.
      this.data.req(MinderApi.GET_MINDER_VIEW, {list: listId, view: viewId})
          .then(minderView => {
            this.minderView = minderView;
            this.data.req(MinderApi.GET_MINDER, {list: nav.listId, id: this.id})
                .then(minder => this.minder = minder);
          });
    });
  }

  ngOnInit(): void {
    this.nav.initNav('.minder-nav-template', 'up');
  }

  ngOnDestroy(): void {
    this.params.unsubscribe();
  }

  showWaitingDialog(): void {
    this.curDialog = $('#wait-dialog').get()[0];
    this.curDialog.showModal();
  }

  showSnoozeDialog(): void {
    this.curDialog = $('#snooze-dialog').get()[0];
    this.curDialog.showModal();
  }

  snoozeAndSubmit(days: number): void {
    this.minder.snoozeUntil = this.daysFromNowAsString(days);
    let req = {list: this.nav.listId, minder: this.minder} as UpdateMinderRequest;
    let msg = 'Snoozing "' + this.minder.title + '" for ' + days +
        ' days and submitting';

    this.updateAndNav(MinderApi.UPDATE_MINDER, req, msg);
  }

  waitAndSubmit(days: number): void {
    let minderForEdits = this.minder;
    // Make a copy so UI doesn't immediately change
    this.minder = {...minderForEdits} as Minder;
    minderForEdits.priority = '1-waiting';
    minderForEdits.snoozeUntil = this.daysFromNowAsString(days);
    let req = {list: this.nav.listId, minder: minderForEdits} as
        UpdateMinderRequest;
    let msg = 'Waiting on "' + minderForEdits.title + '" for ' + days +
        ' days and submitting';

    this.updateAndNav(MinderApi.UPDATE_MINDER, req, msg);
  }

  private daysFromNowAsString(days: number): string {
    let date: Date = new Date(Number(new Date()) + 86400 * 1000 * days);
    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + (date.getFullYear() - 2000);
  }

  deleteMinder(): void {
    this.nav.closeAllMenus();
    let req = {list: this.nav.listId, minder: this.minder} as
        DeleteMinderRequest;
    let msg = 'Deleted "' + this.minder.title + '"';

    this.mutator.do(MinderApi.DELETE_MINDER, req, {msg: msg, path: Nav.BACK});
  }

  setStateAndSubmit(state: string): void {
    let minderForEdits = this.minder;
    // Make a copy so UI doesn't immediately change
    this.minder = {...minderForEdits} as Minder;
    let msg = 'Set "' + minderForEdits.title + '" to  ' + STATE_LABELS[state];
    minderForEdits.priority = state;
    this.updateMinder(msg, minderForEdits);
  }

  updateMinder(msg: string, minder?: Minder): void {
    minder = minder || this.minder;

    this.nav.closeAllMenus();
    minder.title = $('#todo-title').text();
    if (minder.snoozeUntil) {
      let snooze = new Date(minder.snoozeUntil);
      if (snooze.getTime() > new Date().getTime()) {
        minder.snoozeUntil = this.daysFromNowAsString(0);
      }
    }
    let req = {list: this.nav.listId, minder: minder} as UpdateMinderRequest;

    this.populateMinderIndex();
    // Navigate to next minder if we are in "To review"
    let navigateToNext =
        (this.nav.viewId == 'review' &&
         typeof this.nextMinderId != 'undefined');
    var path, params, extras;
    var nav: Nav;

    if (navigateToNext) {
      nav = {
        msg: msg,
        path: '/minder',
        params: {id: this.nextMinderId},
        extras: {replaceUrl: true}
      };
    } else {
      nav = { msg: msg, path: Nav.BACK }
    }
    this.updateAndNav(MinderApi.UPDATE_MINDER, req, msg);
  }

  bumpToTop() {
    this.updateMinder('Bumped "' + this.minder.title + '" to  top');
  }

  updateAndNav<REQ, RESP>(dataId: DataId<REQ, RESP>, req: REQ, msg: string) {
    if (this.curDialog) {
      this.curDialog.close();
      this.curDialog = null;
    }

    this.populateMinderIndex();
    // Navigate to next minder if we are in "To review"
    let navigateToNext = typeof this.nextMinderId != 'undefined';
    var path, params, extras;
    var nav: Nav;

    if (navigateToNext) {
      nav = {
        msg: msg,
        path: '/minder',
        params: {id: this.nextMinderId},
        extras: {replaceUrl: true}
      };
    } else {
      nav = { msg: msg, path: Nav.BACK }
    }

    this.mutator.do(dataId, req, nav);
  }

  setTitleAndSubmit(title: string): void {
    this.minder.title = title;
    let req = {list: this.nav.listId, minder: this.minder} as UpdateMinderRequest;
    var msg = 'Set new title: "' + title + '"';
    this.mutator.do(MinderApi.UPDATE_MINDER, req, {msg: msg, path: Nav.BACK});
  }

  setTitleEditable(): void {
    if (!this.isTitleEditable) {
      let oldTitle = $('#todo-title').text();
      $('#todo-title').css('border', '1px dashed #555').attr('contenteditable', 'true').css('cursor', 'text');
      $('#todo-title').on('keypress', event => {
        if (event.keyCode == 13) {
          event.preventDefault();
          let newTitle = $('#todo-title').text();
          this.setTitleNonEditable();
          this.setTitleAndSubmit(newTitle);
        }
      });
      $('#todo-title').on('keyup', event => {
        if (event.keyCode == 27) {
          $('#todo-title').text(oldTitle);
          this.setTitleNonEditable();
        }
      });
      $('#todo-title').on('DOMCharacterDataModified', event => {
        let domCharacterEvent: any = event;
        $('#title-field').val(domCharacterEvent.newValue);
      });
      this.isTitleEditable = true;
    }
  }

  setTitleNonEditable(): void {
    $('#todo-title').css('border', '').attr('contenteditable', 'false').css('cursor', 'default');
    $('#todo-title').off('input', '**');
    $('#todo-title').off('DOMCharacterDataModified', '**');
    $('#todo-title').off('keypress', '**');
    $('#todo-title').off('keyup', '**');
    $('#title-field').val('');

    this.isTitleEditable = false;
  }

  populateMinderIndex() {
    if (typeof this.minderIndex == 'undefined' && this.minderView) {
      for (let i = 0; i < this.minderView.minders.length; i++) {
        if (this.minderView.minders[i].id == this.id) {
          this.minderIndex = i;

          let nextIndex = Math.min(
              this.minderIndex + 1, this.minderView.minders.length - 1);
          this.nextMinderId = this.minderView.minders[nextIndex].id;

          let prevIndex = Math.max(this.minderIndex - 1, 0);
          this.prevMinderId = this.minderView.minders[prevIndex].id;
          break;
        }
      }
    }
  }

  targetTakesKeyPresses(event: KeyboardEvent): boolean {
    // TODO: Better logic - ideally we'd be called in bubble phase
    var target = event.target as HTMLElement;
    return (
        target &&
        (target.contentEditable == 'true' || target.nodeName == 'INPUT'));
  }

  nextMinder() {
    this.populateMinderIndex();
    if (typeof this.nextMinderId != 'undefined') {
      this.nav.navigate('/minder', {id: this.nextMinderId}, {replaceUrl: true});
    }
  }

  prevMinder() {
    this.populateMinderIndex();
    if (typeof this.prevMinderId != 'undefined') {
      this.nav.navigate('/minder', {id: this.prevMinderId}, {replaceUrl: true});
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.targetTakesKeyPresses(event)) {
      return;
    }

    var hasModifiers =
        event.metaKey || event.altKey || event.shiftKey || event.ctrlKey;

    // All edits have ctrl key modifier
    var isEdit = event.ctrlKey;

    if (event.code == 'ArrowRight' && !hasModifiers) {
      this.nextMinder();
    } else if (event.code == 'ArrowLeft' && !hasModifiers) {
      this.prevMinder();
    } else if (event.key == 'n' && isEdit) {
      this.setStateAndSubmit('0-urgent');
    } else if (event.key == 'f' && isEdit) {
      this.setStateAndSubmit('1-current');
    } else if (event.key == 's' && isEdit) {
      this.setStateAndSubmit('2-soon');
    } else if (event.key == 'c' && isEdit) {
      this.setStateAndSubmit('closed');
    } else if (event.key == 'l' && isEdit) {
      this.setStateAndSubmit('3-later');
    } else if (event.key == 'w' && isEdit) {
      this.waitAndSubmit(1);
    }
  }
}
