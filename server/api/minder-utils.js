/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const googleapis = require('googleapis');

function getFilteredMinderList(list, oauthClient, filter, callback) {
  googleapis.sheets('v4').spreadsheets.values.get({
    auth: oauthClient,
    spreadsheetId: list,
    range: 'Minders',
  }, function(err, resp) {
    if (err) {
      callback(err, null);
    } else {
      var minders = [];
      for (var i = 1; i < resp.values.length; i++) {
        var row = resp.values[i];
        var minder = {
          priority: row[0],
          title: row[1],
          created: row[2],
          closed: row[3],
          snoozeUntil: row[4],
          snoozed: row[5] == 'Y',
          id: row[6],
        }
        if (filter(minder)) {
          minders.push(minder);
        }
      }
      callback(null, minders);
    }
  });
}

function todayAsString() {
  // Need to create a date where today in the expected timezone has the right day
  // Currently hardcoded to PDT
  return dateAsString(dayInTimezone(new Date(), -7));
}

function nowTimeAsString() {
  return dateAsString(dayInTimezone(new Date(), -8)) + ' ' +
      dayInTimezone(new Date(), -8).toLocaleTimeString('en-US', {hour12:false})
      .split(' ')[0];
}

function dateAsString(date) {
  return (date.getMonth() + 1)+ "/" + date.getDate() + "/" + (date.getFullYear() - 2000);
}

function dayInTimezone(date, gmtOffset) {
  // Convert date to the same time in GMT time
  var timeInGmt = new Date(date.getTime() + (gmtOffset  * 60 + date.getTimezoneOffset()) * 60 * 1000);
  return timeInGmt;
}

function uniqueMinderId() {
  return Math.round(Math.random() * 1000000000) + '-' + Math.round(Math.random() * 1000000000);
}

function minderToRow(minder) {
  var row = [];
  row[0] = minder.priority;
  row[1] = minder.title;
  row[2] = minder.created || '';
  row[3] = minder.closed || '';
  row[4] = minder.snoozeUntil || '';
  row[5] = null;
  row[6] = minder.id;
  row[8] = minder.lastModified;

  return row;
}

function rowToMinder(row) {
  var minder = {
    priority: row[0],
    title: row[1],
    created: row[2],
    closed: row[3],
    snoozeUntil: row[4],
    snoozed: row[5] == 'Y',
    id: row[6],
    lastModified: row[8],
  }
  return minder;
}

module.exports = {
  getFilteredMinderList: getFilteredMinderList,
  todayAsString: todayAsString,
  nowTimeAsString: nowTimeAsString,
  dateAsString: dateAsString,
  uniqueMinderId: uniqueMinderId,
  minderToRow: minderToRow,
  rowToMinder: rowToMinder
}
