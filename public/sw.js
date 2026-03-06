/**
 * EcoScan AI UGB — Service Worker
 * Handles push notifications for eco-points alerts
 */

const CACHE_NAME = 'ecoscan-ai-v1';
const ICON_URL = '/icon-192.png';

// Install event
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Push notification received
self.addEventListener('push', (event) => {
    let data = {
        title: 'EcoScan AI UGB',
        body: '¡Tienes una nueva notificación!',
        icon: ICON_URL,
        badge: ICON_URL,
        tag: 'ecoscan-notification',
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data = { ...data, ...payload };
        } catch {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || ICON_URL,
        badge: data.badge || ICON_URL,
        tag: data.tag || 'ecoscan-notification',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/dashboard',
            dateOfArrival: Date.now(),
        },
        actions: [
            { action: 'open', title: '📊 Ver Dashboard' },
            { action: 'dismiss', title: 'Cerrar' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/dashboard';

    if (event.action === 'dismiss') return;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // Focus existing window or open new one
            for (const client of clients) {
                if (client.url.includes(self.location.origin)) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});
