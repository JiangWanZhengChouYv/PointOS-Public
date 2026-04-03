// 班级积分管理系统
// 版本: 1.2.4

// 存储键名
const STORAGE_KEY = 'classScoreSystem';
const ACCELERATION_SETTINGS_KEY = 'classScoreSystem_acceleration';
const WALLPAPER_STORAGE_KEY = 'wallpaperSettings';

// 版本日志数据
const VERSION_LOGS = [
    {
        version: '1.2.3',
        date: '2026-04-02',
        changes: [
            '【版本更新】更新系统版本至1.2.3',
            '【性能优化】优化事件监听器管理，减少内存泄漏',
            '【性能优化】优化DOM操作，减少重排重绘',
            '【性能优化】优化Service Worker缓存策略，减少内存占用',
            '【性能优化】优化图片资源加载策略，实现更高效的懒加载',
            '【性能优化】压缩脚本文件，减少文件大小',
            '【Bug修复】修复弹窗打开时鼠标滚轮导致背景页面滚动的问题'
        ]
    },
    {
        version: '1.2.2',
        date: '2026-04-01',
        changes: [
            '【版本更新】更新系统版本至1.2.2',
            '【Bug修复】修复按钮点击后闪退的问题',
            '【Bug修复】解决设置按钮自动启动加速测试的问题',
            '【版本管理】移除旧版本(1.1.4)的版本说明'
        ]
    },
    {
        version: '1.2.1',
        date: '2026-04-01',
        changes: [
            '【版本更新】更新系统版本至1.2.1',
            '【界面优化】优化设置界面的弹出/关闭动画效果，实现平滑过渡',
            '【界面优化】改进所有按钮触发的窗口弹出交互，确保动画流畅无卡顿',
            '【响应式优化】保证在不同设备分辨率下均能保持一致的丝滑体验'
        ]
    },
    {
        version: '1.2.0',
        date: '2026-04-01',
        changes: [
            '【新增功能】实现版本日志查看功能，清晰展示版本更新内容',
            '【界面调整】调整功能键位置至屏幕左上角，提升操作便捷性',
            '【界面优化】优化响应式布局，适配不同屏幕尺寸',
            '【版本更新】更新系统版本至1.2.0'
        ]
    }
];

// 预设壁纸 - 使用可靠的CDN资源
const PRESET_WALLPAPERS = [
    { id: 'default', name: '默认渐变', url: '', type: 'default', category: '系统' },
    { id: 'nature1', name: '自然风光1', url: 'https://picsum.photos/id/10/1920/1080', type: 'preset', category: '自然风景' },
    { id: 'nature2', name: '自然风光2', url: 'https://picsum.photos/id/11/1920/1080', type: 'preset', category: '自然风景' },
    { id: 'nature3', name: '自然风光3', url: 'https://picsum.photos/id/12/1920/1080', type: 'preset', category: '自然风景' },
    { id: 'geometric1', name: '几何图案1', url: 'https://picsum.photos/id/20/1920/1080', type: 'preset', category: '几何图案' },
    { id: 'geometric2', name: '几何图案2', url: 'https://picsum.photos/id/21/1920/1080', type: 'preset', category: '几何图案' },
    { id: 'school1', name: '图书馆', url: 'https://picsum.photos/id/30/1920/1080', type: 'preset', category: '校园环境' },
    { id: 'school2', name: '教室', url: 'https://picsum.photos/id/31/1920/1080', type: 'preset', category: '校园环境' },
    { id: 'abstract1', name: '抽象艺术1', url: 'https://picsum.photos/id/40/1920/1080', type: 'preset', category: '抽象艺术' },
    { id: 'abstract2', name: '抽象艺术2', url: 'https://picsum.photos/id/41/1920/1080', type: 'preset', category: '抽象艺术' },
    { id: 'minimal1', name: '极简风格1', url: 'https://picsum.photos/id/50/1920/1080', type: 'preset', category: '极简风格' },
    { id: 'minimal2', name: '极简风格2', url: 'https://picsum.photos/id/51/1920/1080', type: 'preset', category: '极简风格' }
];

// 初始化壁纸设置
function initWallpaperSettings() {
    const existingSettings = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    if (!existingSettings) {
        const defaultSettings = { type: 'default', url: '', opacity: 1 };
        localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(defaultSettings));
        return defaultSettings;
    }
    return JSON.parse(existingSettings);
}

// 保存壁纸设置
function saveWallpaperSettings(settings) {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(settings));
}

// 显示版本日志
function showVersionLog() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup version-log-popup';
    
    const title = document.createElement('h3');
    title.textContent = '版本日志';
    popup.appendChild(title);
    
    // 版本日志内容
    const logContent = document.createElement('div');
    logContent.className = 'version-log-content';
    
    VERSION_LOGS.forEach(version => {
        const versionSection = document.createElement('div');
        versionSection.className = 'version-section';
        
        const versionHeader = document.createElement('h4');
        versionHeader.textContent = `版本 ${version.version} (${version.date})`;
        versionSection.appendChild(versionHeader);
        
        const changesList = document.createElement('ul');
        version.changes.forEach(change => {
            const changeItem = document.createElement('li');
            changeItem.textContent = change;
            changesList.appendChild(changeItem);
        });
        versionSection.appendChild(changesList);
        logContent.appendChild(versionSection);
    });
    
    popup.appendChild(logContent);
    
    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-button';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    });
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    buttonContainer.appendChild(closeButton);
    
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    
    // 添加滚动事件处理，阻止背景页面滚动
    const handleScroll = (e) => {
        // 检查弹窗内部是否有滚动条
        const hasScroll = popup.scrollHeight > popup.clientHeight;
        if (!hasScroll) {
            e.preventDefault();
        }
        e.stopPropagation();
    };
    
    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);
    
    document.body.appendChild(overlay);
}

