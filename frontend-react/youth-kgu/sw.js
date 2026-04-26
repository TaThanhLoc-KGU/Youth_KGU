// Service Worker cho Youth KGU - Hỗ trợ thông báo trên mobile
const CACHE_NAME = 'youth-kgu-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Nhận message từ app để hiển thị notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, url } = event.data.payload;
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body || '',
        icon: icon || '/logo.png',
        badge: '/logo.png',
        tag: tag || `youthkgu-${Date.now()}`,
        renotify: true,
        data: { url: url || '/' },
      })
    );
  }
});

// Xử lý click vào notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
