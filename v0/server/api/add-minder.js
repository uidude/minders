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
  var newMinder = {
    priority: req.state,
    title: req.title,
    created: minderUtils.nowTimeAsString(),
    id: minderUtils.uniqueMinderId(),
    lastModified: minderUtils.nowTimeAsString(),
  }

                  googleapis.sheets('v4')
                      .spreadsheets.values.append(
                          {
                            auth: oauthClient,
                            range: 'Todo',
                            valueInputOption: 'USER_ENTERED',
                            resource: {
                              values: [minderUtils.minderToRow(newMinder)],
                            },
                            spreadsheetId: req.list,
                            range: 'Minders',
                          },
                          function(err, resp) {
                            callback(err, newMinder);
                          });
}
