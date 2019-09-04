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
const minderUtils = require('./minder-utils');

module.exports = function(req, oauthClient, callback) {
  // Set close date
  if (req.minder.priority == 'closed' || req.minder.priority == 'obsolete') {
    req.minder.closed = minderUtils.nowTimeAsString();
  }
  req.minder.lastModified = minderUtils.nowTimeAsString();

  googleapis.sheets('v4').spreadsheets.values.get({
    spreadsheetId: req.list,
    range: 'Minders!G:H',
    auth: oauthClient
  }, function(err, minderListResp) {
    if (err) {
      callback(err, null);
    } else {
      var row;
      for (var i = 1; i < minderListResp.values.length; i++) {
        if (minderListResp.values[i][0] == req.minder.id) {
          row = minderListResp.values[i][1];
        }
      }
      if (row) {
        googleapis.sheets('v4').spreadsheets.values.update(
            {
              spreadsheetId: req.list,
              valueInputOption: 'USER_ENTERED',
              range: 'Minders!A' + row + ':I' + row,
              resource: {
                values: [minderUtils.minderToRow(req.minder)],
              },
              auth: oauthClient
            },
            function(err, resp) {
              callback(err, err == null ? {minder: req.minder} : null);
            });
      } else {
        callback('Couldn\'t find minder to update', null);
      }
    }
  });
};
