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
var onlineMode = true;
var db = null;

function serialize(request) {
  var headers = {};
  for (var entry of request.headers.entries()) {
    headers[entry[0]] = entry[1];
  }
  var serialized = {
    url: request.url,
    headers: headers,
    method: request.method,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return request.clone().text().then(function(body) {
      serialized.body = body;
      return Promise.resolve(serialized);
    });
  }
  return Promise.resolve(serialized);
}

function deserialize(data) {
  return Promise.resolve(new Request(data.url, data));
}

function addToDb(request){
    var tx = db.transaction("queue", "readwrite");
    var store = tx.objectStore("queue");
    var index = store.index("by_name");

    var response = index.get("request_queue");
    response.onsuccess = function(){
        if(response.result !== undefined){
            var queue = response.result.queue || [];
            queue.push(request);
            store.put(response.result);
        }
    }
}

function flushDb(){
    var tx = db.transaction("queue", "readwrite");
    var store = tx.objectStore("queue");

    store.put({name: "request_queue", queue: []});
}

function sendInOrder(requests) {
    var sending = requests.reduce(function(prevPromise, serialized) {
    console.log('Sending', serialized.method, serialized.url);
    return prevPromise.then(function() {
      return deserialize(serialized).then(function(request) {
        return fetch(request);
      });
    });
  }, Promise.resolve());
  return sending;
}

function flushQueue() {
    var tx = db.transaction("queue", "readwrite");
    var store = tx.objectStore("queue");
    var index = store.index("by_name");

    var response = index.get("request_queue");
    response.onsuccess = function(){
        if(response.result !== undefined){
            var queue = response.result.queue || [];
            if(queue.length){
                sendInOrder(queue).then(function() {
                    flushDb();
                });
            }
        }
    }

    /*return localforage.getItem('queue').then(function(queue) {
    queue = queue || [];
        if (!queue.length) {
      return Promise.resolve();
    }
    console.log('Sending ', queue.length, ' requests...');
    return sendInOrder(queue).then(function() {
        return localforage.setItem('queue', []);
    });
  });*/
}

function enqueue(request) {
  return serialize(request).then(function(serialized) {
     addToDb(serialized);
    /*localforage.getItem('queue').then(function(queue) {
      queue = queue || [];
      queue.push(serialized);
      return localforage.setItem('queue', queue).then(function() {
        console.log(serialized.method, serialized.url, 'enqueued!');
      });
    });*/
  });
}

function synchronizeContent(){
    console.log('synchronizing offline content');
    flushQueue();
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
            onlineMode = true;
            synchronizeContent();
        }
    }).catch(function(err){
        onlineMode = false;
    });
}

function initDatabase(){
    var request = indexedDB.open("demo");

        request.onupgradeneeded = function() {
          // The database did not previously exist, so create object stores and indexes.
          db = request.result;
          var store = db.createObjectStore("queue", {keyPath: "name"});
          var index = store.createIndex("by_name", "name", {unique: true});
        };

        request.onsuccess = function() {
          db = request.result;
          var store = db.createObjectStore("queue", {keyPath: "name"});
          var index = store.createIndex("by_name", "name", {unique: true});
        };
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
        initDatabase();

        return self.skipWaiting();
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(cache) {
          if(RESPONSE_TO_CACHE.indexOf(event.request.url) > -1){
              if(onlineMode){
                  return fetch(event.request).then(function(response){
                    return caches.open(CACHE_NAME).then(function(store) {
                        store.put(event.request.url, response.clone());
                        console.log('[fetch] Cache json result for url: ' + event.request.url);
                        return response;
                   })}).catch(function(err){
                         onlineMode = false;
                         return cache || fetch(event.request);
              });
              } else {
                  return cache || fetch(event.request);
              }
          } else if (cache) {
              console.log('[fetch] Returning from ServiceWorker cache: ', event.request.url);
              return cache;
          } else if(REQUEST_TO_CACHE.indexOf(event.request.url) > -1){
              if(onlineMode){
                  return fetch(event.request);
              } else {
                  return enqueue(event.request).then(function(){
                      return new Response({status: 200}).clone();
                  })
              }
          }  else {
              console.log('[fetch] Returning from server: ', event.request.url);
              return fetch(event.request);
          }
      }
    )
  );
});

self.addEventListener('activate', function(event) {
    console.log('[activate] Activating ServiceWorker!');
    console.log('[activate] Claiming this ServiceWorker!');
    event.waitUntil(self.clients.claim());
});


