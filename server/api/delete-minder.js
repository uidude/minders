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
  // Note: Currently this will delete wrong minder if a delete occurs
  // in between the read and delete
  googleapis.sheets('v4').spreadsheets.get({
    spreadsheetId: req.list,
    includeGridData: false,
    auth: oauthClient,
  }, function(err, resp) {
    var sheetId = null;

    if (err) {
      callback(err, null);
      return;
    }

    for (var i = 0; i < resp.sheets.length; i++) {
      if (resp.sheets[i].properties.title == 'Minders') {
        sheetId = resp.sheets[i].properties.sheetId;
      }
    }

    if (sheetId == null) {
      callback('no sheet found', null);
    }

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
          googleapis.sheets('v4').spreadsheets.batchUpdate({
            spreadsheetId: req.list,
            resource: {
              requests: [
                {
                  "deleteDimension": {
                    "range": {
                      "sheetId": sheetId,
                      "dimension": "ROWS",
                      "startIndex": row - 1,
                      "endIndex": row
                    }
                  }
                }
              ]
            },
            auth: oauthClient
          }, function (err, resp) {
            callback(err, err == null ? req.minder : null);
          });
        } else {
          callback('Couldn\'t find minder to update', null);
        }
      }
    });
  });
};
