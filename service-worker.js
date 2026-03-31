// Service Worker for 班级积分管理系统
// 网络加速插件 - 基于 Service Worker 实现
const CACHE_NAME = 'class-score-system-v1';
const ACCELERATION_CACHE_NAME = 'class-score-acceleration-cache-v1';
const ASSETS_TO_CACHE = [
  '积分.html',
  'style.css',
  'script.js'
];

// 加速配置
const accelerationConfig = {
  // 启用状态，默认启用
  enabled: true,
  // 需要加速的域名
  加速域名: [
    'github.com',
    'github.io',
    'api.github.com',
    'gitee.com',
    'gitee.io',
    'api.gitee.com'
  ],
  // 缓存策略
  cacheStrategy: {
    // 静态资源缓存时间（秒）
    staticCacheTime: 86400, // 24小时
    // 动态资源缓存时间（秒）
    dynamicCacheTime: 3600 // 1小时
  }
};

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
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
    }).then(() => self.clients.claim())
  );
});

// 检查是否需要加速
function shouldAccelerate(request) {
  if (!accelerationConfig.enabled) return false;
  const url = new URL(request.url);
  return accelerationConfig.加速域名.some(domain => url.hostname.includes(domain));
}

// 获取缓存过期时间
function getCacheExpiry(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.js', '.css', '.html', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
  const isStatic = staticExtensions.some(ext => url.pathname.endsWith(ext));
  return isStatic ? accelerationConfig.cacheStrategy.staticCacheTime : accelerationConfig.cacheStrategy.dynamicCacheTime;
}

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      try {
        // 检查是否需要加速
        if (shouldAccelerate(event.request)) {
          // 先检查加速缓存
          const cachedResponse = await caches.match(event.request, { cacheName: ACCELERATION_CACHE_NAME });
          if (cachedResponse) {
            // 检查缓存是否过期
            const cacheControl = cachedResponse.headers.get('cache-control');
            if (cacheControl) {
              const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
              if (maxAgeMatch) {
                const maxAge = parseInt(maxAgeMatch[1]);
                const dateHeader = cachedResponse.headers.get('date');
                if (dateHeader) {
                  const cacheTime = new Date(dateHeader).getTime();
                  const now = Date.now();
                  const age = (now - cacheTime) / 1000;
                  if (age < maxAge) {
                    return cachedResponse;
                  }
                }
              }
            }
          }
          
          // 发起网络请求，添加优化
          try {
            const response = await fetch(event.request, {
              // 添加请求优化
              cache: 'no-store',
              credentials: 'include',
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
              }
            });
            
            // 缓存响应
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              const cache = await caches.open(ACCELERATION_CACHE_NAME);
              // 添加缓存控制头
              const headers = new Headers(responseToCache.headers);
              const expiry = getCacheExpiry(event.request);
              headers.set('cache-control', `max-age=${expiry}`);
              headers.set('date', new Date().toUTCString());
              
              // 创建新的响应
              const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
              });
              
              await cache.put(event.request, cachedResponse);
            }
            
            return response;
          } catch (error) {
            // 网络请求失败时，尝试返回缓存
            if (cachedResponse) {
              return cachedResponse;
            }
            // 如果没有缓存，返回一个错误响应
            return new Response('Network error occurred', {
              status: 408,
              statusText: 'Request Timeout'
            });
          }
        } else {
          // 普通请求，使用原有缓存策略
          try {
            const response = await caches.match(event.request);
            if (response) {
              return response;
            }
            const networkResponse = await fetch(event.request);
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              const cache = await caches.open(CACHE_NAME);
              await cache.put(event.request, responseToCache);
            }
            return networkResponse;
          } catch (error) {
            // 处理普通请求的错误
            return new Response('Network error occurred', {
              status: 408,
              statusText: 'Request Timeout'
            });
          }
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

// 处理更新消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    const { files } = event.data;
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          files.map((file) => {
            return fetch(file, { cache: 'no-cache' })
              .then((response) => {
                if (response.ok) {
                  return cache.put(file, response);
                }
              });
          })
        );
      })
      .then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_UPDATED' });
          });
        });
      });
  }
  // 处理网络加速插件控制
  if (event.data && event.data.type === 'ACCELERATION_CONTROL') {
    const { enabled } = event.data;
    accelerationConfig.enabled = enabled;
    // 通知客户端设置已更新
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ 
          type: 'ACCELERATION_STATUS_UPDATED',
          enabled: accelerationConfig.enabled 
        });
      });
    });
  }
  // 处理清除加速缓存
  if (event.data && event.data.type === 'CLEAR_ACCELERATION_CACHE') {
    caches.delete(ACCELERATION_CACHE_NAME)
      .then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'ACCELERATION_CACHE_CLEARED' });
          });
        });
      });
  }
});