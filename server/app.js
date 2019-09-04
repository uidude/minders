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

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const cookieSession = require('cookie-session');
const googleapis = require('googleapis');
const oauth2 = require('./oauth2');
const forward = require('http-forward');
const nconf = require('nconf');
const app = express();
const api = require('./api/api');
const MinderService = require('./api/minder-service');
const logging = require('./lib/logging');
const fs = require('fs');

var isProd = nconf.get('NODE_ENV') == 'production';
var AUTH_PATHS = [
  '/', '/lists(\;*)?', '/view(\;*)?', '/minder(\;*)?', '/add(\;*)?',
  '/splash(\;*)?', '/minderbot(\;*)?', '/assets/auth-refresh.html'
];
var ANGULAR_PATHS = [
  '/', '/lists(\;*)?', '/view(\;*)?', '/minder(\;*)?', '/add(\;*)?',
  '/splash(\;*)?', '/welcome(\;*)?', '/minderbot(\;*)?'
];
var STATIC_DEV_PATHS = ANGULAR_PATHS.slice(0);
STATIC_DEV_PATHS.push(
    '/assets/*', '/*.bundle.js', '/favicon.ico', '/manifest.json',
    '/minderbot-manifest.json', '/sw.js', '/npm/*', '/bundle*', '/project/src/*');

// Redirect to HTTPS in prod and set HSTS header
app.use('*', function(req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000;includeSubDomains');
  var protocol = req.get('x-forwarded-proto') || req.protocol;
  var redirect = isProd && req.hostname.endsWith('.appspot.com')
      && (protocol != 'https');
  if (redirect) {
    res.redirect('https://' + req.get('host'));
  } else {
    next();
  }
});

var versionPath = path.join(__dirname, 'version.txt');
var version = 'unversioned';
fs.readFile(versionPath, 'ascii', function(err, versionFromFile) {
  if (versionFromFile) {
    version = versionFromFile.trim();
    version = version.substring(version.length - 11);
  }
});

// Patch service worker to version, as content caching is tied to sw version
app.use('/sw.js', function(req, res, next) {
  var originalWriteHead = res.writeHead;
  var originalStatusCode;

  var originalWrite = res.write;
  res.write = function(chunk) {
    var versioned = chunk.toString('utf8').replace('\$\$VERSION\$\$', version);
    var chunk = Buffer.from(versioned, 'utf8');
    res.setHeader('Content-Length', chunk.length);
    originalWrite.call(this, chunk);
  };
  next();
});

app.get('/_ah/health', function(req, res) {
  res.status(404);
  res.send('Not found');
});

// Set up cookie-based sessions so we don't need local storage
app.use(cookieParser());
app.use(cookieSession({
  name: 'Cooked',
  keys: ['189735h173efuqerhq078'],
  maxAge: 1000 * 60 * 60 * 1000 * 24 * 14 // 2 weeks
}));

// Set up passport for session handling
app.use(passport.initialize());
app.use(passport.session());

// Set up logging
app.use(logging.requestLogger);

// Route OAuth2 URLs
app.use(oauth2.router);

// Auth is required on HTML pages - need top level page to handle redirect
app.get(AUTH_PATHS, oauth2.required);

/*
app.use('/protocol', function(req, res, next) {
  var protocol = req.get('x-forwarded-proto') || req.protocol;
  var redirect = isProd && req.hostname.endsWith('.appspot.com')
      && (req.protocol != 'https');

  res.type('text/plain');
  var txt = '';
  for (var name in req) {
    console.log(name);
    if (typeof req[name] != 'function' && name != '_events'
        && name != 'socket' && name != 'connection' && name != 'client'
        && name != 'res' && name !='sessionCookies') {
      txt += name + ': ' + JSON.stringify(req[name], null, '  ') + '\n';
    }
  }
  txt += 'Protocol: ' + protocol + '\n';
  txt += 'Redirect: ' + redirect + '\n';

  res.send(txt, null, '  ');
});
*/

// Serve static paths and angular files
// In Prod Angular is compiled, in dev requests are forwarded to the instance running localhost:4200 via ng serve
if (isProd) {
  app.get(ANGULAR_PATHS, function(req, resp, next) {
    resp.sendfile(path.join(__dirname, '../public/index.html'));
  });
  app.use(express.static(path.join(__dirname, '../public')));
} else {
  app.get(STATIC_DEV_PATHS, function(req, resp) {
    req.forward = { target: 'http://localhost:4200'}
    forward(req, resp);
  });
}

// Set up JSON body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Install the API handlers
api.installService(app, MinderService);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Standard error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(
      '<html><body>' +
      '<h1>' + err.message + '</h1>' +
      '<h2>' + err.status + '</h2>' +
      '<pre>' + err.stack.replace('\t', '<br>') + '</pre>' +
      '</body></html>'
  );
});

module.exports = app;