// 检测网络环境
function checkNetworkStatus() {
    return new Promise((resolve) => {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            const effectiveType = connection.effectiveType;
            const downlink = connection.downlink;
            
            // 判断网络环境是否不佳
            if (effectiveType === '2g' || downlink < 1) {
                resolve({ isPoor: true, effectiveType, downlink });
            } else {
                resolve({ isPoor: false, effectiveType, downlink });
            }
        } else {
            // 降级方案：使用性能API检测
            const startTime = performance.now();
            fetch('https://www.google.com/generate_204')
                .then(() => {
                    const endTime = performance.now();
                    const latency = endTime - startTime;
                    resolve({ isPoor: latency > 500, latency });
                })
                .catch(() => {
                    resolve({ isPoor: true, error: 'Network error' });
                });
        }
    });
}

// 使用jsdelivr CDN加速URL
function getCDNAcceleratedURL(url) {
    // 提取图片ID
    const match = url.match(/photo-(\d+)/);
    if (match && match[1]) {
        const photoId = match[1];
        return `https://cdn.jsdelivr.net/gh/unsplash/photos@main/${photoId}.jpg`;
    }
    return url;
}

// 应用壁纸
function applyWallpaper(settings) {
    const body = document.body;
    if (settings.type === 'default' || !settings.url) {
        body.style.backgroundImage = 'none';
        body.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f0f9ff 100%)';
        body.classList.remove('wallpaper-custom');
    } else {
        // 检测网络环境
        checkNetworkStatus().then(networkStatus => {
            let wallpaperUrl = settings.url;
            
            // 如果网络环境不佳，使用CDN加速
            if (networkStatus.isPoor) {
                wallpaperUrl = getCDNAcceleratedURL(settings.url);
            }
            
            // 实现图片懒加载和错误处理
            const img = new Image();
            img.onload = function() {
                body.style.backgroundImage = `url(${wallpaperUrl})`;
                body.style.backgroundSize = 'cover';
                body.style.backgroundPosition = 'center';
                body.style.backgroundRepeat = 'no-repeat';
                body.style.backgroundAttachment = 'fixed';
                body.classList.add('wallpaper-custom');
            };
            img.onerror = function() {
                // 加载失败时使用默认背景
                body.style.backgroundImage = 'none';
                body.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f0f9ff 100%)';
                body.classList.remove('wallpaper-custom');
                console.error('壁纸加载失败，使用默认背景');
            };
            img.src = wallpaperUrl;
        });
    }
}

// 重置壁纸
function resetWallpaper() {
    const defaultSettings = { type: 'default', url: '', opacity: 1 };
    saveWallpaperSettings(defaultSettings);
    applyWallpaper(defaultSettings);
    return defaultSettings;
}

// 初始化网络加速设置
function initAccelerationSettings() {
    const existingSettings = localStorage.getItem(ACCELERATION_SETTINGS_KEY);
    if (existingSettings) {
        return JSON.parse(existingSettings);
    }
    const defaultSettings = { enabled: true };
    localStorage.setItem(ACCELERATION_SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
}

// 保存网络加速设置
function saveAccelerationSettings(settings) {
    localStorage.setItem(ACCELERATION_SETTINGS_KEY, JSON.stringify(settings));
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'ACCELERATION_CONTROL',
            enabled: settings.enabled
        });
    }
}

// 清除加速缓存
function clearAccelerationCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ACCELERATION_CACHE' });
    }
}

// 加载速度测试
function testLoadSpeed() {
    const accelerationSettings = initAccelerationSettings();
    const originalEnabled = accelerationSettings.enabled;
    
    function testWithoutAcceleration() {
        return new Promise((resolve, reject) => {
            accelerationSettings.enabled = false;
            saveAccelerationSettings(accelerationSettings);
            setTimeout(() => {
                const startTime = performance.now();
                fetch('https://jiangwanzhengchouyv.github.io/PointOS/updates/update-info.json?test=' + Date.now())
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(() => {
                        const endTime = performance.now();
                        resolve(endTime - startTime);
                    })
                    .catch(error => {
                        console.error('测试无加速时出错:', error);
                        reject(error);
                    });
            }, 1000);
        });
    }
    
    function testWithAcceleration() {
        return new Promise((resolve, reject) => {
            accelerationSettings.enabled = true;
            saveAccelerationSettings(accelerationSettings);
            setTimeout(() => {
                const startTime = performance.now();
                fetch('https://jiangwanzhengchouyv.github.io/PointOS/updates/update-info.json?test=' + Date.now())
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(() => {
                        const endTime = performance.now();
                        resolve(endTime - startTime);
                    })
                    .catch(error => {
                        console.error('测试有加速时出错:', error);
                        reject(error);
                    });
            }, 1000);
        });
    }
    
    alert('开始网络加速效果测试，请稍候...');
    
    testWithoutAcceleration()
        .then(withoutTime => {
            return testWithAcceleration().then(withTime => {
                accelerationSettings.enabled = originalEnabled;
                saveAccelerationSettings(accelerationSettings);
                const improvement = ((withoutTime - withTime) / withoutTime) * 100;
                alert(`网络加速测试结果：\n\n禁用加速时：${withoutTime.toFixed(2)} 毫秒\n启用加速时：${withTime.toFixed(2)} 毫秒\n性能提升：${improvement.toFixed(2)}%`);
            });
        })
        .catch(error => {
            accelerationSettings.enabled = originalEnabled;
            saveAccelerationSettings(accelerationSettings);
            alert('测试失败：' + error.message);
        });
}

