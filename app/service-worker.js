var CACHE_NAME = 'demo-dependencies-cache';
var REQUIRED_FILES = [
    'index.html',
    'index.js',
    '/node_modules/angular-material/angular-material.css',
    '/styles/app.css',
    '/node_modules/angular/angular.js',
    '/node_modules/angular-aria/angular-aria.js',
    '/node_modules/angular-animate/angular-animate.js',
    '/node_modules/angular-material/angular-material.js',
    '/scripts/app/todoController.js',
    '/scripts/app/config.js',
    '/scripts/components/todoList/todoListDirective.js',
    '/scripts/components/todoList/todoListView.html'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
          console.log('[install] Caches opened, adding all core components' +
          'to cache');
        return cache.addAll(REQUIRED_FILES);
      })
      .then(function() {
        console.log('[install] All required resources have been cached, ' +
          'we\'re good!');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
          if (response) {
          console.log(
            '[fetch] Returning from ServiceWorker cache: ',
            event.request.url
          );
          return response;
        }
          console.log('[fetch] Returning from server: ', event.request.url);
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
    console.log('[activate] Activating ServiceWorker!');
    console.log('[activate] Claiming this ServiceWorker!');
    event.waitUntil(self.clients.claim());
});
