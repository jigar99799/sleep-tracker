const CACHE_NAME = 'sleep-diary-v4';
const APP_FILES = [
    './', './index.html', './sleep-tracker.html', './manifest.webmanifest', './pwa.js',
    './assets/app.css', './assets/icons.css', './assets/chart.umd.js',
    './assets/inter-latin-wght-normal.woff2', './assets/icon-192.png', './assets/icon-512.png',
    './assets/webfonts/fa-solid-900.woff2', './assets/webfonts/fa-regular-400.woff2',
    './assets/webfonts/fa-solid-900.ttf', './assets/webfonts/fa-regular-400.ttf'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key.startsWith('sleep-diary-') && key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
    event.respondWith(caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request, { ignoreSearch: true });
        if (cached) return cached;
        try {
            return await fetch(event.request);
        } catch (error) {
            if (event.request.mode === 'navigate') return cache.match('./sleep-tracker.html');
            return Response.error();
        }
    }));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const target = new URL('./sleep-tracker.html', self.registration.scope).href;
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
        const existing = clients.find(client => new URL(client.url).origin === self.location.origin && new URL(client.url).pathname === new URL(target).pathname);
        if (existing) return existing.focus();
        return self.clients.openWindow(target);
    }));
});