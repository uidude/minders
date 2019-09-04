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

const express = require('express');
const config = require('./config');
const util = require('util');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


// Use a custom strategy so we can set the login hint based on the sesiion
function MyStrategy(options, verify){
  GoogleStrategy.call(this, options, verify);
}
util.inherits(MyStrategy, GoogleStrategy);


MyStrategy.prototype.authenticate = function(req, options) {
  var optionsCopy = {};
  for (var key in options) {
    optionsCopy[key] = options[key];
  }
  if (req.session.passport && req.session.passport.user) {
    optionsCopy.loginHint = req.session.passport.user.id;
  }
  return GoogleStrategy.prototype.authenticate.call(this, req, optionsCopy);
}

// Extract profile, including issue time so we knoww when to reauth
function extractProfile (accessToken, profile) {
    let imageUrl = '';
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value;
    }
    return {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        image: imageUrl,
        token: accessToken,
        issueTime: new Date().toUTCString()

    };
}


passport.use(new MyStrategy({
        clientID: config.get('OAUTH2_CLIENT_ID'),
        clientSecret: config.get('OAUTH2_CLIENT_SECRET'),
        callbackURL: config.get('OAUTH2_CALLBACK'),
        accessType: 'offline',
        proxy: true
    }, (accessToken, refreshToken, profile, cb) => {
        cb(null, extractProfile(accessToken, profile));
}));

passport.serializeUser((user, cb) => {
    cb(null, user);
});
passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

const router = express.Router();

// Interceptor to redirect to login page if a) not logged in or b) not allowed to use app
function authRequired (req, res, next) {
    var allow = true;
    var user = req.user;

    if (!user || !isAllowedUser(user) || !isValidSession(user)) {
        req.session.oauth2return = req.originalUrl;
        return res.redirect('/auth/login');
    }
    next();
}

function isAllowedUser(user) {
  var whitelist = config.get('USER_ID_WHITELIST');

  if (!user || !whitelist) {
    return false;
  }

  return user.id in whitelist;
}

var SESSION_REVALIDATION_INTERVAL = 1000 * 60 * 5; // 5 minutes

function isValidSession(user) {
  if (!user.issueTime) {
    return true;
  }
  var elapsed = new Date() - Date.parse(user.issueTime);
  if (elapsed > SESSION_REVALIDATION_INTERVAL) {
    return false;
  }
  return true;

}

// Begins the authorization flow. The user will be redirected to Google where
// they can authorize the application to have access to their basic profile
// information. Upon approval the user is redirected to `/auth/google/callback`.
// If the `return` query parameter is specified when sending a user to this URL
// then they will be redirected to that URL when the flow is finished.
router.get(
    // Login url
    '/auth/login',

    // Save the url of the user's current page so the app can redirect back to
    // it after authorization
    (req, res, next) => {
        if (req.query.return) {
            req.session.oauth2return = req.query.return;
        }
        next();
    },
    passport.authenticate('google', {
      scope: ['https://www.googleapis.com/auth/drive.file', 'email', 'profile'],
      callbackURL: '/auth/google/callback',
      // Also interesting:
      // https://www.googleapis.com/auth/drive.install can be used to bless files to open with the app
      // https://www.googleapis.com/auth/spreadsheets requires a sensitive auth credential
    })
);

router.get(
    // OAuth 2 callback url. Use this url to configure your OAuth client in the
    // Google Developers console
    '/auth/google/callback',

    // Finish OAuth 2 flow using Passport.js
    passport.authenticate('google'),

    // Redirect back to the original page, if any
    (req, res) => {
        const redirect = req.session.oauth2return || '/';
        delete req.session.oauth2return;
        res.redirect(redirect);
    }
);

// Deletes the user's credentials and profile from the session.
// This does not revoke any active tokens.
router.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect('/welcome');
});

module.exports = {
    extractProfile: extractProfile,
    router: router,
    required: authRequired,
};
