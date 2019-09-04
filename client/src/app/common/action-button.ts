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
import {Directive, ElementRef, Input, OnInit} from "@angular/core";
import {STATE_LABELS} from "../minder-api/minder-service";

const ICON_CLASS_MAP: any = {
  '1-waiting': 'waiting',
  'obsolete': 'obsolete',
  'closed': 'done',
  '1-current': 'current',
  '2-soon': 'soon',
  '-new': 'new',
  'snooze': 'snooze',
  'bump': 'bump',
  '0-urgent': 'urgent',
};

@Directive({selector: '[actionButton]'})
export class ActionButtonDirective implements OnInit {
  @Input('actionButton') value: string = '';

  constructor(private el: ElementRef) {
  }

  ngOnInit(): void {
    let label:string = STATE_LABELS[this.value] as string;
    let iconClass:string = ICON_CLASS_MAP[this.value];
    this.el.nativeElement.classList.add(
        iconClass, 'action-button', 'mdl-button', 'mdl-js-button',
        'mdl-button--raised', 'mdl-js-ripple-effect');
    this.el.nativeElement.setAttribute('title', label);
    this.el.nativeElement.setAttribute('type', 'button');
  }
}