// 初始化数据
function initData() {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (existingData) {
        return JSON.parse(existingData);
    }
    const defaultData = {
        groups: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
}

// 保存数据到localStorage
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 加载数据到页面
function loadDataToPage(data) {
    // 缓存DOM引用，减少DOM查询次数
    const scoreGroups = document.querySelectorAll('.score-group');
    scoreGroups.forEach(group => {
        const groupNumber = group.dataset.group;
        const groupScore = data.groups[groupNumber] || 0;
        const scoreElement = group.querySelector('.score-value');
        const inputElement = group.querySelector('.score-input');
        if (scoreElement) scoreElement.textContent = groupScore;
        if (inputElement) inputElement.value = groupScore;
    });
}

// 添加操作反馈
function addFeedback(element) {
    element.classList.add('updated');
    setTimeout(() => element.classList.remove('updated'), 500);
}



// 创建壁纸选择弹出层
function createWallpaperPopup(currentSettings) {
    let tempSettings = { ...currentSettings };
    
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup wallpaper-popup';
    
    // 使用文档片段批量创建DOM元素，减少重排重绘
    const fragment = document.createDocumentFragment();
    
    const title = document.createElement('h3');
    title.textContent = '自定义壁纸';
    fragment.appendChild(title);
    
    // 预设壁纸区域
    const presetsSection = document.createElement('div');
    presetsSection.className = 'wallpaper-presets';
    
    const presetsTitle = document.createElement('h4');
    presetsTitle.textContent = '预设壁纸';
    presetsSection.appendChild(presetsTitle);
    
    // 按类别组织壁纸
    const wallpaperByCategory = {};
    PRESET_WALLPAPERS.forEach(wallpaper => {
        if (!wallpaperByCategory[wallpaper.category]) {
            wallpaperByCategory[wallpaper.category] = [];
        }
        wallpaperByCategory[wallpaper.category].push(wallpaper);
    });
    
    // 生成分类壁纸展示
    Object.keys(wallpaperByCategory).forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'wallpaper-category';
        
        const categoryTitle = document.createElement('h5');
        categoryTitle.textContent = category;
        categorySection.appendChild(categoryTitle);
        
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-container';
        
        // 使用文档片段批量创建壁纸项
        const categoryFragment = document.createDocumentFragment();
        
        wallpaperByCategory[category].forEach(wallpaper => {
            const presetItem = document.createElement('div');
            presetItem.className = 'preset-item';
            if ((wallpaper.type === 'default' && tempSettings.type === 'default') || 
                (wallpaper.url === tempSettings.url && tempSettings.type !== 'custom')) {
                presetItem.classList.add('selected');
            }
            
            const presetLabel = document.createElement('span');
            presetLabel.textContent = wallpaper.name;
            presetItem.appendChild(presetLabel);
            
            if (wallpaper.type === 'default') {
                presetItem.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f0f9ff 100%)';
            } else {
                // 实现懒加载
                presetItem.setAttribute('data-src', wallpaper.url);
                presetItem.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f0f9ff 100%)';
                presetItem.classList.add('lazy-wallpaper');
                
                // 为懒加载的壁纸添加错误处理
                const img = new Image();
                img.onerror = function() {
                    // 加载失败时显示错误提示
                    presetItem.style.background = 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 50%, #ef9a9a 100%)';
                    presetLabel.textContent = `${wallpaper.name} (加载失败)`;
                    presetLabel.style.color = '#c62828';
                };
                img.src = wallpaper.url;
            }
            
            // 预览按钮
            const previewButton = document.createElement('button');
            previewButton.className = 'preview-button';
            previewButton.textContent = '预览';
            previewButton.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止触发预设项的点击事件
                showWallpaperPreview(wallpaper);
            });
            presetItem.appendChild(previewButton);
            
            presetItem.addEventListener('click', () => {
                document.querySelectorAll('.preset-item').forEach(item => item.classList.remove('selected'));
                presetItem.classList.add('selected');
                if (wallpaper.type === 'default') {
                    tempSettings = { type: 'default', url: '', opacity: 1 };
                } else {
                    tempSettings = { type: 'preset', url: wallpaper.url, opacity: 1 };
                }
                updatePreview(tempSettings);
            });
            
            categoryFragment.appendChild(presetItem);
        });
        
        categoryContainer.appendChild(categoryFragment);
        categorySection.appendChild(categoryContainer);
        presetsSection.appendChild(categorySection);
    });
    
    fragment.appendChild(presetsSection);
    
    // 自定义上传区域
    const customSection = document.createElement('div');
    customSection.className = 'wallpaper-custom-upload';
    
    const customTitle = document.createElement('h4');
    customTitle.textContent = '自定义上传';
    customSection.appendChild(customTitle);
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/gif';
    fileInput.style.display = 'none';
    
    const uploadButton = document.createElement('button');
    uploadButton.className = 'popup-button';
    uploadButton.textContent = '选择图片';
    uploadButton.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                tempSettings = { type: 'custom', url: event.target.result, opacity: 1 };
                document.querySelectorAll('.preset-item').forEach(item => item.classList.remove('selected'));
                updatePreview(tempSettings);
            };
            reader.readAsDataURL(file);
        }
    });
    
    customSection.appendChild(uploadButton);
    fragment.appendChild(customSection);
    
    // 预览区域
    const previewSection = document.createElement('div');
    previewSection.className = 'wallpaper-preview';
    
    const previewTitle = document.createElement('h4');
    previewTitle.textContent = '预览';
    previewSection.appendChild(previewTitle);
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    previewSection.appendChild(previewContainer);
    
    fragment.appendChild(previewSection);
    
    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const saveButton = document.createElement('button');
    saveButton.className = 'popup-button';
    saveButton.textContent = '保存';
    saveButton.addEventListener('click', () => {
        saveWallpaperSettings(tempSettings);
        applyWallpaper(tempSettings);
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    });
    buttonContainer.appendChild(saveButton);
    
    const resetButton = document.createElement('button');
    resetButton.className = 'popup-button';
    resetButton.textContent = '重置';
    resetButton.addEventListener('click', () => {
        tempSettings = resetWallpaper();
        document.querySelectorAll('.preset-item').forEach(item => item.classList.remove('selected'));
        document.querySelector('.preset-item:first-child').classList.add('selected');
        updatePreview(tempSettings);
    });
    buttonContainer.appendChild(resetButton);
    
    fragment.appendChild(buttonContainer);
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    });
    
    fragment.appendChild(cancelButton);
    
    // 一次性将所有元素添加到DOM中，减少重排重绘
    popup.appendChild(fragment);
    overlay.appendChild(popup);
    
    // 添加滚动事件处理，阻止背景页面滚动
    const handleScroll = (e) => {
        // 检查弹窗内部是否有滚动条
        const hasScroll = popup.scrollHeight > popup.clientHeight;
        if (!hasScroll) {
            e.preventDefault();
        }
        e.stopPropagation();
    };
    
    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);
    
    document.body.appendChild(overlay);
    
    function updatePreview(settings) {
        if (settings.type === 'default' || !settings.url) {
            previewContainer.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f0f9ff 100%)';
            previewContainer.style.backgroundImage = 'none';
        } else {
            previewContainer.style.backgroundImage = `url(${settings.url})`;
            previewContainer.style.backgroundSize = 'cover';
            previewContainer.style.backgroundPosition = 'center';
        }
    }
    
    updatePreview(tempSettings);
    
    // 初始化懒加载
    initLazyLoading();
}

