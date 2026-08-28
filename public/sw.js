self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data?.text() || 'You have a new SmartChain update.' }; }
  const title = data.title || 'SmartChain';
  const tradeUrl = data.tradeUrl || data.actionUrl || data.url || '/';
  const options = {
    body: data.body || 'You have a new SmartChain update.',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'smartchain-notification',
    renotify: true,
    data: { url: data.url || '/notifications', tradeUrl },
    actions: data.tradeUrl || data.actionUrl ? [{ action: 'trade', title: data.actionTitle || 'Trade' }] : []
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = event.action === 'trade' ? (data.tradeUrl || data.url || '/') : (data.url || '/notifications');
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(new URL(target, self.location.origin).href);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(new URL(target, self.location.origin).href);
  })());
});

self.addEventListener('pushsubscriptionchange', event => {
  // The app refreshes the subscription on its next authenticated visit.
});
