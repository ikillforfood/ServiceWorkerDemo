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

var RESPONSE_TO_CACHE = [
    'http://localhost:3000/tasks'
];

var REQUEST_TO_CACHE = [
    'http://localhost:3000/update',
    'http://localhost:3000/add'
];

var heartbeatUrl = 'http://localhost:3000/heartbeat';

function synchronizeContent(){
    console.log('synchronizing offline content');
}

function checkServerHeartbeat(){
    console.log('checking server hearbeat');

    var myHeaders = new Headers();

    var myInit = { method: 'POST',
                   headers: myHeaders,
                   mode: 'cors',
                   cache: 'default' };
    var myRequest = new Request(heartbeatUrl, myInit);

    fetch(myRequest, myInit).then(function(response){
        if(response.status == 200){
            synchronizeContent();
        }
    });
}

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

        setInterval(checkServerHeartbeat, 1*60*1000);

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

              if (RESPONSE_TO_CACHE.indexOf(event.request.url) > -1){
                  fetch(event.request).then(function(response){
                    return caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request.url, response.clone());
                    console.log('[fetch] Cache json result for url: ' + event.request.url);
                    return response;
                  })}).catch(function(err){
                     return response;
                  });
              }

              return response;
          } else if(RESPONSE_TO_CACHE.indexOf(event.request.url) > -1){
              fetch(event.request).then(function(response){
                    return caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request.url, response.clone());
                    console.log('[fetch] Cache json result for url: ' + event.request.url);
                    return response;
                  })}).catch(function(err){
                     response;
                  });
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


