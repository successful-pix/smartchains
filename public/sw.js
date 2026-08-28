self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() || 'You have a new SmartChain update.' }; }
  const title = data.title || 'SmartChain';
  const options = {
    body: data.body || 'You have a new SmartChain update.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'smartchain-notification',
    renotify: true,
    data: { url: data.url || '/notifications' },
    actions: data.actionUrl ? [{ action: 'trade', title: data.actionTitle || 'Trade' }] : []
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/notifications';
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if ('focus' in client) { await client.focus(); if ('navigate' in client) await client.navigate(url); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