// 显示壁纸预览
function showWallpaperPreview(wallpaper) {
    if (wallpaper.type === 'default') {
        alert('默认渐变背景无需预览');
        return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup wallpaper-preview-popup';
    
    const title = document.createElement('h3');
    title.textContent = `壁纸预览: ${wallpaper.name}`;
    popup.appendChild(title);
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'full-preview-container';
    
    const previewImg = document.createElement('img');
    previewImg.className = 'preview-image';
    previewImg.src = wallpaper.url;
    previewImg.alt = wallpaper.name;
    previewImg.style.maxWidth = '100%';
    previewImg.style.maxHeight = '70vh';
    previewImg.style.objectFit = 'contain';
    
    // 加载状态
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = '加载中...';
    previewContainer.appendChild(loadingIndicator);
    
    previewImg.onload = function() {
        loadingIndicator.style.display = 'none';
    };
    
    previewImg.onerror = function() {
        loadingIndicator.textContent = '加载失败';
        loadingIndicator.style.color = '#c62828';
    };
    
    previewContainer.appendChild(previewImg);
    popup.appendChild(previewContainer);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-button';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    });
    buttonContainer.appendChild(closeButton);
    
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

// 图片加载管理器
class ImageLoader {
    constructor() {
        this.loadingQueue = [];
        this.maxConcurrentLoads = 3;
        this.currentLoads = 0;
        this.observer = null;
    }
    
    // 初始化懒加载
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const wallpaperItem = entry.target;
                        const src = wallpaperItem.getAttribute('data-src');
                        if (src) {
                            this.loadImage(wallpaperItem, src);
                            this.observer.unobserve(wallpaperItem);
                        }
                    }
                });
            }, {
                rootMargin: '0px 0px 200px 0px'
            });
            
            document.querySelectorAll('.lazy-wallpaper').forEach(item => {
                this.observer.observe(item);
            });
        } else {
            // 降级方案：使用节流加载所有壁纸
            const items = document.querySelectorAll('.lazy-wallpaper');
            this.loadImagesInSequence(items);
        }
    }
    
    // 加载图片
    loadImage(element, src) {
        if (this.currentLoads >= this.maxConcurrentLoads) {
            this.loadingQueue.push({ element, src });
            return;
        }
        
        this.currentLoads++;
        
        const img = new Image();
        img.onload = () => {
            element.style.backgroundImage = `url(${src})`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            element.classList.remove('lazy-wallpaper');
            this.currentLoads--;
            this.processQueue();
        };
        img.onerror = () => {
            // 加载失败时显示错误提示
            element.style.background = 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 50%, #ef9a9a 100%)';
            const label = element.querySelector('span');
            if (label) {
                label.textContent = `${label.textContent} (加载失败)`;
                label.style.color = '#c62828';
            }
            element.classList.remove('lazy-wallpaper');
            this.currentLoads--;
            this.processQueue();
        };
        img.src = src;
    }
    
    // 处理加载队列
    processQueue() {
        if (this.loadingQueue.length > 0 && this.currentLoads < this.maxConcurrentLoads) {
            const next = this.loadingQueue.shift();
            this.loadImage(next.element, next.src);
        }
    }
    
    // 顺序加载图片（降级方案）
    loadImagesInSequence(items) {
        let index = 0;
        const loadNext = () => {
            if (index >= items.length) return;
            
            const item = items[index];
            const src = item.getAttribute('data-src');
            if (src) {
                const img = new Image();
                img.onload = () => {
                    item.style.backgroundImage = `url(${src})`;
                    item.style.backgroundSize = 'cover';
                    item.style.backgroundPosition = 'center';
                    item.classList.remove('lazy-wallpaper');
                    index++;
                    // 使用setTimeout避免阻塞主线程
                    setTimeout(loadNext, 50);
                };
                img.onerror = () => {
                    item.style.background = 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 50%, #ef9a9a 100%)';
                    const label = item.querySelector('span');
                    if (label) {
                        label.textContent = `${label.textContent} (加载失败)`;
                        label.style.color = '#c62828';
                    }
                    item.classList.remove('lazy-wallpaper');
                    index++;
                    setTimeout(loadNext, 50);
                };
                img.src = src;
            } else {
                index++;
                loadNext();
            }
        };
        loadNext();
    }
}

