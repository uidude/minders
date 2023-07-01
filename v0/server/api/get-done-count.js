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

const minderUtils = require('./minder-utils');

function completedToday(minder) {
  return (
      (minder.priority == 'closed') &&
      minderUtils.dateAsString(new Date(minder.closed)) ==
          minderUtils.todayAsString())
}


module.exports = function(req, oauthClient, callback) {
  minderUtils.getFilteredMinderList(req.list, oauthClient, completedToday, function(err, resp) {
    var myResp = null;
    if (resp) {
      myResp = {count: resp.length};
    }
    callback(err, myResp);
  });
}

