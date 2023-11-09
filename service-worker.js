const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v10");
    await cache.addAll(resources);
  };
  
  const putInCache = async (request, response) => {
    const cache = await caches.open("v10");
    await cache.put(request, response);
  };
  
  const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
      return responseFromCache;
    }
  
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) {
      console.info("using preload response", preloadResponse);
      putInCache(request, preloadResponse.clone());
      return preloadResponse;
    }
  
    try {
      const responseFromNetwork = await fetch(request);
      putInCache(request, responseFromNetwork.clone());
      return responseFromNetwork;
    } catch (error) {
      const fallbackResponse = await caches.match(fallbackUrl);
      if (fallbackResponse) {
        return fallbackResponse;
      }
      return new Response("Network error happened", {
        status: 408,
        headers: { "Content-Type": "text/plain" },
      });
    }
  };
  
  const enableNavigationPreload = async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
  };
  
  self.addEventListener("activate", (event) => {
    event.waitUntil(enableNavigationPreload());
  });
  
  self.addEventListener("install", (event) => {
    event.waitUntil(
      addResourcesToCache([
        "/manifest.json",
        "/index.js",
        "/index.css",
        "/index.html",
        "/favicon.png",
        "/favicon.ico",
        "/Fonts/FiraCode-Bold.ttf",
        "/Fonts/FiraCode-Medium.ttf"
        ]),
    self.skipwaiting();
    );
  });
  
  self.addEventListener("fetch", (event) => {
    event.respondWith(
      cacheFirst({
        request: event.request,
        preloadResponsePromise: event.preloadResponse,
        fallbackUrl: "/",
      }),
    );
  });
  
  const deleteCache = async (key) => {
    await caches.delete(key);
  };

  const deleteOldCaches = async () => {
    const cacheKeepList = ["v10"];
    const keyList = await caches.keys();
    const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
    await Promise.all(cachesToDelete.map(deleteCache));
  };

  self.addEventListener("activate", (event) => {
    event.waitUntil(deleteOldCaches());
  });