// 初始化壁纸懒加载
function initLazyLoading() {
    const imageLoader = new ImageLoader();
    imageLoader.init();
}

// 创建加减分弹出层
function createPopup(type, group, scoreData, saveData, loadDataToPage, addFeedback) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    // 使用文档片段批量创建DOM元素，减少重排重绘
    const fragment = document.createDocumentFragment();
    
    const title = document.createElement('h3');
    title.textContent = type === 'add' ? '选择加分值' : '选择减分值';
    fragment.appendChild(title);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const values = type === 'add' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4];
    values.forEach(value => {
        const button = document.createElement('button');
        button.className = 'popup-button';
        button.textContent = type === 'add' ? `+${value}` : `-${value}`;
        button.addEventListener('click', function() {
            if (type === 'add') {
                scoreData.groups[group] = (scoreData.groups[group] || 0) + value;
            } else {
                scoreData.groups[group] = Math.max(0, (scoreData.groups[group] || 0) - value);
            }
            saveData(scoreData);
            
            // 缓存DOM引用，减少DOM查询
            const scoreGroup = document.querySelector(`.score-group[data-group="${group}"]`);
            if (scoreGroup) {
                const scoreElement = scoreGroup.querySelector('.score-value');
                const inputElement = scoreGroup.querySelector('.score-input');
                if (scoreElement) {
                    scoreElement.textContent = scoreData.groups[group];
                    addFeedback(scoreElement);
                }
                if (inputElement) inputElement.value = scoreData.groups[group];
            }
            
            overlay.classList.add('closing');
            popup.classList.add('closing');
            setTimeout(() => {
                document.body.removeChild(overlay);
                // 清理事件监听器
                buttonContainer.querySelectorAll('button').forEach(btn => {
                    btn.removeEventListener('click', arguments.callee);
                });
                cancelButton.removeEventListener('click', cancelHandler);
            }, 400);
        });
        buttonContainer.appendChild(button);
    });
    
    fragment.appendChild(buttonContainer);
    
    const cancelHandler = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    };
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', cancelHandler);
    fragment.appendChild(cancelButton);
    
    // 一次性将所有元素添加到DOM中，减少重排重绘
    popup.appendChild(fragment);
    overlay.appendChild(popup);
    
    // 添加滚动事件处理，阻止背景页面滚动
    const handleScroll = (e) => {
        // 检查弹窗内部是否有滚动条
        const hasScroll = popup.scrollHeight > popup.clientHeight;
        if (!hasScroll) {
            e.preventDefault();
        }
        e.stopPropagation();
    };
    
    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);
    
    document.body.appendChild(overlay);
}









// 监听Service Worker消息
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'SW_UPDATED') {
            console.log('Service Worker 已更新:', event.data.message);
            // 显示更新提示弹窗
            showUpdateNotification(event.data.message);
        }
    });
}

