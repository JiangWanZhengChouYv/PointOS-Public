// 班级积分管理系统
// 版本: 1.4.0

// 存储键名
const STORAGE_KEY = 'classScoreSystem';
const WALLPAPER_STORAGE_KEY = 'wallpaperSettings';
const EVALUATION_URL_STORAGE_KEY = 'classScoreSystem_evaluationUrl';
const PERFORMANCE_MODE_KEY = 'classScoreSystem_performanceMode';
const LAST_VIEW_VERSION_KEY = 'classScoreSystem_LastViewVersion';
const CURRENT_VERSION = '1.4.0';

// 性能模式相关
let isPerformanceModeEnabled = false;
let devicePerformanceInfo = null;

// 检测设备性能
function detectDevicePerformance() {
    const info = {
        memory: null,
        cpuCores: null,
        features: {},
        isLowEnd: false,
        score: 100
    };
    
    // 检测内存（GB）
    if (navigator.deviceMemory) {
        info.memory = navigator.deviceMemory;
        if (info.memory <= 4) info.score -= 30;
        if (info.memory <= 2) info.score -= 20;
    } else {
        info.score -= 15;
    }
    
    // 检测CPU核心数
    if (navigator.hardwareConcurrency) {
        info.cpuCores = navigator.hardwareConcurrency;
        if (info.cpuCores <= 4) info.score -= 20;
        if (info.cpuCores <= 2) info.score -= 15;
    } else {
        info.score -= 10;
    }
    
    // 检测浏览器特性支持
    info.features.intersectionObserver = 'IntersectionObserver' in window;
    info.features.cssSupports = 'CSS' in window && 'supports' in CSS;
    info.features.requestAnimationFrame = 'requestAnimationFrame' in window;
    info.features.webp = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    if (!info.features.intersectionObserver) info.score -= 10;
    if (!info.features.cssSupports) info.score -= 5;
    if (!info.features.requestAnimationFrame) info.score -= 10;
    
    // 检测是否为移动设备或老旧系统
    const userAgent = navigator.userAgent.toLowerCase();
    const isOldBrowser = userAgent.indexOf('msie') !== -1 || userAgent.indexOf('trident/7') !== -1;
    if (isOldBrowser) info.score -= 25;
    
    // 综合判断是否为低端设备
    info.isLowEnd = info.score < 50;
    
    return info;
}

// 初始化性能模式
function initPerformanceMode() {
    devicePerformanceInfo = detectDevicePerformance();
    
    const savedMode = localStorage.getItem(PERFORMANCE_MODE_KEY);
    
    if (savedMode !== null) {
        isPerformanceModeEnabled = savedMode === 'true';
    } else {
        isPerformanceModeEnabled = devicePerformanceInfo.isLowEnd;
    }
    
    applyPerformanceMode(isPerformanceModeEnabled);
    
    return { isPerformanceModeEnabled, devicePerformanceInfo };
}

// 应用性能模式
function applyPerformanceMode(enabled) {
    if (enabled) {
        document.body.classList.add('performance-mode');
    } else {
        document.body.classList.remove('performance-mode');
    }
    isPerformanceModeEnabled = enabled;
}

// 切换性能模式
function togglePerformanceMode() {
    const newMode = !isPerformanceModeEnabled;
    applyPerformanceMode(newMode);
    localStorage.setItem(PERFORMANCE_MODE_KEY, newMode.toString());
    return newMode;
}

// 获取设备性能描述
function getPerformanceDescription() {
    if (!devicePerformanceInfo) return '未检测';
    
    const parts = [];
    if (devicePerformanceInfo.memory) {
        parts.push(`内存: ${devicePerformanceInfo.memory}GB`);
    }
    if (devicePerformanceInfo.cpuCores) {
        parts.push(`CPU核心: ${devicePerformanceInfo.cpuCores}`);
    }
    parts.push(`性能评分: ${devicePerformanceInfo.score}/100`);
    
    return parts.join(' | ');
}

