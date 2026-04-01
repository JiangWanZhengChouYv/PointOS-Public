// 班级积分管理系统
// 版本: 1.2.0

// 存储键名
const STORAGE_KEY = 'classScoreSystem';
const ACCELERATION_SETTINGS_KEY = 'classScoreSystem_acceleration';
const WALLPAPER_STORAGE_KEY = 'wallpaperSettings';

// 版本日志数据
const VERSION_LOGS = [
    {
        version: '1.2.0',
        date: '2026-04-01',
        changes: [
            '【新增功能】实现版本日志查看功能，清晰展示版本更新内容',
            '【界面调整】调整功能键位置至屏幕左上角，提升操作便捷性',
            '【界面优化】优化响应式布局，适配不同屏幕尺寸',
            '【版本更新】更新系统版本至1.2.0'
        ]
    },
    {
        version: '1.1.4',
        date: '2026-03-20',
        changes: [
            '【功能优化】改进壁纸加载机制，提升加载速度',
            '【界面调整】优化壁纸预览大小，减少屏幕占用',
            '【Bug修复】解决壁纸应用界面显示异常问题'
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
        document.body.removeChild(overlay);
    });
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    buttonContainer.appendChild(closeButton);
    
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
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
                    .then(response => response.json())
                    .then(() => {
                        const endTime = performance.now();
                        resolve(endTime - startTime);
                    })
                    .catch(reject);
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
                    .then(response => response.json())
                    .then(() => {
                        const endTime = performance.now();
                        resolve(endTime - startTime);
                    })
                    .catch(reject);
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
    for (let i = 1; i <= 7; i++) {
        const groupScore = data.groups[i.toString()] || 0;
        const scoreElement = document.querySelector(`.score-group[data-group="${i}"] .score-value`);
        const inputElement = document.querySelector(`.score-group[data-group="${i}"] .score-input`);
        if (scoreElement) scoreElement.textContent = groupScore;
        if (inputElement) inputElement.value = groupScore;
    }
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
    
    const title = document.createElement('h3');
    title.textContent = '自定义壁纸';
    popup.appendChild(title);
    
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
            
            categoryContainer.appendChild(presetItem);
        });
        
        categorySection.appendChild(categoryContainer);
        presetsSection.appendChild(categorySection);
    });
    
    popup.appendChild(presetsSection);
    
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
    popup.appendChild(customSection);
    
    // 预览区域
    const previewSection = document.createElement('div');
    previewSection.className = 'wallpaper-preview';
    
    const previewTitle = document.createElement('h4');
    previewTitle.textContent = '预览';
    previewSection.appendChild(previewTitle);
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    previewSection.appendChild(previewContainer);
    
    popup.appendChild(previewSection);
    
    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const saveButton = document.createElement('button');
    saveButton.className = 'popup-button';
    saveButton.textContent = '保存';
    saveButton.addEventListener('click', () => {
        saveWallpaperSettings(tempSettings);
        applyWallpaper(tempSettings);
        document.body.removeChild(overlay);
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
    
    popup.appendChild(buttonContainer);
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', () => document.body.removeChild(overlay));
    
    popup.appendChild(cancelButton);
    overlay.appendChild(popup);
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
        document.body.removeChild(overlay);
    });
    buttonContainer.appendChild(closeButton);
    
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

// 初始化壁纸懒加载
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const wallpaperItem = entry.target;
                    const src = wallpaperItem.getAttribute('data-src');
                    if (src) {
                        wallpaperItem.style.backgroundImage = `url(${src})`;
                        wallpaperItem.style.backgroundSize = 'cover';
                        wallpaperItem.style.backgroundPosition = 'center';
                        wallpaperItem.classList.remove('lazy-wallpaper');
                        observer.unobserve(wallpaperItem);
                    }
                }
            });
        }, {
            rootMargin: '0px 0px 200px 0px'
        });
        
        document.querySelectorAll('.lazy-wallpaper').forEach(item => {
            observer.observe(item);
        });
    } else {
        // 降级方案：直接加载所有壁纸
        document.querySelectorAll('.lazy-wallpaper').forEach(item => {
            const src = item.getAttribute('data-src');
            if (src) {
                item.style.backgroundImage = `url(${src})`;
                item.style.backgroundSize = 'cover';
                item.style.backgroundPosition = 'center';
                item.classList.remove('lazy-wallpaper');
            }
        });
    }
}

// 创建加减分弹出层
function createPopup(type, group, scoreData, saveData, loadDataToPage, addFeedback) {
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
            if (type === 'add') {
                scoreData.groups[group] = (scoreData.groups[group] || 0) + value;
            } else {
                scoreData.groups[group] = Math.max(0, (scoreData.groups[group] || 0) - value);
            }
            saveData(scoreData);
            
            const scoreElement = document.querySelector(`.score-group[data-group="${group}"] .score-value`);
            const inputElement = document.querySelector(`.score-group[data-group="${group}"] .score-input`);
            if (scoreElement) {
                scoreElement.textContent = scoreData.groups[group];
                addFeedback(scoreElement);
            }
            if (inputElement) inputElement.value = scoreData.groups[group];
            
            document.body.removeChild(overlay);
        });
        buttonContainer.appendChild(button);
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', () => document.body.removeChild(overlay));
    
    popup.appendChild(buttonContainer);
    popup.appendChild(cancelButton);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}