// 显示更新提示弹窗
function showUpdateNotification(message) {
    // 检查是否已经显示过更新提示
    if (document.getElementById('update-notification')) {
        return;
    }
    
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideIn 0.3s ease-out;
    `;
    
    const title = document.createElement('h4');
    title.textContent = '🎉 发现新版本';
    title.style.cssText = 'margin: 0 0 10px 0; font-size: 18px; font-weight: 600;';
    
    const content = document.createElement('p');
    content.textContent = message || '系统有新版本可用，建议立即更新以获得最佳体验。';
    content.style.cssText = 'margin: 0 0 15px 0; font-size: 14px; line-height: 1.5; opacity: 0.95;';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px;';
    
    const updateButton = document.createElement('button');
    updateButton.textContent = '立即更新';
    updateButton.style.cssText = `
        background: white;
        color: #667eea;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s;
        flex: 1;
    `;
    updateButton.onmouseover = () => {
        updateButton.style.transform = 'translateY(-2px)';
        updateButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    };
    updateButton.onmouseout = () => {
        updateButton.style.transform = 'translateY(0)';
        updateButton.style.boxShadow = 'none';
    };
    updateButton.onclick = () => {
        window.location.reload();
    };
    
    const laterButton = document.createElement('button');
    laterButton.textContent = '稍后更新';
    laterButton.style.cssText = `
        background: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        flex: 1;
    `;
    laterButton.onmouseover = () => {
        laterButton.style.background = 'rgba(255,255,255,0.3)';
    };
    laterButton.onmouseout = () => {
        laterButton.style.background = 'rgba(255,255,255,0.2)';
    };
    laterButton.onclick = () => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    };
    
    buttonContainer.appendChild(updateButton);
    buttonContainer.appendChild(laterButton);
    
    notification.appendChild(title);
    notification.appendChild(content);
    notification.appendChild(buttonContainer);
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
}

// 主函数
function init() {
    const wallpaperSettings = initWallpaperSettings();
    applyWallpaper(wallpaperSettings);
    
    const accelerationSettings = initAccelerationSettings();
    let scoreData = initData();
    
    loadDataToPage(scoreData);
    
    // 使用事件委托优化事件监听器管理
    const scoreContainer = document.querySelector('.score-container');
    const globalControls = document.querySelector('.global-controls');
    const settingsBtn = document.querySelector('.settings');
    const evaluateBtn = document.querySelector('.evaluate');
    
    // 加分、减分、重置、保存按钮的事件委托
    if (scoreContainer) {
        scoreContainer.addEventListener('click', function(e) {
            const target = e.target;
            const scoreGroup = target.closest('.score-group');
            
            if (!scoreGroup) return;
            
            const group = scoreGroup.dataset.group;
            
            if (target.classList.contains('score-add')) {
                createPopup('add', group, scoreData, saveData, loadDataToPage, addFeedback);
            } else if (target.classList.contains('score-subtract')) {
                createPopup('subtract', group, scoreData, saveData, loadDataToPage, addFeedback);
            } else if (target.classList.contains('score-reset')) {
                if (confirm('确定要重置该小组的积分吗？')) {
                    scoreData.groups[group] = 0;
                    saveData(scoreData);
                    
                    const scoreElement = scoreGroup.querySelector('.score-value');
                    const inputElement = scoreGroup.querySelector('.score-input');
                    if (scoreElement) {
                        scoreElement.textContent = '0';
                        addFeedback(scoreElement);
                    }
                    if (inputElement) inputElement.value = '0';
                }
            } else if (target.classList.contains('score-save')) {
                const inputElement = scoreGroup.querySelector('.score-input');
                const scoreValue = parseInt(inputElement.value);
                
                if (isNaN(scoreValue)) {
                    alert('请输入有效的整数！');
                    inputElement.value = scoreData.groups[group] || 0;
                    return;
                }
                
                if (scoreValue < 0) {
                    alert('积分值不能小于0！');
                    inputElement.value = scoreData.groups[group] || 0;
                    return;
                }
                
                if (scoreValue >= 1000) {
                    alert('积分值不能大于等于1000！');
                    inputElement.value = scoreData.groups[group] || 0;
                    return;
                }
                
                scoreData.groups[group] = scoreValue;
                saveData(scoreData);
                
                const scoreElement = scoreGroup.querySelector('.score-value');
                if (scoreElement) {
                    scoreElement.textContent = scoreValue;
                    addFeedback(scoreElement);
                }
            }
        });
    }
    
    // 全局控制按钮的事件委托
    if (globalControls) {
        globalControls.addEventListener('click', function(e) {
            const target = e.target;
            
            if (target.classList.contains('reset-all')) {
                if (confirm('确定要重置所有小组的积分吗？')) {
                    for (let i = 1; i <= 7; i++) {
                        scoreData.groups[i.toString()] = 0;
                    }
                    saveData(scoreData);
                    
                    document.querySelectorAll('.score-value').forEach(element => {
                        element.textContent = '0';
                        addFeedback(element);
                    });
                    document.querySelectorAll('.score-input').forEach(element => {
                        element.value = '0';
                    });
                }
            } else if (target.classList.contains('add-all')) {
                createGlobalPopup('add', scoreData, saveData, loadDataToPage, addFeedback);
            } else if (target.classList.contains('subtract-all')) {
                createGlobalPopup('subtract', scoreData, saveData, loadDataToPage, addFeedback);
            } else if (target.classList.contains('evaluate')) {
                evaluateScore(scoreData, saveData, loadDataToPage, addFeedback);
            }
        });
    }
    
    // 设置按钮点击事件
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            createSettingsPopup(accelerationSettings, scoreData, saveData, loadDataToPage);
        });
    }
    
    // 评比按钮点击事件（冗余，已通过事件委托处理）
    if (evaluateBtn) {
        evaluateBtn.addEventListener('click', function() {
            evaluateScore(scoreData, saveData, loadDataToPage, addFeedback);
        });
    }
}

// 创建全局操作弹出层
function createGlobalPopup(type, scoreData, saveData, loadDataToPage, addFeedback) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const title = document.createElement('h3');
    title.textContent = type === 'add' ? '选择加分值' : '选择减分值';
    popup.appendChild(title);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const values = type === 'add' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4];
    values.forEach(value => {
        const button = document.createElement('button');
        button.className = 'popup-button';
        button.textContent = type === 'add' ? `+${value}` : `-${value}`;
        button.addEventListener('click', function() {
            for (let i = 1; i <= 7; i++) {
                if (type === 'add') {
                    scoreData.groups[i.toString()] = (scoreData.groups[i.toString()] || 0) + value;
                } else {
                    scoreData.groups[i.toString()] = Math.max(0, (scoreData.groups[i.toString()] || 0) - value);
                }
            }
            saveData(scoreData);
            
            for (let i = 1; i <= 7; i++) {
                const scoreElement = document.querySelector(`.score-group[data-group="${i}"] .score-value`);
                const inputElement = document.querySelector(`.score-group[data-group="${i}"] .score-input`);
                if (scoreElement) {
                    scoreElement.textContent = scoreData.groups[i.toString()];
                    addFeedback(scoreElement);
                }
                if (inputElement) inputElement.value = scoreData.groups[i.toString()];
            }
            overlay.classList.add('closing');
            popup.classList.add('closing');
            setTimeout(() => {
                document.body.removeChild(overlay);
                // 清理事件监听器
                buttonContainer.querySelectorAll('button').forEach(btn => {
                    btn.removeEventListener('click', arguments.callee);
                });
                cancelButton.removeEventListener('click', cancelHandler);
            }, 400);
        });
        buttonContainer.appendChild(button);
    });
    
    const cancelHandler = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            // 清理事件监听器
            buttonContainer.querySelectorAll('button').forEach(btn => {
                btn.removeEventListener('click', arguments.callee);
            });
        }, 400);
    };
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', cancelHandler);
    
    popup.appendChild(buttonContainer);
    popup.appendChild(cancelButton);
    overlay.appendChild(popup);
    
    // 添加滚动事件处理，阻止背景页面滚动
    const handleScroll = (e) => {
        // 检查弹窗内部是否有滚动条
        const hasScroll = popup.scrollHeight > popup.clientHeight;
        if (!hasScroll) {
            e.preventDefault();
        }
        e.stopPropagation();
    };
    
    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);
    
    document.body.appendChild(overlay);
}

// 创建设置弹出层
function createSettingsPopup(accelerationSettings, scoreData, saveData, loadDataToPage) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const title = document.createElement('h3');
    title.textContent = '设置';
    popup.appendChild(title);
    
    // 网络加速
    const accelerationSection = document.createElement('div');
    accelerationSection.className = 'acceleration-section';
    
    const accelerationTitle = document.createElement('h4');
    accelerationTitle.textContent = '网络加速设置';
    accelerationSection.appendChild(accelerationTitle);
    
    const enableContainer = document.createElement('div');
    enableContainer.style.cssText = 'display:flex;align-items:center;margin-bottom:15px';
    
    const enableLabel = document.createElement('span');
    enableLabel.textContent = '启用网络加速';
    enableLabel.style.marginRight = '10px';
    enableContainer.appendChild(enableLabel);
    
    const enableSwitch = document.createElement('label');
    enableSwitch.className = 'switch';
    enableSwitch.innerHTML = `<input type="checkbox" ${accelerationSettings.enabled ? 'checked' : ''}><span class="slider round"></span>`;
    enableContainer.appendChild(enableSwitch);
    accelerationSection.appendChild(enableContainer);
    
    const accelerationButtons = document.createElement('div');
    accelerationButtons.style.cssText = 'display:flex;gap:10px;margin-bottom:15px';
    
    const clearCacheButton = document.createElement('button');
    clearCacheButton.className = 'popup-button';
    clearCacheButton.textContent = '清除加速缓存';
    clearCacheButton.addEventListener('click', () => {
        clearAccelerationCache();
        alert('加速缓存已清除');
    });
    accelerationButtons.appendChild(clearCacheButton);
    
    const testSpeedButton = document.createElement('button');
    testSpeedButton.className = 'popup-button';
    testSpeedButton.textContent = '测试加载速度';
    testSpeedButton.addEventListener('click', testLoadSpeed);
    accelerationButtons.appendChild(testSpeedButton);
    accelerationSection.appendChild(accelerationButtons);
    
    enableSwitch.querySelector('input').addEventListener('change', function() {
        accelerationSettings.enabled = this.checked;
        saveAccelerationSettings(accelerationSettings);
    });
    
    popup.appendChild(accelerationSection);
    
    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    // 自定义壁纸
    const wallpaperButton = document.createElement('button');
    wallpaperButton.className = 'popup-button';
    wallpaperButton.textContent = '自定义壁纸';
    wallpaperButton.addEventListener('click', function() {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            createWallpaperPopup(initWallpaperSettings());
        }, 400);
    });
    buttonContainer.appendChild(wallpaperButton);
    
    // 导出JSON
    const exportButton = document.createElement('button');
    exportButton.className = 'popup-button';
    exportButton.textContent = '导出JSON';
    exportButton.addEventListener('click', function() {
        const dataStr = JSON.stringify(scoreData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'class-score-data.json';
        link.click();
        URL.revokeObjectURL(url);
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    });
    buttonContainer.appendChild(exportButton);
    
    // 导入JSON
    const importButton = document.createElement('button');
    importButton.className = 'popup-button';
    importButton.textContent = '导入JSON';
    importButton.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (importedData && importedData.groups) {
                        scoreData = importedData;
                        saveData(scoreData);
                        loadDataToPage(scoreData);
                        alert('导入成功！');
                    } else {
                        alert('无效的JSON文件格式！');
                    }
                } catch (error) {
                    alert('JSON文件解析失败！');
                }
                overlay.classList.add('closing');
                popup.classList.add('closing');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 400);
            };
            reader.readAsText(file);
        });
        fileInput.click();
    });
    buttonContainer.appendChild(importButton);
    
    // 版本日志
    const versionLogButton = document.createElement('button');
    versionLogButton.className = 'popup-button';
    versionLogButton.textContent = '版本日志';
    versionLogButton.addEventListener('click', function() {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            showVersionLog();
        }, 400);
    });
    buttonContainer.appendChild(versionLogButton);
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    });
    
    popup.appendChild(buttonContainer);
    popup.appendChild(cancelButton);
    overlay.appendChild(popup);
    
    // 添加滚动事件处理，阻止背景页面滚动
    const handleScroll = (e) => {
        // 检查弹窗内部是否有滚动条
        const hasScroll = popup.scrollHeight > popup.clientHeight;
        if (!hasScroll) {
            e.preventDefault();
        }
        e.stopPropagation();
    };
    
    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);
    
    document.body.appendChild(overlay);
}

// 评比分数
function evaluateScore(scoreData, saveData, loadDataToPage, addFeedback) {
    let maxScore = -1;
    let winningGroup = '';
    
    for (let i = 1; i <= 7; i++) {
        const score = scoreData.groups[i.toString()] || 0;
        if (score > maxScore) {
            maxScore = score;
            winningGroup = i;
        }
    }
    
    if (winningGroup) {
        alert(`评比结果：小组 ${winningGroup} 得分最高，分数为 ${maxScore}！`);
        
        for (let i = 1; i <= 7; i++) {
            scoreData.groups[i.toString()] = 0;
        }
        saveData(scoreData);
        
        document.querySelectorAll('.score-value').forEach(element => {
            element.textContent = '0';
            addFeedback(element);
        });
        document.querySelectorAll('.score-input').forEach(element => {
            element.value = '0';
        });
        
        setTimeout(() => {
            window.location.href = 'https://bjcwy.rxtw666.cn/login';
        }, 1000);
    } else {
        alert('没有可评比的分数！');
    }
}

// 版本号存储键名
const VERSION_STORAGE_KEY = 'classScoreSystem_version';
const UPDATE_DEFERRED_KEY = 'classScoreSystem_updateDeferred';

// 当前版本号
let currentAppVersion = '1.2.3';
let updateNotificationShown = false;

// 检查版本更新
async function checkVersionUpdate() {
    try {
        const response = await fetch('version.json', { cache: 'no-store' });
        if (!response.ok) return;
        
        const data = await response.json();
        const serverVersion = data.version;
        const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
        
        // 保存当前版本号
        if (!storedVersion) {
            localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
            return;
        }
        
        // 比较版本号
        if (serverVersion !== storedVersion && !updateNotificationShown) {
            updateNotificationShown = true;
            showUpdateNotification(serverVersion, storedVersion);
        }
    } catch (error) {
        console.error('Version check failed:', error);
    }
}

// 显示版本更新提示
function showUpdateNotification(newVersion, currentVersion) {
    // 检查用户是否选择稍后更新
    const deferred = localStorage.getItem(UPDATE_DEFERRED_KEY);
    if (deferred) {
        const deferredTime = parseInt(deferred);
        // 如果用户在1小时内选择过稍后更新，不再提示
        if (Date.now() - deferredTime < 60 * 60 * 1000) {
            return;
        }
    }
    
    // 创建更新提示条
    const updateBar = document.createElement('div');
    updateBar.id = 'update-notification-bar';
    updateBar.innerHTML = `
        <div class="update-notification-content">
            <span class="update-message">🎉 发现新版本 ${newVersion}（当前版本 ${currentVersion}）</span>
            <div class="update-buttons">
                <button class="update-btn update-now" onclick="handleUpdateNow()">立即更新</button>
                <button class="update-btn update-later" onclick="handleUpdateLater()">稍后更新</button>
            </div>
        </div>
    `;
    
    // 添加样式
    updateBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease-out;
    `;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
        }
        @keyframes slideUp {
            from { transform: translateY(0); }
            to { transform: translateY(-100%); }
        }
        .update-notification-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
        }
        .update-message {
            font-size: 14px;
            font-weight: 500;
        }
        .update-buttons {
            display: flex;
            gap: 10px;
        }
        .update-btn {
            padding: 6px 16px;
            border: none;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .update-now {
            background: white;
            color: #667eea;
            font-weight: 600;
        }
        .update-now:hover {
            background: #f0f0f0;
            transform: scale(1.05);
        }
        .update-later {
            background: rgba(255,255,255,0.2);
            color: white;
        }
        .update-later:hover {
            background: rgba(255,255,255,0.3);
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(updateBar);
    
    // 为body添加顶部padding以避免内容被遮挡
    document.body.style.paddingTop = '50px';
}

// 处理立即更新
function handleUpdateNow() {
    // 清除缓存并刷新
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }).then(() => {
            localStorage.removeItem(UPDATE_DEFERRED_KEY);
            window.location.reload(true);
        });
    } else {
        localStorage.removeItem(UPDATE_DEFERRED_KEY);
        window.location.reload(true);
    }
}

