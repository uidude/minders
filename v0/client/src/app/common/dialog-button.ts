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

@Directive({selector: '[dialogButton]'})
export class DialogButtonDirective implements OnInit {
  @Input('actionButton') value!: string;

  constructor(private el: ElementRef) {
  }

  ngOnInit(): void {
    this.el.nativeElement.classList.add('dialog-button', 'mdl-button', 'mdl-js-button',
        'mdl-button--raised', 'mdl-js-ripple-effect', 'mdl-button--accent');
    this.el.nativeElement.setAttribute('type', 'button');
  }
}