// 版本日志数据
const VERSION_LOGS = [
    {
        version: '1.4.0',
        date: '2026-05-07',
        changes: [
            '【版本更新】更新系统版本至1.4.0',
            '【新增功能】增加版本更新自动检测功能，首次运行或版本更新后自动弹出版本更新日志',
            '【新增功能】设置中的版本日志同步更新至1.4.0'
        ]
    },
    {
        version: '1.3.1',
        date: '2026-04-25',
        changes: [
            '【版本更新】更新系统版本至1.3.1',
            '【新增功能】实现评比跳转网址设置功能，可在设置菜单中自定义跳转网址'
        ]
    },
    {
        version: '1.3.0',
        date: '2026-04-03',
        changes: [
            '【版本更新】更新系统版本至1.3.0',
            '【功能修复】修正导出class-score-json文件时丢失当前壁纸信息的问题',
            '【新增功能】实现小组加分自定义分值功能',
            '【新增功能】实现小组减分自定义分值功能',
            '【功能优化】确保自定义分值信息正确存储在class-score-json文件中',
            '【新增功能】在设置模块中实现加分值管理功能，可通过设置菜单快速访问加分/减分操作'
        ]
    },
    {
        version: '1.2.4',
        date: '2026-04-03',
        changes: [
            '【版本更新】更新系统版本至1.2.4',
            '【功能优化】优化缓存更新机制，实现代码变更自动检测',
            '【功能优化】新增版本更新提示功能，用户可选择立即更新或稍后更新',
            '【Bug修复】修复缓存更新不提示的问题',
            '【性能优化】改进Service Worker更新策略，提升更新检测准确性'
        ]
    },
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

// 初始化评比跳转网址设置
function initEvaluationUrlSettings() {
    const existingSettings = localStorage.getItem(EVALUATION_URL_STORAGE_KEY);
    if (!existingSettings) {
        const defaultUrl = 'https://bjcwy.rxtw666.cn/login';
        localStorage.setItem(EVALUATION_URL_STORAGE_KEY, defaultUrl);
        return defaultUrl;
    }
    return existingSettings;
}

// 保存评比跳转网址设置
function saveEvaluationUrlSettings(url) {
    localStorage.setItem(EVALUATION_URL_STORAGE_KEY, url);
}

// 检查本地版本更新
function checkLocalVersionUpdate() {
    const lastViewVersion = localStorage.getItem(LAST_VIEW_VERSION_KEY);
    if (!lastViewVersion) {
        localStorage.setItem(LAST_VIEW_VERSION_KEY, CURRENT_VERSION);
        return false;
    }
    if (lastViewVersion !== CURRENT_VERSION) {
        return true;
    }
    return false;
}

// 获取待显示的更新日志（只显示从 lastViewVersion 到 CURRENT_VERSION 的更新）
function getUpdateLogsSince(lastVersion) {
    const logs = [];
    for (const log of VERSION_LOGS) {
        if (log.version === lastVersion) {
            break;
        }
        logs.push(log);
    }
    return logs;
}

// 显示版本更新日志弹窗
function showVersionUpdatePopup(lastVersion, newVersion, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup version-log-popup';
    
    const title = document.createElement('h3');
    title.textContent = '🎉 版本更新';
    popup.appendChild(title);
    
    const versionInfo = document.createElement('div');
    versionInfo.style.cssText = 'margin: 10px 0; padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center;';
    versionInfo.innerHTML = `<span style="font-size: 14px;">${lastVersion}</span> → <span style="font-size: 16px; font-weight: bold;">${newVersion}</span>`;
    popup.appendChild(versionInfo);
    
    const logContent = document.createElement('div');
    logContent.className = 'version-log-content';
    logContent.style.cssText = 'max-height: 300px; overflow-y: auto; margin: 15px 0; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px;';
    
    const logs = getUpdateLogsSince(lastVersion);
    
    logs.forEach(version => {
        const versionSection = document.createElement('div');
        versionSection.style.cssText = 'margin-bottom: 15px;';
        
        const versionHeader = document.createElement('h4');
        versionHeader.textContent = `版本 ${version.version} (${version.date})`;
        versionHeader.style.cssText = 'margin: 0 0 8px 0; color: #667eea; font-size: 14px;';
        versionSection.appendChild(versionHeader);
        
        const changesList = document.createElement('ul');
        changesList.style.cssText = 'margin: 0; padding-left: 20px; font-size: 13px;';
        version.changes.forEach(change => {
            const changeItem = document.createElement('li');
            changeItem.textContent = change;
            changeItem.style.cssText = 'margin-bottom: 4px;';
            changesList.appendChild(changeItem);
        });
        versionSection.appendChild(changesList);
        logContent.appendChild(versionSection);
    });
    
    popup.appendChild(logContent);
    
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-button';
    closeButton.textContent = '知道了';
    closeButton.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;';
    closeButton.addEventListener('click', () => {
        localStorage.setItem(LAST_VIEW_VERSION_KEY, CURRENT_VERSION);
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            if (onClose) onClose();
        }, 400);
    });
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    buttonContainer.appendChild(closeButton);
    
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    
    const handleScroll = (e) => {
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

// 应用壁纸
function applyWallpaper(settings) {
    const body = document.body;
    if (settings.type === 'default' || !settings.url) {
        body.style.backgroundImage = 'none';
        body.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f0f9ff 100%)';
        body.classList.remove('wallpaper-custom');
    } else {
        // 实现图片懒加载和错误处理
        const img = new Image();
        img.onload = function() {
            body.style.backgroundImage = `url(${settings.url})`;
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
        img.src = settings.url;
    }
}

// 重置壁纸
function resetWallpaper() {
    const defaultSettings = { type: 'default', url: '', opacity: 1 };
    saveWallpaperSettings(defaultSettings);
    applyWallpaper(defaultSettings);
    return defaultSettings;
}

// 初始化数据
function initData() {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (existingData) {
        const data = JSON.parse(existingData);
        // 确保历史记录字段存在
        if (!data.history) {
            data.history = [];
        }
        return data;
    }
    const defaultData = {
        groups: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 },
        history: []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
}

// 添加历史记录
function addHistoryRecord(scoreData, type, group, before, after) {
    const record = {
        type: type,
        group: group,
        before: before,
        after: after,
        timestamp: Date.now()
    };
    scoreData.history.push(record);
    // 限制最多100条记录
    if (scoreData.history.length > 100) {
        scoreData.history.shift();
    }
}

// 清空历史记录
function clearHistory(scoreData) {
    scoreData.history = [];
}

// 格式化操作类型
function formatActionType(type) {
    const typeMap = {
        'add': '加分',
        'subtract': '减分',
        'reset': '重置',
        'save': '保存',
        'add-all': '全员加分',
        'subtract-all': '全员减分'
    };
    return typeMap[type] || type;
}

// 格式化时间戳
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 撤销历史记录
function undoHistoryRecord(scoreData, recordIndex, saveData, loadDataToPage, addFeedback) {
    if (recordIndex < 0 || recordIndex >= scoreData.history.length) {
        return false;
    }
    
    const record = scoreData.history[recordIndex];
    
    // 根据记录类型恢复分数
    if (record.group === null) {
        // 全员操作，恢复所有小组
        for (let i = 1; i <= 7; i++) {
            const groupKey = i.toString();
            if (record.before && record.before[groupKey] !== undefined) {
                scoreData.groups[groupKey] = record.before[groupKey];
            }
        }
    } else {
        // 单个小组操作
        scoreData.groups[record.group] = record.before;
    }
    
    // 移除被撤销的记录
    scoreData.history.splice(recordIndex, 1);
    
    // 保存数据并更新页面
    saveData(scoreData);
    loadDataToPage(scoreData);
    
    // 给更新的小组添加反馈动画
    if (record.group === null) {
        document.querySelectorAll('.score-value').forEach(element => {
            addFeedback(element);
        });
    } else {
        const scoreElement = document.querySelector(`.score-group[data-group="${record.group}"] .score-value`);
        if (scoreElement) {
            addFeedback(scoreElement);
        }
    }
    
    return true;
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
            const beforeScore = scoreData.groups[group] || 0;
            if (type === 'add') {
                scoreData.groups[group] = beforeScore + value;
            } else {
                scoreData.groups[group] = Math.max(0, beforeScore - value);
            }
            const afterScore = scoreData.groups[group];
            addHistoryRecord(scoreData, type, group, beforeScore, afterScore);
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
    
    // 添加自定义分值输入
    const customSection = document.createElement('div');
    customSection.style.cssText = 'margin: 15px 0;';
    
    const customLabel = document.createElement('label');
    customLabel.textContent = type === 'add' ? '自定义加分值：' : '自定义减分值：';
    customLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 14px;';
    
    const customInput = document.createElement('input');
    customInput.type = 'number';
    customInput.min = '1';
    customInput.max = '100';
    customInput.step = '1';
    customInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'popup-button';
    confirmButton.textContent = '确定';
    confirmButton.style.cssText = 'margin-top: 10px; width: 100%;';
    
    const handleCustomInput = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };
    
    const handleConfirm = () => {
        const customValue = parseInt(customInput.value);
        if (isNaN(customValue) || customValue < 1 || customValue > 100) {
            alert('请输入1-100之间的有效数字！');
            return;
        }

        const beforeScore = scoreData.groups[group] || 0;
        if (type === 'add') {
            scoreData.groups[group] = beforeScore + customValue;
        } else {
            scoreData.groups[group] = Math.max(0, beforeScore - customValue);
        }
        const afterScore = scoreData.groups[group];
        addHistoryRecord(scoreData, type, group, beforeScore, afterScore);
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
            customInput.removeEventListener('keypress', handleCustomInput);
            confirmButton.removeEventListener('click', handleConfirm);
        }, 400);
    };
    
    customInput.addEventListener('keypress', handleCustomInput);
    confirmButton.addEventListener('click', handleConfirm);
    
    customSection.appendChild(customLabel);
    customSection.appendChild(customInput);
    customSection.appendChild(confirmButton);
    
    fragment.appendChild(customSection);
    
    const cancelHandler = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            // 清理事件监听器
            customInput.removeEventListener('keypress', handleCustomInput);
            confirmButton.removeEventListener('click', handleConfirm);
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