// 处理稍后更新
function handleUpdateLater() {
    // 记录用户选择稍后更新的时间
    localStorage.setItem(UPDATE_DEFERRED_KEY, Date.now().toString());
    
    // 隐藏提示条
    const updateBar = document.getElementById('update-notification-bar');
    if (updateBar) {
        updateBar.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            updateBar.remove();
            document.body.style.paddingTop = '0';
        }, 300);
    }
}

// 注册Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 检查版本更新
        checkVersionUpdate();
        
        try {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration.scope);
                    
                    registration.addEventListener('updatefound', () => {
                        try {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    try {
                                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                            // 新版本的 Service Worker 已安装，等待用户确认
                                            console.log('New Service Worker installed, waiting for user confirmation');
                                            
                                            // 获取新版本号
                                            fetch('version.json', { cache: 'no-store' })
                                                .then(response => response.json())
                                                .then(data => {
                                                    const newVersion = data.version;
                                                    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
                                                    
                                                    if (newVersion !== storedVersion && !updateNotificationShown) {
                                                        updateNotificationShown = true;
                                                        showUpdateNotification(newVersion, storedVersion || '未知');
                                                    }
                                                })
                                                .catch(err => console.error('Failed to get version:', err));
                                        }
                                    } catch (error) {
                                        console.error('Service Worker statechange error:', error);
                                    }
                                });
                            }
                        } catch (error) {
                            console.error('Service Worker updatefound error:', error);
                        }
                    });
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        } catch (error) {
            console.error('Service Worker registration error:', error);
        }
    });
    
    // 监听Service Worker消息
    try {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'VERSION_UPDATED') {
                console.log('Version updated to:', event.data.version);
                const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
                
                if (event.data.version !== storedVersion && !updateNotificationShown) {
                    updateNotificationShown = true;
                    showUpdateNotification(event.data.version, storedVersion || '未知');
                }
            }
            
            if (event.data && event.data.type === 'CACHE_UPDATED') {
                console.log('Cache updated for:', event.data.url);
                // 不再自动刷新，等待用户手动更新
            }
        });
    } catch (error) {
        console.error('Service Worker message error:', error);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    init();
});
