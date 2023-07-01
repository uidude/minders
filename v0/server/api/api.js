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
const config = require('../config');
const logging = require('../lib/logging');

function installService(app, service) {
  for (var endpoint in service) {
    register(app, endpoint, service[endpoint]);
  }
}

function register(app, endpoint, handler) {
  // TODO: XSRF

  var api = this;
  var debug = true; // TODO: Get from inbound request
  app.use('/api/' + endpoint, function(req, resp) {
    //console.log('API call to ' + endpoint, req.body);
    var oauthClient = getOauthClient(req);


    logging.info('API request', {
      endpoint: endpoint
    });
    handler(req.body, oauthClient, function(err, apiResponse) {
      if (err) {
        console.log(err);
        resp.status(500).send(err);
      } else {
        //console.log(apiResponse);
        resp.json(apiResponse);
      }
    });
  });
}

function getOauthClient(req) {
  var oauthClient = new googleapis.auth.OAuth2(
      config.get('OAUTH2_CLIENT_ID'),
      config.get('OAUTH2_CLIENT_SECRET'),
      'notaurl'
  );

  oauthClient.setCredentials({
    access_token: req.session.passport.user.token,
  });

  return oauthClient;
}

module.exports = {
  register: register,
  installService: installService,
  getOauthClient : getOauthClient
};
