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
import {Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';

import {RequestCache} from './common/caches';
import {NavController} from './common/nav-controller';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', 'common/common-styles.css'],
})
export class AppComponent {
  constructor(public nav: NavController) {
    this.nav = nav;
  }

  onActivate(component: any) {
    this.nav.component = component;
  }

  targetTakesKeyPresses(event: KeyboardEvent): boolean {
    // TODO: Better logic - ideally we'd be called in bubble phase
    var target = event.target as HTMLElement;
    return (
        target &&
        (target.contentEditable == 'true' || target.nodeName == 'INPUT'));
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.targetTakesKeyPresses(event)) {
      return;
    }

    var hasModifiers = event.metaKey || event.altKey;
    if (event.key == '+' && !hasModifiers) {
      this.nav.navigate('/add');
      event.preventDefault();
    } else if (this.nav.listId && event.key == 'u' && !hasModifiers) {
      this.nav.navigateUp();
    } else if (this.nav.listId && event.key == 'f' && !hasModifiers) {
      this.nav.navigate('/view', {view: 'focus'});
    } else if (this.nav.listId && event.key == 'r' && !hasModifiers) {
      this.nav.navigate('/view', {view: 'review'});
    } else if (this.nav.listId && event.key == 'p' && !hasModifiers) {
      this.nav.navigate('/view', {view: 'pile'});
    } else if (this.nav.listId && event.key == 'd' && !hasModifiers) {
      this.nav.navigate('/view', {view: 'done'});
    } else if (this.nav.listId && event.key == 'w' && !hasModifiers) {
      this.nav.navigate('/view', {view: 'waiting'});
    }
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyupEvent(event: KeyboardEvent) {
    if (this.targetTakesKeyPresses(event)) {
      return;
    }

    var hasModifiers = event.metaKey || event.altKey;
    if (this.nav.listId && event.code == 'Escape' && !hasModifiers) {
      this.nav.navigateUp();
    }
  }

  clickUp($event: any) {
    $event.stopPropagation();
    this.nav.navigateUp();
  }
}
