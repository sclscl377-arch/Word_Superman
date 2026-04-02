// =============================================
// sw.js - Service Worker（Network First 策略）
// 更新版本號：每次修改網頁內容時，請更新此號碼
// =============================================
const CACHE_VERSION = 'v1.2.2';
const CACHE_NAME = `spelling-game-${CACHE_VERSION}`;

// 需要快取的檔案清單
const FILES_TO_CACHE = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// ===== 安裝 =====
self.addEventListener('install', event => {
  console.log(`[SW] 安裝版本：${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ===== 啟動（清除舊快取）=====
self.addEventListener('activate', event => {
  console.log(`[SW] 啟動版本：${CACHE_VERSION}`);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log(`[SW] 刪除舊快取：${name}`);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ===== 攔截請求（Network First）=====
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // 網路成功：更新快取並回傳
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 網路失敗：從快取讀取（離線模式）
        console.log(`[SW] 離線模式，從快取讀取：${event.request.url}`);
        return caches.match(event.request);
      })
  );
});
