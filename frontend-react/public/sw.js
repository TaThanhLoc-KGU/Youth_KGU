/**
 * Service Worker — Youth KGU Web Push
 * Nhận push notification từ backend và hiển thị thông báo hệ thống.
 * File này phải nằm ở root (/sw.js) để có scope toàn domain.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ── Nhận push event từ server ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Youth KGU', body: 'Bạn có thông báo mới', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: data.url,           // Gộp nhiều notification cùng URL thành 1
      renotify: true,
      data: { url: data.url },
      actions: [
        { action: 'open', title: 'Xem ngay' },
        { action: 'close', title: 'Đóng' },
      ],
    })
  );
});

// ── Click vào notification → mở trang tương ứng ─────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Nếu đã có tab mở → focus vào đó
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Không có tab nào → mở tab mới
      clients.openWindow(url);
    })
  );
});
