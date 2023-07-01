// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const nconf = module.exports = require('nconf');
const path = require('path');

var filepath = (process.env.NODE_ENV == 'production') ?
    path.join(__dirname, 'config.json') :
    process.env.HOME + '/.minders.config.json';

console.log(filepath);
nconf
    .argv()
    .env([
      'GCLOUD_PROJECT',
      'NODE_ENV',
      'OAUTH2_CLIENT_ID',
      'OAUTH2_CLIENT_SECRET',
      'OAUTH2_CALLBACK',
    ])
    .file({file: filepath})
    .defaults({
      GCLOUD_PROJECT: '',
      OAUTH2_CLIENT_ID: '',
      OAUTH2_CLIENT_SECRET: '',
      OAUTH2_CALLBACK: '/auth/google/callback',
    });

// Check for required settings
checkConfig('GCLOUD_PROJECT');
checkConfig('OAUTH2_CLIENT_ID');
checkConfig('OAUTH2_CLIENT_SECRET');

function checkConfig(setting) {
  if (!nconf.get(setting)) {
    throw new Error(`You must set ${setting} as an environment variable or in config.json!`);
  }
}
