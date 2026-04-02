// Service Worker for 班级积分管理系统
// 网络加速插件 - 基于 Service Worker 实现
const CACHE_NAME = 'class-score-system';
const ACCELERATION_CACHE_NAME = 'class-score-acceleration-cache';
const ASSETS_TO_CACHE = [
  'index.html',
  'style.min.css',
  'script.min.js'
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
  ]
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



// 生成内容哈希
async function generateContentHash(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 存储资源哈希
const resourceHashes = new Map();

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
            return cachedResponse;
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
              await cache.put(event.request, responseToCache);
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
          // 普通请求，使用基于内容哈希的缓存策略
          try {
            // 先尝试从网络获取最新版本
            const networkResponse = await fetch(event.request);
            
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              // 读取响应内容
              const responseText = await networkResponse.clone().text();
              // 生成内容哈希
              const contentHash = await generateContentHash(responseText);
              
              // 检查缓存中是否已有该资源
              const cachedResponse = await caches.match(event.request);
              let shouldUpdateCache = true;
              
              if (cachedResponse) {
                // 读取缓存内容并生成哈希
                const cachedText = await cachedResponse.text();
                const cachedHash = await generateContentHash(cachedText);
                // 如果哈希相同，不需要更新缓存
                if (cachedHash === contentHash) {
                  shouldUpdateCache = false;
                }
              }
              
              // 如果需要更新缓存
              if (shouldUpdateCache) {
                const responseToCache = networkResponse.clone();
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, responseToCache);
                // 存储哈希值
                resourceHashes.set(event.request.url, contentHash);
                
                // 通知客户端缓存已更新
                self.clients.matchAll().then((clients) => {
                  clients.forEach((client) => {
                    client.postMessage({ 
                      type: 'CACHE_UPDATED',
                      url: event.request.url
                    });
                  });
                });
              }
              
              return networkResponse;
            }
            
            // 如果网络请求失败，尝试返回缓存
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              return cachedResponse;
            }
            
            return networkResponse;
          } catch (error) {
            // 处理普通请求的错误
            // 尝试返回缓存
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              return cachedResponse;
            }
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