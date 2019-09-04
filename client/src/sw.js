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

var CACHE_NAME = 'mindercache';
var VERSION = '$$VERSION$$';

var STATIC_ASSETS = [
  '/app.bundle.js', '/assets/mindericon.png', '/assets/mindericon_144.png',
  '/assets/mindericon_192.png'
];

var CONTENT_PAGE = '/welcome';
var CONTENT_CACHE_DATE_KEY = 'content-cache-date';

function fetchContentPage() {
  var request = new Request(CONTENT_PAGE);
  var fetchOptions = {redirect: 'follow', credentials: 'include'};
  return fetch(request, fetchOptions).then(function(response) {
    return Promise.resolve(response);
  });
}

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
    console.log('[ServiceWorker] Caching app shell');
    cache.addAll(STATIC_ASSETS);
    fetchContentPage().then(function(response) {
      return cache.put(CONTENT_PAGE, response);
    })
    self.skipWaiting();
  }));
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(caches.keys().then(function(keyList) {
    return Promise.all(keyList.map(function(key) {
      if (key !== CACHE_NAME) {
        console.log('[ServiceWorker] Removing old cache', key);
        return caches.delete(key);
      }
    }));
  }));
  return self.clients.claim();
});

var APP_PATHS = {
  '/': 1,
  '/lists': 1,
  '/view': 1,
  '/minderbot': 1,
  '/welcome': 1,
  '/splash': 1
};

self.addEventListener('fetch', function(e) {
  /* console.log('[Service Worker] Fetch', e.request.url); */
  var url = new URL(e.request.url);
  var matchingRequest = e.request;
  var path = url.pathname;
  if (path.indexOf(';') != -1) {
    path = path.substring(0, path.indexOf(';'));
  }

  if (path in APP_PATHS) {
    // Otherwise return from cache if available
    caches.match(CONTENT_PAGE).then(function(response) {
      return response || fetchContentPage();
    });
  } else {
    e.respondWith(caches.match(matchingRequest).then(function(response) {
      var fetchOptions = {};
      // TODO: Possibly update fetch options for
      // auth-refresh
      return response || fetch(matchingRequest, fetchOptions);
    }));
  }
});
