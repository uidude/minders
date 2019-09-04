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

module.exports = function(req, oauthClient, callback) {
  googleapis.drive('v3').files.list({
    auth: oauthClient,
    pageSize: 20,
    q: 'trashed = false',
    fields: 'files(properties,appProperties,id,name)'
  }, function (err, resp) {
    var lists = null;
    if (resp) {
      var err = null;
      lists = [];
      if (resp.files.length == 0) {
        callback(err, {lists: []});
        return;
      }
      var countdownLatch = resp.files.length;
      for (var i = 0; i < resp.files.length; i++) {
        var file = resp.files[i];

        (function (spreadsheetId, title) {
          googleapis.sheets('v4').spreadsheets.values.get({
            auth: oauthClient,
            spreadsheetId: spreadsheetId,
            range: 'Properties',
          }, function(propertiesErr, propertiesResp) {
            // 400 is "not found" => no properties
            if (propertiesErr && propertiesErr.code != 400) {
              err = err || propertiesErr;
            }
            countdownLatch--;
            var minderList = {id: spreadsheetId, title: title};
            if (propertiesResp != null) {
              for (var row = 0; row < propertiesResp.values.length; row++) {
                var key = propertiesResp.values[row][0];
                var value = propertiesResp.values[row][1];
                if (key == 'archived') {
                  minderList.archived = (value == 'TRUE')
                }
              }
            }

            lists.push(minderList);
            if (countdownLatch == 0) {
              if (!req.includeArchived) {
                lists = lists.filter((list) => {
                  return list.archived != true;
                });
              }
              callback(err, {lists: lists})
            }
          });
        }) (file.id, file.name);
      }
    }
  });
}
