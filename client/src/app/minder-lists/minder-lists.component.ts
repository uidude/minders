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
import {Component, OnInit, ViewChild} from '@angular/core';

import {DataService} from '../common/data-service';
import {NavController} from '../common/nav-controller';
import {HelpButtonComponent} from '../help/help-button.component';
import {GetMinderListsRequest, MinderApi, MinderList} from '../minder-api/minder-service';


@Component({
  selector: 'app-minder-lists',
  templateUrl: './minder-lists.component.html',
  styleUrls: [
    './minder-lists.component.css',
    '../common/common-styles.css'
  ]
})
export class MinderListsComponent implements OnInit {
  @ViewChild(HelpButtonComponent,{static:true}) helpButton!: HelpButtonComponent;

  minderLists!: MinderList[];
  addDialog!: any;
  title: string = 'My Minders';
  showArchived: boolean = false;

  constructor(public nav: NavController, private data: DataService) {}

  ngOnInit(): void {
    this.nav.initNav('.lists-nav-template', 'drawer');
    this.addDialog = $('#new-list-dialog').get()[0];
    this.loadData();
  }

  loadData(): void {
    let req = {includeArchived: this.showArchived} as GetMinderListsRequest;

    this.data.req(MinderApi.GET_MINDER_LISTS, req).then(minderLists => {
      this.minderLists = minderLists.lists;
      if (this.minderLists.length == 0) {
        this.helpButton.toggleHelp();
      }
    });
  }

  goToList(listId: string): void {
    this.nav.navigate('/view', {list: listId, view: 'focus'})
  }

  closeAndResetForm(): void {
    this.addDialog.close();
    this.title = 'My Minders 2';
  }

  openDialog() {
    this.addDialog.showModal();
    $('#title').focus();
    $('.mdl-textfield').addClass('is-dirty');
  }

  addPad(title: string): void {
    this.closeAndResetForm();
    this.data.req(MinderApi.CREATE_MINDER_LIST, {title: title}).then(response => {
      this.nav.snack('Created pad "' + response.title + '"');
      this.nav.navigate('/view', {list: response.id, view: 'review'});
    });
  }

  toggleShowArchived() {
    this.nav.closeAllMenus();
    this.showArchived = !this.showArchived;
    let switchEl = $('#archived').get(0).parentElement as any;
    if (this.showArchived) {
      switchEl['MaterialSwitch'].on();
    } else {
      switchEl['MaterialSwitch'].off();
    }
    this.loadData();
  }
}
