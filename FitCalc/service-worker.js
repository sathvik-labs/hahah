const CACHE_NAME = "fitcalc-app-shell-v1";
const APP_SHELL = [
    "./", "./index.html", "./main.css", "./script.js", "./constants.js", "./store.js",
    "./target.js", "./profile.js", "./nutrition.js", "./food-api.js", "./planner.js",
    "./workout.js", "./exercise-api.js", "./progress.js", "./history.js",
    "./dashboard.js", "./adaptive.js", "./assets/icon.png", "./build/icon.iconset/icon_128x128.png", "./build/icon.iconset/icon_512x512.png",
    "./profile/index.html", "./nutrition/index.html", "./planner/index.html", "./history/index.html",
    "./bmi/index.html", "./bmr/index.html", "./bodyfat/index.html", "./calories/index.html",
    "./idealweight/index.html", "./macro/index.html", "./maxhr/index.html", "./protein/index.html",
    "./resttimer/index.html", "./sleep/index.html", "./water/index.html",
    "./steptocalories/index.html", "./exercisecalories/index.html"
];

self.addEventListener("install", function (event) {
    event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll(APP_SHELL).then(function () { return self.skipWaiting(); });
    }));
});

self.addEventListener("activate", function (event) {
    event.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (key) { return key.startsWith("fitcalc-app-shell-") && key !== CACHE_NAME; }).map(function (key) { return caches.delete(key); }));
    }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
    const request = event.request;
    if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
    if (request.mode === "navigate") {
        event.respondWith(fetch(request).then(function (response) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
            return response;
        }).catch(function () {
            return caches.match(request).then(function (cached) { return cached || caches.match("./index.html"); });
        }));
        return;
    }
    event.respondWith(caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
            if (response.ok) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
            }
            return response;
        });
    }));
});