// 创建加分值管理弹出层
function createScoreValueManagementPopup(scoreData, saveData, loadDataToPage, addFeedback) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const fragment = document.createDocumentFragment();
    
    const title = document.createElement('h3');
    title.textContent = '加分值管理';
    fragment.appendChild(title);
    
    let selectedGroup = null;
    
    const groupSection = document.createElement('div');
    groupSection.style.cssText = 'margin: 15px 0;';
    
    const groupTitle = document.createElement('h4');
    groupTitle.textContent = '选择小组';
    groupSection.appendChild(groupTitle);
    
    const groupContainer = document.createElement('div');
    groupContainer.className = 'popup-buttons';
    
    for (let i = 1; i <= 7; i++) {
        const groupButton = document.createElement('button');
        groupButton.className = 'popup-button';
        groupButton.textContent = `小组 ${i}`;
        groupButton.dataset.group = i.toString();
        
        groupButton.addEventListener('click', function() {
            document.querySelectorAll('[data-group]').forEach(btn => {
                btn.classList.remove('selected');
            });
            this.classList.add('selected');
            selectedGroup = i.toString();
        });
        
        groupContainer.appendChild(groupButton);
    }
    
    groupSection.appendChild(groupContainer);
    fragment.appendChild(groupSection);
    
    const actionButtonsSection = document.createElement('div');
    actionButtonsSection.style.cssText = 'margin: 15px 0;';
    
    const actionButtonsContainer = document.createElement('div');
    actionButtonsContainer.className = 'popup-buttons';
    
    const addButton = document.createElement('button');
    addButton.className = 'popup-button';
    addButton.textContent = '添加加分值';
    addButton.addEventListener('click', function() {
        if (!selectedGroup) {
            alert('请先选择一个小组！');
            return;
        }
        createPopup('add', selectedGroup, scoreData, saveData, loadDataToPage, addFeedback);
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    });
    
    const subtractButton = document.createElement('button');
    subtractButton.className = 'popup-button';
    subtractButton.textContent = '删减加分值';
    subtractButton.addEventListener('click', function() {
        if (!selectedGroup) {
            alert('请先选择一个小组！');
            return;
        }
        createPopup('subtract', selectedGroup, scoreData, saveData, loadDataToPage, addFeedback);
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    });
    
    actionButtonsContainer.appendChild(addButton);
    actionButtonsContainer.appendChild(subtractButton);
    actionButtonsSection.appendChild(actionButtonsContainer);
    fragment.appendChild(actionButtonsSection);
    
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
    
    popup.appendChild(fragment);
    overlay.appendChild(popup);
    
    const handleScroll = (e) => {
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
    // 检查本地版本更新
    const needsVersionUpdate = checkLocalVersionUpdate();
    if (needsVersionUpdate) {
        const lastViewVersion = localStorage.getItem(LAST_VIEW_VERSION_KEY) || '旧版本';
        setTimeout(() => {
            showVersionUpdatePopup(lastViewVersion, CURRENT_VERSION);
        }, 500);
    }
    
    // 初始化性能模式（需要在其他初始化之前）
    initPerformanceMode();
    
    const wallpaperSettings = initWallpaperSettings();
    if (!isPerformanceModeEnabled) {
        applyWallpaper(wallpaperSettings);
    }
    
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
                createConfirmPopup('确认重置', '确定要重置该小组的积分吗？', () => {
                    const beforeScore = scoreData.groups[group] || 0;
                    scoreData.groups[group] = 0;
                    addHistoryRecord(scoreData, 'reset', group, beforeScore, 0);
                    saveData(scoreData);
                    
                    const scoreElement = scoreGroup.querySelector('.score-value');
                    const inputElement = scoreGroup.querySelector('.score-input');
                    if (scoreElement) {
                        scoreElement.textContent = '0';
                        addFeedback(scoreElement);
                    }
                    if (inputElement) inputElement.value = '0';
                });
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
                
                const beforeScore = scoreData.groups[group] || 0;
                scoreData.groups[group] = scoreValue;
                addHistoryRecord(scoreData, 'save', group, beforeScore, scoreValue);
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
                createConfirmPopup('确认重置', '确定要重置所有小组的积分吗？', () => {
                    for (let i = 1; i <= 7; i++) {
                        scoreData.groups[i.toString()] = 0;
                    }
                    clearHistory(scoreData);
                    saveData(scoreData);
                    
                    document.querySelectorAll('.score-value').forEach(element => {
                        element.textContent = '0';
                        addFeedback(element);
                    });
                    document.querySelectorAll('.score-input').forEach(element => {
                        element.value = '0';
                    });
                });
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
            createSettingsPopup(scoreData, saveData, loadDataToPage);
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
            // 保存所有小组的分数
            const beforeScores = {};
            for (let i = 1; i <= 7; i++) {
                beforeScores[i.toString()] = scoreData.groups[i.toString()] || 0;
            }
            
            for (let i = 1; i <= 7; i++) {
                if (type === 'add') {
                    scoreData.groups[i.toString()] = beforeScores[i.toString()] + value;
                } else {
                    scoreData.groups[i.toString()] = Math.max(0, beforeScores[i.toString()] - value);
                }
            }
            
            // 保存所有小组的新分数
            const afterScores = {};
            for (let i = 1; i <= 7; i++) {
                afterScores[i.toString()] = scoreData.groups[i.toString()] || 0;
            }
            
            addHistoryRecord(scoreData, type + '-all', null, beforeScores, afterScores);
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
function createSettingsPopup(scoreData, saveData, loadDataToPage) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const title = document.createElement('h3');
    title.textContent = '设置';
    popup.appendChild(title);
    

    
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
    
    // 加分值管理
    const scoreValueManagementButton = document.createElement('button');
    scoreValueManagementButton.className = 'popup-button';
    scoreValueManagementButton.textContent = '加分值管理';
    scoreValueManagementButton.addEventListener('click', function() {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            createScoreValueManagementPopup(scoreData, saveData, loadDataToPage, addFeedback);
        }, 400);
    });
    buttonContainer.appendChild(scoreValueManagementButton);
    
    // 查看历史记录
    const historyButton = document.createElement('button');
    historyButton.className = 'popup-button';
    historyButton.textContent = '查看历史记录';
    historyButton.addEventListener('click', function() {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            createHistoryPopup(scoreData, saveData, loadDataToPage, addFeedback);
        }, 400);
    });
    buttonContainer.appendChild(historyButton);
    
    // 评比跳转网址设置
    const evaluationUrlSection = document.createElement('div');
    evaluationUrlSection.style.cssText = 'margin: 15px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;';
    
    const evaluationUrlTitle = document.createElement('h4');
    evaluationUrlTitle.textContent = '评比跳转网址';
    evaluationUrlTitle.style.cssText = 'margin: 0 0 10px 0; font-size: 14px; font-weight: 600;';
    evaluationUrlSection.appendChild(evaluationUrlTitle);
    
    const evaluationUrlInput = document.createElement('input');
    evaluationUrlInput.type = 'text';
    evaluationUrlInput.value = initEvaluationUrlSettings();
    evaluationUrlInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; margin-bottom: 10px;';
    evaluationUrlSection.appendChild(evaluationUrlInput);
    
    const saveEvaluationUrlButton = document.createElement('button');
    saveEvaluationUrlButton.className = 'popup-button';
    saveEvaluationUrlButton.textContent = '保存';
    saveEvaluationUrlButton.style.cssText = 'width: 100%;';
    saveEvaluationUrlButton.addEventListener('click', function() {
        const url = evaluationUrlInput.value.trim();
        if (!url) {
            alert('请输入跳转网址！');
            return;
        }
        
        // URL格式验证
        try {
            new URL(url);
            saveEvaluationUrlSettings(url);
            alert('保存成功！');
        } catch (error) {
            alert('请输入有效的URL格式！');
        }
    });
    evaluationUrlSection.appendChild(saveEvaluationUrlButton);
    popup.appendChild(evaluationUrlSection);
    
    // 性能模式设置
    const performanceSection = document.createElement('div');
    performanceSection.className = 'performance-mode-section';
    
    const performanceTitle = document.createElement('h4');
    performanceTitle.textContent = '性能模式';
    performanceSection.appendChild(performanceTitle);
    
    const performanceToggle = document.createElement('div');
    performanceToggle.className = 'performance-mode-toggle';
    
    const performanceLabel = document.createElement('label');
    performanceLabel.textContent = '启用精简模式（移除动画和特效）';
    performanceLabel.setAttribute('for', 'performance-toggle');
    
    const performanceCheckbox = document.createElement('input');
    performanceCheckbox.type = 'checkbox';
    performanceCheckbox.id = 'performance-toggle';
    performanceCheckbox.checked = isPerformanceModeEnabled;
    performanceCheckbox.addEventListener('change', function() {
        togglePerformanceMode();
        performanceInfoText.textContent = isPerformanceModeEnabled ? '已启用精简模式' : '已禁用精简模式';
    });
    
    performanceToggle.appendChild(performanceLabel);
    performanceToggle.appendChild(performanceCheckbox);
    performanceSection.appendChild(performanceToggle);
    
    const performanceInfo = document.createElement('div');
    performanceInfo.className = 'performance-info';
    
    const performanceInfoText = document.createElement('div');
    performanceInfoText.textContent = isPerformanceModeEnabled ? '已启用精简模式' : '已禁用精简模式';
    performanceInfo.appendChild(performanceInfoText);
    
    const deviceInfoText = document.createElement('div');
    deviceInfoText.className = 'device-info';
    deviceInfoText.textContent = getPerformanceDescription();
    performanceInfo.appendChild(deviceInfoText);
    
    performanceSection.appendChild(performanceInfo);
    popup.appendChild(performanceSection);
    
    // 导出JSON
    const exportButton = document.createElement('button');
    exportButton.className = 'popup-button';
    exportButton.textContent = '导出JSON';
    exportButton.addEventListener('click', function() {
        // 包含壁纸设置信息
        const wallpaperSettings = initWallpaperSettings();
        const exportData = {
            groups: scoreData.groups,
            wallpaper: wallpaperSettings,
            history: scoreData.history
        };
        const dataStr = JSON.stringify(exportData, null, 2);
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
                        // 保留原有的历史记录结构
                        if (!scoreData.history) {
                            scoreData.history = [];
                        }
                        // 更新 groups 数据
                        scoreData.groups = importedData.groups;
                        // 如果导入的数据包含历史记录，也保留它
                        if (importedData.history) {
                            scoreData.history = importedData.history;
                        }
                        saveData(scoreData);
                        loadDataToPage(scoreData);
                        // 导入壁纸设置
                        if (importedData.wallpaper) {
                            saveWallpaperSettings(importedData.wallpaper);
                            applyWallpaper(importedData.wallpaper);
                        }
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

function createConfirmPopup(titleText, message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const title = document.createElement('h3');
    title.textContent = titleText;
    popup.appendChild(title);
    
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.cssText = 'margin: 15px 0; font-size: 16px; text-align: center;';
    popup.appendChild(messageElement);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-button';
    cancelButton.textContent = '取消';
    cancelButton.style.cssText = 'background: #e0e0e0; color: #333;';
    cancelButton.addEventListener('click', () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        }, 400);
    });
    buttonContainer.appendChild(cancelButton);
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'popup-button';
    confirmButton.textContent = '确定';
    confirmButton.addEventListener('click', () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        }, 400);
    });
    buttonContainer.appendChild(confirmButton);
    
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    
    const handleScroll = (e) => {
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

// 创建评比结果弹窗
function createEvaluateResultPopup(message, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const title = document.createElement('h3');
    title.textContent = '评比结果';
    popup.appendChild(title);
    
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.cssText = 'margin: 15px 0; font-size: 16px; text-align: center;';
    popup.appendChild(messageElement);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const okButton = document.createElement('button');
    okButton.className = 'popup-button';
    okButton.textContent = '确定';
    okButton.addEventListener('click', () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            if (onClose) onClose();
        }, 400);
    });
    buttonContainer.appendChild(okButton);
    
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    
    const handleScroll = (e) => {
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

// 创建历史记录弹窗
function createHistoryPopup(scoreData, saveData, loadDataToPage, addFeedback) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const title = document.createElement('h3');
    title.textContent = '操作历史';
    popup.appendChild(title);
    
    // 历史记录内容区域
    const historyContent = document.createElement('div');
    historyContent.style.cssText = 'max-height: 400px; overflow-y: auto; margin: 15px 0; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px;';
    
    if (!scoreData.history || scoreData.history.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = '暂无历史记录';
        emptyMessage.style.cssText = 'text-align: center; padding: 40px; color: #999;';
        historyContent.appendChild(emptyMessage);
    } else {
        // 反向遍历历史记录，最新的在最上面
        for (let i = scoreData.history.length - 1; i >= 0; i--) {
            const record = scoreData.history[i];
            const recordIndex = i;
            
            const recordItem = document.createElement('div');
            recordItem.style.cssText = 'padding: 12px; border-bottom: 1px solid #f0f0f0;';
            if (i > 0) recordItem.style.borderTop = 'none';
            
            // 操作类型和小组
            const actionInfo = document.createElement('div');
            actionInfo.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
            
            const groupName = record.group === null ? '全员' : `小组 ${record.group}`;
            actionInfo.textContent = `${formatActionType(record.type)} - ${groupName}`;
            recordItem.appendChild(actionInfo);
            
            // 时间
            const timeInfo = document.createElement('div');
            timeInfo.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 4px;';
            timeInfo.textContent = formatTimestamp(record.timestamp);
            recordItem.appendChild(timeInfo);
            
            // 分数变化
            const scoreChange = document.createElement('div');
            scoreChange.style.cssText = 'font-size: 14px; color: #333;';
            
            if (record.group === null) {
                // 全员操作，显示简要信息
                scoreChange.textContent = '所有小组分数已更新';
            } else {
                scoreChange.textContent = `${record.before} → ${record.after}`;
            }
            recordItem.appendChild(scoreChange);
            
            // 撤销按钮
            const undoButton = document.createElement('button');
            undoButton.className = 'popup-button';
            undoButton.textContent = '撤销';
            undoButton.style.cssText = 'margin-top: 8px; padding: 4px 12px; font-size: 12px; background: #ff9800;';
            undoButton.addEventListener('click', function() {
                createConfirmPopup('确认撤销', '确定要撤销这条操作吗？', function() {
                    if (undoHistoryRecord(scoreData, recordIndex, saveData, loadDataToPage, addFeedback)) {
                        // 重新创建新的历史记录弹窗
                        overlay.classList.add('closing');
                        popup.classList.add('closing');
                        setTimeout(() => {
                            document.body.removeChild(overlay);
                            createHistoryPopup(scoreData, saveData, loadDataToPage, addFeedback);
                        }, 400);
                    }
                });
            });
            recordItem.appendChild(undoButton);
            
            historyContent.appendChild(recordItem);
        }
    }
    
    popup.appendChild(historyContent);
    
    // 关闭按钮
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-button';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', function() {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 400);
    });
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
        createEvaluateResultPopup(`小组 ${winningGroup} 得分最高，分数为 ${maxScore}！`, () => {
            for (let i = 1; i <= 7; i++) {
                scoreData.groups[i.toString()] = 0;
            }
            clearHistory(scoreData);
            saveData(scoreData);
            
            document.querySelectorAll('.score-value').forEach(element => {
                element.textContent = '0';
                addFeedback(element);
            });
            document.querySelectorAll('.score-input').forEach(element => {
                element.value = '0';
            });
            
            setTimeout(() => {
                const evaluationUrl = initEvaluationUrlSettings();
                window.location.href = evaluationUrl;
            }, 1000);
        });
    } else {
        createEvaluateResultPopup('没有可评比的分数！');
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
