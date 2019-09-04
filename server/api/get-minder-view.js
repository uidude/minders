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
const logging = require('../lib/logging');

module.exports = function(req, oauthClient, callback) {
  googleapis.sheets('v4').spreadsheets.values.get({
    auth: oauthClient,
    spreadsheetId: req.list,
    range: 'Minders',
  }, function(err, resp) {
    if (err) {
      callback(err, null);
    } else {
      var viewId = req.view || 'focus';
      var view = views[viewId];

      var minderView = {
        title: view.title,
        id: viewId,
        minders: []
      }

      for (var i = 1; i < resp.values.length; i++) {
        var row = resp.values[i];
        var minder = minderUtils.rowToMinder(row);
        if (view.filter(minder)) {
          minderView.minders.push(minder);
        }
      }
      defaultSort(minderView.minders);
      callback(null, minderView);
    }
  });
}


var defaultSort = function(minders) {
  minders.sort(function(lhs, rhs) {

    var result =
        compare(lhs, rhs, 'priority', true) ||
        compare(lhs, rhs, 'closed', false, 'Date') ||
        compare(lhs, rhs, 'lastModified', false, 'Date') ||
        compare(lhs, rhs, 'created', false, 'Date');

    return result;
  });
};

var compare =
    function(lhs, rhs, field, asc, opt_type) {
  var lhv = lhs[field];
  var rhv = rhs[field];

  if (opt_type == 'Date') {
    lhv = new Date(lhv || '1/1/1970');
    rhv = new Date(rhv || '1/1/1970');
  }
  if (lhv > rhv) {
    return asc ? 1: -1;
  }
  if (rhv > lhv) {
    return asc ? -1: 1;
  }
  return 0;
}

var views = {
  'focus': {
    filter: function(minder) {
      return ((minder.priority == '0-urgent' || minder.priority == '1-current') && !minder.snoozed);
    },
    title: 'In Focus',
  },
  'review': {
    filter: function(minder) {
      var dormant = new Date() - new Date(minder.created);
      if (minder.snoozeUntil) {
        dormant = Math.min(dormant, new Date() - new Date(minder.snoozeUntil));
      }

      if (minder.lastModified) {
        dormant = Math.min(dormant, new Date() - new Date(minder.lastModified));
      }
      return ((minder.priority == '1-waiting' || minder.priority == '-new' ||
          (minder.priority == '2-soon' && dormant < 2592000000)) && !minder.snoozed);
    },
    title: 'To Review'
  },
  'pile': {
    filter: function(minder) {
      return (minder.priority == '2-soon' || minder.priority == '3-later');
    },
    title: 'The pile'
  },
  'done': {
    filter: function(minder) {
      return (minder.priority == 'obsolete' || minder.priority == 'closed');
    },
    title: 'Completed'
  },
  'done-today': {
    filter: function(minder) {
      return (
          (minder.priority == 'closed') &&
          minderUtils.dateAsString(new Date(minder.closed)) ==
              minderUtils.todayAsString());
    },
    title: 'Completed today'
  },
  'waiting': {
    filter: function(minder) {
      return minder.priority == '1-waiting';
    },
    title: 'Waiting'
  }
}