// 主函数
function init() {
    const wallpaperSettings = initWallpaperSettings();
    applyWallpaper(wallpaperSettings);
    
    const accelerationSettings = initAccelerationSettings();
    let scoreData = initData();
    
    loadDataToPage(scoreData);
    
    // 加分按钮
    document.querySelectorAll('.score-add').forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.score-group').dataset.group;
            createPopup('add', group, scoreData, saveData, loadDataToPage, addFeedback);
        });
    });
    
    // 减分按钮
    document.querySelectorAll('.score-subtract').forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.score-group').dataset.group;
            createPopup('subtract', group, scoreData, saveData, loadDataToPage, addFeedback);
        });
    });
    
    // 单组重置
    document.querySelectorAll('.score-reset').forEach(button => {
        button.addEventListener('click', function() {
            if (confirm('确定要重置该小组的积分吗？')) {
                const group = this.closest('.score-group').dataset.group;
                scoreData.groups[group] = 0;
                saveData(scoreData);
                
                const scoreElement = this.closest('.score-group').querySelector('.score-value');
                const inputElement = this.closest('.score-group').querySelector('.score-input');
                if (scoreElement) {
                    scoreElement.textContent = '0';
                    addFeedback(scoreElement);
                }
                if (inputElement) inputElement.value = '0';
            }
        });
    });
    
    // 全部重置
    const resetAllBtn = document.querySelector('.reset-all');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', function() {
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
        });
    }
    
    // 全员增加
    const addAllBtn = document.querySelector('.add-all');
    if (addAllBtn) {
        addAllBtn.addEventListener('click', function() {
            const overlay = document.createElement('div');
            overlay.className = 'popup-overlay';
            const popup = document.createElement('div');
            popup.className = 'popup';
            
            const title = document.createElement('h3');
            title.textContent = '选择加分值';
            popup.appendChild(title);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'popup-buttons';
            
            [1, 2, 3, 4, 5, 6].forEach(value => {
                const button = document.createElement('button');
                button.className = 'popup-button';
                button.textContent = `+${value}`;
                button.addEventListener('click', function() {
                    for (let i = 1; i <= 7; i++) {
                        scoreData.groups[i.toString()] = (scoreData.groups[i.toString()] || 0) + value;
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
                    document.body.removeChild(overlay);
                });
                buttonContainer.appendChild(button);
            });
            
            const cancelButton = document.createElement('button');
            cancelButton.className = 'popup-cancel';
            cancelButton.textContent = '取消';
            cancelButton.addEventListener('click', () => document.body.removeChild(overlay));
            
            popup.appendChild(buttonContainer);
            popup.appendChild(cancelButton);
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
        });
    }
    
    // 全员减少
    const subtractAllBtn = document.querySelector('.subtract-all');
    if (subtractAllBtn) {
        subtractAllBtn.addEventListener('click', function() {
            const overlay = document.createElement('div');
            overlay.className = 'popup-overlay';
            const popup = document.createElement('div');
            popup.className = 'popup';
            
            const title = document.createElement('h3');
            title.textContent = '选择减分值';
            popup.appendChild(title);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'popup-buttons';
            
            [1, 2, 3, 4].forEach(value => {
                const button = document.createElement('button');
                button.className = 'popup-button';
                button.textContent = `-${value}`;
                button.addEventListener('click', function() {
                    for (let i = 1; i <= 7; i++) {
                        scoreData.groups[i.toString()] = Math.max(0, (scoreData.groups[i.toString()] || 0) - value);
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
                    document.body.removeChild(overlay);
                });
                buttonContainer.appendChild(button);
            });
            
            const cancelButton = document.createElement('button');
            cancelButton.className = 'popup-cancel';
            cancelButton.textContent = '取消';
            cancelButton.addEventListener('click', () => document.body.removeChild(overlay));
            
            popup.appendChild(buttonContainer);
            popup.appendChild(cancelButton);
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
        });
    }
    
    // 设置按钮
    const settingsBtn = document.querySelector('.settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
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
                document.body.removeChild(overlay);
                createWallpaperPopup(initWallpaperSettings());
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
                document.body.removeChild(overlay);
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
                        document.body.removeChild(overlay);
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
                document.body.removeChild(overlay);
                showVersionLog();
            });
            buttonContainer.appendChild(versionLogButton);
            
            const cancelButton = document.createElement('button');
            cancelButton.className = 'popup-cancel';
            cancelButton.textContent = '取消';
            cancelButton.addEventListener('click', () => document.body.removeChild(overlay));
            
            popup.appendChild(buttonContainer);
            popup.appendChild(cancelButton);
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
        });
    }
    
    // 评比按钮
    const evaluateBtn = document.querySelector('.evaluate');
    if (evaluateBtn) {
        evaluateBtn.addEventListener('click', function() {
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
        });
    }
    
    // 保存按钮
    document.querySelectorAll('.score-save').forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.score-group').dataset.group;
            const inputElement = this.closest('.score-group').querySelector('.score-input');
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
            
            const scoreElement = this.closest('.score-group').querySelector('.score-value');
            if (scoreElement) {
                scoreElement.textContent = scoreValue;
                addFeedback(scoreElement);
            }
        });
    });
}

// 注册Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration.scope);
                
                // 强制更新Service Worker
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });
            })
            .catch(error => console.error('Service Worker registration failed:', error));
    });
    
    // 监听Service Worker更新
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker updated');
        // 可以在这里提示用户刷新页面
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    init();
});
