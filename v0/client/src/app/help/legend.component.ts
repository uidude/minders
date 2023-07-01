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
import {Component} from '@angular/core';

@Component({
  selector: 'app-legend',
  templateUrl: './legend.html',
  styleUrls: ['../common/common-styles.css', './legend.css']
})
export class LegendComponent {
  legends = [
    {
      icon: 'visibility',
      title: 'In focus',
      text: 'Minders you might actually work on now.'
    },
    {
      icon: 'visibility_off',
      title: 'Out of focus',
      text:
          'Minders you might want to work on in the near future. Show in To review as candidates to move to In focus.'
    },
    {
      icon: 'star_border',
      title: 'Starred',
      text:
          'Pinned at top of In focus. Should have no more than 3-4 Starred items.'
    },
    {
      icon: 'fiber_new',
      title: 'New',
      text:
          'Newly added Minder, haven’t decided importance, and shows up in To review. Default state when adding Minders.'
    },
    {
      icon: 'hourglass_empty',
      title: 'Waiting',
      text:
          'Ball is in someone else’s court. Hidden for N days, then back in To review'
    },
    {icon: 'done', title: 'Closed', text: 'You’re done!'},
    {icon: 'not_interested', title: 'Obsolete', text: 'No longer relevant.'},
    {
      icon: 'vertical_align_top',
      title: 'Bump to top',
      text: 'Bump Minder to the top of the list. This is the only way to order lists -' +
          ' we don\'t want you to have to rank every Minder.'
    },
    {
      icon: '',
      title: 'Later',
      text:
          'Stuff you want to keep track of but aren’t working on any time soon.'
    },
  ];

  shortcuts = [
    {title: 'App navigation'},
    {key: '+', description: 'Add new minder'},
    {key: 'l, ↓', description: 'Open minder pad menu'},

    {title: 'View navigation'},
    {key: 'f', description: 'In [F]ocus'},
    {key: 'r', description: 'To [R]eview'},
    {key: 'p', description: 'The [P]ile'},
    {key: 'd', description: '[D]one'},
    {key: 'w', description: '[W]waiting'},


    {title: 'Pad navigation'},
    {key: '←', description: 'Previous item in pad'},
    {key: '→', description: 'Next item in pad'},
    {key: 'u, Esc', description: 'Up to list'},


    {title: 'Edits'},
    {key: 'Ctrl-n', description: 'Star'},
    {key: 'Ctrl-f', description: 'In [F]ocus'},
    {key: 'Ctrl-s', description: '[S]oon'},
    {key: 'Ctrl-c', description: '[C]losed'},
    {key: 'Ctrl-l', description: '[L]ater'},
    {key: 'Ctrl-w', description: '[W]ait 1 day'},

  ];
}
