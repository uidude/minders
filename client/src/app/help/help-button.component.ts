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
import {Component, HostListener} from '@angular/core';

@Component({
  selector: 'help-button',
  templateUrl: './help-button.html',
  styleUrls: ['../common/common-styles.css']
})

export class HelpButtonComponent {
  toggleHelp() {
    if ($('#turn-help-on').is(':visible')) {
      $('#turn-help-on').hide();
      $('#turn-help-off').show();
      $('#help').show();
    } else {
      $('#turn-help-on').show();
      $('#turn-help-off').hide();
      $('#help').hide();
    }
  }

  isOpen(): boolean {
    return (!($('#turn-help-on').is(':visible')));
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

    if (event.key == '?') {
      this.toggleHelp();
    }
  }
}
