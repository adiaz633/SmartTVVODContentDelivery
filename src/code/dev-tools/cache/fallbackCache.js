const ID = "FallbackServiceWorkerCache";

const regex = /osvideo\.labs\.gvp\.telefonica\.com/i;

let _cache;

/**
 * Returns the cache object and opens it if it is not already open
 * @returns {Promise<Cache>}
 */
function getCacheAsync() {
  if (!_cache) {
    return caches.open(ID).then((value) => {
      _cache = value;
      return _cache;
    });
  }
  return Promise.resolve(_cache);
}

/**
 * Caches the response in case the HTTP status is OK
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise}
 */
async function cacheResponseAsync(request, response) {
  const clonedResponse = response.clone();
  const cache = await getCacheAsync();
  cache.put(request, clonedResponse);
}

/**
 * Gets the cached response
 * @param {Request} request
 * @returns {Response|undefined}
 */
async function getCachedResponseAsync(request, response) {
  const cache = await getCacheAsync();
  return cache.match(request).then((cachedResponse) => {
    //Cache hit - return response
    let clonedResponse;
    if (cachedResponse) {
      clonedResponse = cachedResponse.clone();
    }
    return clonedResponse || response;
  });
}

/**
 * Handles icon/images from the app site
 * @param {Request} request
 * @returns {Promise}
 */
function handleRequest(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        cacheResponseAsync(request, response);
        return response;
      } else {
        console.log(ID, "handledResponse", request.url);
        return getCachedResponseAsync(request, response);
      }
    })
    .catch((error) => {
      console.error(ID, "handleRequest", error);
      return getCachedResponseAsync(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        } else {
          throw error;
        }
      });
    });
}

/**
 * Checks which filter applies of lets fetch to continue the request
 * @param {Object} event
 * @returns {Promise}
 */
function activateFilter(event) {
  const matches = regex.exec(event.request.url);

  if (matches) {
    return handleRequest(event.request);
  } else {
    return fetch(event.request);
  }
}

self.addEventListener("install", (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(ID).then((value) => {
      _cache = value;
      console.log(ID, "Opened cache");
    })
  );
});

self.addEventListener("activate", () => {
  caches.open(ID).then((value) => {
    _cache = value;
    self.skipWaiting();
    return self.clients.claim();
  });
});

self.addEventListener("fetch", (event) => {
  console.log(ID, "fetch received", event.request.url);
  event.respondWith(activateFilter(event));
});

/**
 * Used for receiving new configuration from the main application
 */
self.addEventListener("message", (event) => {
  console.log(ID, "message", event.data);
});
