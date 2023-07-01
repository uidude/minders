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
/** Raw JS, match get-minder-view.js on the server **/
export function defaultMinderSort(minders:any) {
  minders.sort(function (lhs:any, rhs:any) {

    let result =
        minderCompare(lhs, rhs, 'priority', true, null) ||
        minderCompare(lhs, rhs, 'closed', false, 'Date') ||
        minderCompare(lhs, rhs, 'lastModified', false, 'Date') ||
        minderCompare(lhs, rhs, 'created', false, 'Date');

    return result;
  });
};

function todayAsString() {
  // Need to create a date where today in the expected timezone has the right
  // day Currently hardcoded to PDT
  return dateAsString(dayInTimezone(new Date(), -7));
}

function dateAsString(date: Date) {
  return (date.getMonth() + 1) + '/' + date.getDate() + '/' +
      (date.getFullYear() - 2000);
}

function dayInTimezone(date: Date, gmtOffset: number) {
  // Convert date to the same time in GMT time
  var timeInGmt = new Date(
      date.getTime() + (gmtOffset * 60 + date.getTimezoneOffset()) * 60 * 1000);
  return timeInGmt;
}

function minderCompare(lhs:any, rhs:any, field:any, asc:any, opt_type:any) {
  let lhv = lhs[field];
  let rhv = rhs[field];

  if (opt_type == 'Date') {
    lhv = new Date(lhv || '1/1/1970');
    rhv = new Date(rhv || '1/1/1970');
  }
  if (lhv > rhv) {
    return asc ? 1 : -1;
  }
  if (rhv > lhv) {
    return asc ? -1 : 1;
  }
  return 0;
}

export const MINDER_VIEW_SPECS: any = {
  'focus': {
    filter: function(minder: any) {
      return ((minder.priority == '0-urgent' || minder.priority == '1-current') && !minder.snoozed);
    },
    title: 'In Focus',
  },
  'review': {
    filter: function(minder: any) {
      let dormant = new Date().getTime() - new Date(minder.created).getTime();
      if (minder.snoozeUntil) {
        dormant = Math.min(dormant, new Date().getTime() - new Date(minder.snoozeUntil).getTime());
      }

      if (minder.lastModified) {
        dormant = Math.min(dormant, new Date().getTime() - new Date(minder.lastModified).getTime());
      }
      return (
          (minder.priority == '1-waiting' || minder.priority == '-new' ||
           (minder.priority == '2-soon' && dormant < 2592000000)) &&
          !minder.snoozed);
    },
    title: 'To Review'
  },
  'pile': {
    filter: function(minder: any) {
      return (minder.priority == '2-soon' || minder.priority == '3-later');
    },
    title: 'The pile'
  },
  'done': {
    filter: function(minder: any) {
      return (minder.priority == 'obsolete' || minder.priority == 'closed');
    },
    title: 'Completed'
  },
  'done-today': {
    filter: function(minder: any) {
      return (
          (minder.priority == 'closed') &&
          dateAsString(new Date(minder.closed)) == todayAsString());
    },
    title: 'Completed today'
  },
  'waiting': {
    filter: function(minder: any) {
      return minder.priority == '1-waiting';
    },
    title: 'Waiting'
  }
}

/** End same section **/
