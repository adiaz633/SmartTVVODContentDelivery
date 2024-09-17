function _registerServiceWorker() {
  return navigator.serviceWorker
    .register("fallbackCache.js")
    .then((registration) => {
      return _listenServiceWorkerActivateAsync(registration);
    })
    .catch(() => {
      // registration failed
      return _listenServiceWorkerActivateAsync();
    });
}

// Listen service worker active
function _listenServiceWorkerActivateAsync(registration = null) {
  return new Promise((resolve) => {
    // Not exist registration or Service Worker is already activated
    if (!registration || isServiceWorkerActivated()) {
      resolve();
    } else {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing || registration.waiting;
        installingWorker.onstatechange = () => {
          // Service Worker is already activated
          if (isServiceWorkerActivated()) {
            // Unregister events
            installingWorker.onstatechange = null;
            registration.onupdatefound = null;
            resolve();
          }
        };
      };
    }
  });
}

// Check if service worker is activated
function isServiceWorkerActivated() {
  return navigator.serviceWorker.controller?.state === "activated";
}

if ("serviceWorker" in navigator) {
  console.warn("[log] Worker Registering");
  if (window.document.readyState === "complete") {
    _registerServiceWorker();
  } else {
    window.addEventListener("load", _registerServiceWorker);
  }
} else {
  console.warn("[log] NO Worker Registering");
  _listenServiceWorkerActivateAsync();
}
