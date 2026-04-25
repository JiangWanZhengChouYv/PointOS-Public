// Service Worker for 班级积分管理系统
const CACHE_VERSION = 'v3';
const CACHE_NAME = `class-score-system-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  'index.html',
  'style.min.css',
  'script.min.js'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // 通知所有客户端有新的Service Worker正在等待
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ 
              type: 'SW_UPDATED',
              message: '新版本已就绪，请刷新页面以使用最新版本'
            });
          });
        });
        // 立即激活新的Service Worker
        return self.skipWaiting();
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      try {
        // 普通请求，使用网络优先策略
        try {
          // 先尝试从网络获取最新版本
          const networkResponse = await fetch(event.request, {
            cache: 'no-store'
          });
          
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            // 立即更新缓存
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, responseToCache);
          }
          
          return networkResponse;
        } catch (error) {
          // 网络请求失败时，尝试返回缓存
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Network error occurred', {
            status: 408,
            statusText: 'Request Timeout'
          });
        }
      } catch (error) {
        // 处理全局错误
        return new Response('Service Worker error occurred', {
          status: 500,
          statusText: 'Internal Server Error'
        });
      }
    })()
  );
});

// 处理消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});