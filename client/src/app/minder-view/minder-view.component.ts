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
import {ChangeDetectorRef, Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ComponentLifecycle} from '../common/component-lifecycle';
import {DataService} from '../common/data-service';
import {NavController} from '../common/nav-controller';
import {MinderApi, MinderList, MinderView} from '../minder-api/minder-service';

@Component({
  selector: 'app-minder-list',
  templateUrl: './minder-view.component.html',
  styleUrls: ['./minder-view.component.css', '../common/common-styles.css']
})
export class MinderViewComponent implements OnInit, ComponentLifecycle {
  icons = {
    '0-urgent': 'star_border',
    '-new': 'fiber_new',
    '1-waiting': 'hourglass_empty'
  };

  minderView!: MinderView;
  views!: MinderView[];
  minderLists!: MinderList[];
  listId!: string;
  viewId!: string;
  minderList!: MinderList;
  doneCount!: number;
  loading: boolean = true;
  private params!: any;

  constructor(
      public nav: NavController, private route: ActivatedRoute,
      private data: DataService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.params = this.route.params.subscribe(params => {
      this.listId = params['list'];
      this.viewId = params['view'] || 'focus';

      if (this.listId) {
        this.loadData();
      } else {
        this.nav.navigate('/lists');
      }
    });
  }

  ngOnDestroy(): void {
    this.params.unsubscribe();
  }

  reload(): void {
    this.data.flushCache();
    $('#topbar').focus();
    this.loadMinders();
  }

  private navInitialized: boolean = false;

  loadData(): void {
    this.loading = true;
    setTimeout(() => {
      // Only detach if still loading
      if (this.loading) {
        this.cd.detach()
      }
    }, 0);

    let promises = new Array<Promise<any>>();

    promises.push(this.data
                      .req(
                          MinderApi.GET_MINDER_VIEW,
                          {list: this.listId, view: this.viewId})
                      .then(minderView => this.minderView = minderView));

    promises.push(this.data.req(MinderApi.GET_MINDER_VIEWS, {list: this.listId})
                      .then(minderViews => this.views = minderViews.views));

    promises.push(this.data.req(MinderApi.GET_MINDER_LISTS, {}).then(resp => {
      let minderLists = resp.lists as MinderList[];
      for (let i = 0; i < minderLists.length; i++) {
        if (minderLists[i].id == this.listId) {
          this.minderList = minderLists[i];
        }
      }
      this.minderLists = minderLists;
    }));

    promises.push(this.data.req(MinderApi.DONE_COUNT, {list: this.listId})
                      .then(resp => this.doneCount = resp.count));

    Promise.all(promises).then(() => {
      this.loading = false;
      this.cd.reattach();

      setTimeout(() => {
        if (!this.navInitialized) {
          this.nav.initNav('.list-nav-template', 'drawer');
          this.navInitialized = true;
        }

        if (this.nav.scrollTo) {
          let scrollTo = this.nav.scrollTo;
          window.scrollTo(0, scrollTo);
          this.nav.scrollTo = 0;
        }
        this.upgradeDom();
      }, 1);
    });
  }

  loadMinders(): void {
    this.data.req(MinderApi.GET_MINDER_VIEW, {list: this.listId, view: this.viewId}).then(minderView => {
      this.minderView = minderView;
      if (!this.navInitialized) {
        this.nav.initNav('.list-nav-template', 'drawer');
        this.navInitialized = true;
      }
    });

    this.data.req(MinderApi.GET_MINDER_LISTS, {}).then(resp => {
      let minderLists: MinderList[] = resp.lists;
      for (let i = 0; i < minderLists.length; i++) {
        if (minderLists[i].id == this.listId) {
          this.minderList = minderLists[i];
          if (this.nav.scrollTo) {
            let scrollTo = this.nav.scrollTo;
            setTimeout(() => window.scrollTo(0, scrollTo), 0);
            this.nav.scrollTo = 0;
          }
        }
      }
      setTimeout(() => this.upgradeDom(), 1500);
    });

    this.data.req(MinderApi.DONE_COUNT, {list: this.listId})
        .then(resp => this.doneCount = resp.count);
  }

  upgradeDom() {
    // After navigation, upgrade all of the material UI
    let windowProperties: any = window;
    if (windowProperties['componentHandler']) {
      windowProperties['componentHandler']['upgradeDom']();
    }
  }

  switchToView(viewId: string) {
    this.nav.navigate('/view', {view: viewId});
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    var hasModifiers = event.metaKey || event.altKey || event.shiftKey;
    if (event.code == 'ArrowRight' && !hasModifiers) {
      this.nav.navigate('/minder', {id: this.minderView.minders[0].id});
    }
  }
}
