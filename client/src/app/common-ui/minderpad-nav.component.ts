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
import {AfterViewChecked, Component, HostListener, Input, OnInit} from '@angular/core';

import {DataService} from '../common/data-service';
import {NavController} from '../common/nav-controller';
import {MinderApi, MinderList} from '../minder-api/minder-service';

@Component({
  selector: 'minderpad-nav',
  templateUrl: './minderpad-nav.component.html',
  styleUrls: ['../common/common-styles.css']
})
export class MinderpadNavComponent implements OnInit, AfterViewChecked {
  minderLists: MinderList[] = [];
  menuId: number;
  menuInitialized: boolean = false;
  @Input('path') path: string = '';

  constructor(private data: DataService, public nav: NavController) {
    this.menuId = nextMenuId++;
  }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewChecked() {
    if (!this.menuInitialized) {
      this.initMenu();
    }
  }

  loadData(): void {
    this.data.req(MinderApi.GET_MINDER_LISTS, {}).then(resp => {
      this.minderLists = resp.lists as MinderList[];
    });
  }

  initMenu() {
    var nav = $('.minderpad-menu').get(0) as any;
    if (nav && nav['MaterialMenu']) {
      nav['MaterialMenu'].init();
      this.menuInitialized = true;
    }
  }

  switchToPad(padId: string) {
    this.nav.navigate(this.path || '/view', {list: padId, view: 'focus'});
  }

  targetTakesKeyPresses(event: KeyboardEvent): boolean {
    // TODO: Better logic - ideally we'd be called in bubble phase
    var target = event.target as HTMLElement;
    return (
        target &&
        (target.contentEditable == 'true' || target.nodeName == 'INPUT'));
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.targetTakesKeyPresses(event)) {
      return;
    }

    var hasModifiers = event.metaKey || event.altKey;

    if (event.code == 'ArrowDown' && !hasModifiers &&
        !(document.activeElement && document.activeElement.nodeName == 'LI')) {
      this.showMenuAndFocus();
      event.preventDefault();
    } else if (event.key == 'l' && !hasModifiers) {
      this.showMenuAndFocus();
      event.preventDefault();
    }
  }

  showMenuAndFocus() {
    var nav = $('.minderpad-menu').get(0) as any;
    nav['MaterialMenu'].show();
    var el = $('.minderpad-for').get(0) as any;
    el.focus();
  }
}

let nextMenuId: number = 0;
