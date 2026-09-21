// 班级积分管理系统
// 版本: 1.6.0

// 存储键名
const STORAGE_KEY = 'classScoreSystem';
const WALLPAPER_STORAGE_KEY = 'wallpaperSettings';
const PERFORMANCE_MODE_KEY = 'classScoreSystem_performanceMode';
const IMPECCABLE_MODE_KEY = 'classScoreSystem_impeccableMode';
const LAST_VIEW_VERSION_KEY = 'classScoreSystem_LastViewVersion';
const CURRENT_VERSION = '1.6.0';

// 数据版本与小组数量配置
const DATA_VERSION = 2;
const DEFAULT_GROUP_COUNT = 7;
const MIN_GROUP_COUNT = 1;
const MAX_GROUP_COUNT = 20;

// GitHub Gist 云端备份配置
const GITHUB_TOKEN_KEY = 'classScoreSystem_githubToken';
const GIST_ID_KEY = 'classScoreSystem_gistId';
const GIST_BACKUP_TIME_KEY = 'classScoreSystem_gistBackupTime';
const GIST_API_URL = 'https://api.github.com/gists';

// 获取 GitHub Token
function getGitHubToken() {
    return localStorage.getItem(GITHUB_TOKEN_KEY);
}

// 设置 GitHub Token
function setGitHubToken(token) {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
}

// 检查是否已配置 Token
function isTokenConfigured() {
    return !!getGitHubToken();
}

// GitHub Gist API 函数
async function createGist(token, content) {
    const response = await fetch(GIST_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            description: '班级积分管理系统备份',
            public: false,
            files: {
                'class-score-backup.json': {
                    content: content
                }
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '创建 Gist 失败');
    }
    
    const data = await response.json();
    return data.id;
}

async function updateGist(token, gistId, content) {
    const response = await fetch(`${GIST_API_URL}/${gistId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            description: '班级积分管理系统备份',
            files: {
                'class-score-backup.json': {
                    content: content
                }
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '更新 Gist 失败');
    }
    
    const data = await response.json();
    return data.id;
}

async function fetchGist(token, gistId) {
    const response = await fetch(`${GIST_API_URL}/${gistId}`, {
        headers: {
            'Authorization': `token ${token}`
        }
    });
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('未找到云端备份，请先备份数据');
        }
        const error = await response.json();
        throw new Error(error.message || '获取 Gist 失败');
    }
    
    const data = await response.json();
    
    if (!data.files || !data.files['class-score-backup.json']) {
        throw new Error('Gist 文件格式错误');
    }
    
    return JSON.parse(data.files['class-score-backup.json'].content);
}

function handleGistError(error, defaultMessage) {
    if (error.message.includes('401') || error.message.includes('Bad credentials')) {
        return 'Token 无效，请检查 Token 是否正确';
    } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        return '未找到云端备份，请先备份数据';
    } else if (error.message.includes('403') || error.message.includes('rate limit')) {
        return 'API 配额超限，请稍后再试';
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        return '网络错误，请检查网络连接';
    }
    return defaultMessage || error.message || '未知错误';
}

// 备份到云端
async function backupToCloud() {
    try {
        const existingData = localStorage.getItem(STORAGE_KEY);
        let parsedData = null;
        if (existingData) {
            try {
                parsedData = JSON.parse(existingData);
            } catch (error) {
                parsedData = null;
            }
        }
        const scoreData = migrateData(parsedData);
        const wallpaperSettings = JSON.parse(localStorage.getItem(WALLPAPER_STORAGE_KEY) || '{}');
        
        const backupData = {
            version: scoreData.version,
            appVersion: CURRENT_VERSION,
            backupTime: new Date().toISOString(),
            groupCount: scoreData.groupCount,
            groups: scoreData.groups,
            rules: scoreData.rules,
            history: scoreData.history || [],
            wallpaper: wallpaperSettings
        };
        
        const content = JSON.stringify(backupData, null, 2);
        const gistId = localStorage.getItem(GIST_ID_KEY);
        const token = getGitHubToken();
        
        if (!token) {
            return { success: false, error: '请先在设置中配置 GitHub Token' };
        }
        
        if (gistId) {
            await updateGist(token, gistId, content);
        } else {
            const newGistId = await createGist(token, content);
            localStorage.setItem(GIST_ID_KEY, newGistId);
        }
        
        localStorage.setItem(GIST_BACKUP_TIME_KEY, new Date().toISOString());
        
        return { success: true, gistId: gistId || localStorage.getItem(GIST_ID_KEY) };
    } catch (error) {
        return { success: false, error: handleGistError(error, '备份失败') };
    }
}

// 从云端恢复
async function restoreFromCloud() {
    try {
        const gistId = localStorage.getItem(GIST_ID_KEY);
        if (!gistId) {
            return { success: false, error: '未找到云端备份记录，请先备份数据' };
        }
        
        const token = getGitHubToken();
        if (!token) {
            return { success: false, error: '请先在设置中配置 GitHub Token' };
        }
        
        const backupData = await fetchGist(token, gistId);
        
        if (!backupData || !backupData.groups) {
            return { success: false, error: '云端数据格式错误' };
        }
        
        // 恢复走迁移，兼容旧版本备份（无 version/groupCount/rules/members）
        const migratedData = migrateData(backupData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
        
        if (backupData.wallpaper) {
            localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(backupData.wallpaper));
        }
        
        return { success: true, backupTime: backupData.backupTime };
    } catch (error) {
        return { success: false, error: handleGistError(error, '恢复失败') };
    }
}

// Toast 提示函数
function showToast(message, type = 'info', duration = 3000) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    
    const bgColors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        info: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: ${bgColors[type] || bgColors.info};
        color: white;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 100000;
        animation: toastSlideIn 0.3s ease-out;
        max-width: 90%;
        text-align: center;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes toastSlideIn {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        @keyframes toastSlideOut {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 300);
    }, duration);
}

// 获取云端备份状态
function getCloudBackupStatus() {
    const tokenConfigured = isTokenConfigured();
    const gistId = localStorage.getItem(GIST_ID_KEY);
    const backupTime = localStorage.getItem(GIST_BACKUP_TIME_KEY);
    
    if (!tokenConfigured) {
        return { status: 'not_configured', message: '未配置 Token' };
    }
    
    if (!gistId) {
        return { status: 'not_backed_up', message: '未备份' };
    }
    
    if (backupTime) {
        const date = new Date(backupTime);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        return { status: 'backed_up', message: `已备份 (${dateStr})` };
    }
    
    return { status: 'backed_up', message: '已备份' };
}

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

// Impeccable 精致模式相关（默认关闭，需在设置中手动开启）
let isImpeccableModeEnabled = false;

// 初始化 Impeccable 精致模式
function initImpeccableMode() {
    const savedMode = localStorage.getItem(IMPECCABLE_MODE_KEY);
    isImpeccableModeEnabled = savedMode === 'true';
    applyImpeccableMode(isImpeccableModeEnabled);
    return isImpeccableModeEnabled;
}

// 应用 Impeccable 精致模式
function applyImpeccableMode(enabled) {
    if (enabled) {
        document.body.classList.add('impeccable-mode');
    } else {
        document.body.classList.remove('impeccable-mode');
    }
    isImpeccableModeEnabled = enabled;
}

// 切换 Impeccable 精致模式
function toggleImpeccableMode() {
    const newMode = !isImpeccableModeEnabled;
    applyImpeccableMode(newMode);
    localStorage.setItem(IMPECCABLE_MODE_KEY, newMode.toString());
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
        version: '1.6.0',
        date: '2026-09-21',
        changes: [
            '【新增功能】设置弹窗改为顶部标签页，分为「界面与显示」「计分与小组」「备份与数据」「关于」四类',
            '【功能优化】贡献榜移到主界面顶部控制栏，设置弹窗内不再显示贡献榜按钮',
            '【界面优化】新增标签页样式，窄屏下标签可横向滚动或换行，面板不溢出'
        ]
    },
    {
        version: '1.5.2',
        date: '2026-09-21',
        changes: [
            '【新增功能】新增 Impeccable 精致模式开关，默认关闭，可在设置中开启专属精致界面（玻璃质感、光影与微交互）',
            '【功能优化】Impeccable 精致模式与性能模式相互独立，性能模式开启时仍保持精简'
        ]
    },
    {
        version: '1.5.1',
        date: '2026-09-21',
        changes: [
            '【版本更新】更新系统版本至1.5.1',
            '【功能优化】移除设置中无效的外部链接配置项（软件版不可用）',
            '【功能优化】小组卡片「增加/减少」改为两步计分：先选「小组/成员」，再选规则或自定义分值',
            '【功能优化】选择成员计分时，小组分数与该成员贡献等量变化（可为负）',
            '【功能优化】保留成员管理中的快捷计分入口，小组无成员时给出提示'
        ]
    },
    {
        version: '1.5.0',
        date: '2026-09-21',
        changes: [
            '【版本更新】更新系统版本至1.5.0',
            '【新增功能】支持自定义小组数量（1-20）与小组成员名称，小组卡片动态渲染',
            '【新增功能】新增计分规则管理，可自定义规则名称与分值（分值可正可负）',
            '【新增功能】计分弹窗改为规则列表 + 自定义分值，移除预设分值按钮',
            '【新增功能】新增成员管理，可设置每组人数、录入成员名字，未录入时显示坐标',
            '【新增功能】新增成员贡献系统与贡献榜（组内榜 + 跨组榜）',
            '【功能优化】小组分数允许为负数，撤销时同步还原成员贡献',
            '【数据兼容】数据结构升级为 v2，自动迁移旧数据；云备份与导出/导入兼容新结构'
        ]
    },
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
// 创建默认成员对象（未录入名字时以坐标显示）
function createMember(group, row) {
    return {
        id: `m_${group}_${row}`,
        name: '',
        col: 1,
        row: row,
        contribution: 0
    };
}

// 创建默认小组对象
function createDefaultGroup(index) {
    return {
        name: `小组 ${index}`,
        score: 0,
        members: []
    };
}

// 生成 n 个默认小组
function createDefaultGroups(count) {
    const groups = {};
    for (let i = 1; i <= count; i++) {
        groups[i.toString()] = createDefaultGroup(i);
    }
    return groups;
}

// 创建默认数据（v2）
function createDefaultData() {
    return {
        version: DATA_VERSION,
        groupCount: DEFAULT_GROUP_COUNT,
        groups: createDefaultGroups(DEFAULT_GROUP_COUNT),
        rules: [],
        history: []
    };
}

// 迁移单个成员
function migrateMember(raw, index) {
    const member = (raw && typeof raw === 'object') ? raw : {};
    const row = parseInt(member.row, 10) || (index + 1);
    const col = parseInt(member.col, 10) || 1;
    return {
        id: member.id || `m_${col}_${row}`,
        name: typeof member.name === 'string' ? member.name : '',
        col: col,
        row: row,
        contribution: Number(member.contribution) || 0
    };
}

// 迁移单个小组（兼容旧格式的数字分数）
function migrateGroup(raw, index) {
    if (raw && typeof raw === 'object') {
        return {
            name: (typeof raw.name === 'string' && raw.name) ? raw.name : `小组 ${index}`,
            score: Number(raw.score) || 0,
            members: Array.isArray(raw.members) ? raw.members.map((m, i) => migrateMember(m, i)) : []
        };
    }
    return {
        name: `小组 ${index}`,
        score: Number(raw) || 0,
        members: []
    };
}

// 迁移任意版本的存储数据到 v2（幂等，可重复调用）
function migrateData(oldData) {
    const data = (oldData && typeof oldData === 'object') ? oldData : {};

    let groupCount = parseInt(data.groupCount, 10);
    if (isNaN(groupCount) || groupCount < MIN_GROUP_COUNT) {
        const keys = data.groups ? Object.keys(data.groups) : [];
        groupCount = keys.length || DEFAULT_GROUP_COUNT;
    }
    groupCount = Math.min(Math.max(groupCount, MIN_GROUP_COUNT), MAX_GROUP_COUNT);

    const groups = {};
    for (let i = 1; i <= groupCount; i++) {
        const key = i.toString();
        groups[key] = migrateGroup(data.groups ? data.groups[key] : undefined, i);
    }

    return {
        version: DATA_VERSION,
        groupCount: groupCount,
        groups: groups,
        rules: Array.isArray(data.rules) ? data.rules : [],
        history: Array.isArray(data.history) ? data.history : []
    };
}

// 数据访问辅助函数
function getGroup(data, group) {
    return data && data.groups ? data.groups[group] : undefined;
}

function getGroupCount(data) {
    if (data && data.groupCount) {
        return data.groupCount;
    }
    return data && data.groups ? Object.keys(data.groups).length : 0;
}

function getGroupScore(data, group) {
    const g = getGroup(data, group);
    return g ? (Number(g.score) || 0) : 0;
}

function setGroupScore(data, group, score) {
    let g = getGroup(data, group);
    if (!g) {
        g = createDefaultGroup(parseInt(group, 10) || 1);
        data.groups[group] = g;
    }
    g.score = Number(score) || 0;
}

function getGroupName(data, group) {
    const g = getGroup(data, group);
    return (g && g.name) ? g.name : `小组 ${group}`;
}

function getGroupMembers(data, group) {
    const g = getGroup(data, group);
    return (g && Array.isArray(g.members)) ? g.members : [];
}

// 成员显示名：未录入名字时使用坐标
function getMemberDisplayName(member) {
    if (!member) return '';
    const name = typeof member.name === 'string' ? member.name.trim() : '';
    if (name) return name;
    return `${member.col || 1}列${member.row || 1}行`;
}

// 读取成员贡献值
function getMemberContribution(member) {
    return member ? (Number(member.contribution) || 0) : 0;
}

// 设置成员贡献值
function setMemberContribution(member, value) {
    if (member) {
        member.contribution = Number(value) || 0;
    }
}

// 创建规则对象
function createRule(name, value) {
    return {
        id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name,
        value: value
    };
}

// 读取规则列表
function getRules(data) {
    return (data && Array.isArray(data.rules)) ? data.rules : [];
}

// 初始化数据（含旧数据自动迁移）
function initData() {
    const existingData = localStorage.getItem(STORAGE_KEY);
    let data = null;
    if (existingData) {
        try {
            data = JSON.parse(existingData);
        } catch (error) {
            data = null;
        }
    }
    const migrated = migrateData(data);
    // 仅在首次使用或需要迁移时写回，避免重复迁移/重置
    if (!data || data.version !== DATA_VERSION) {
        saveData(migrated);
    }
    return migrated;
}

// 添加历史记录
function addHistoryRecord(scoreData, type, group, before, after, extra) {
    const record = {
        type: type,
        group: group,
        before: before,
        after: after,
        timestamp: Date.now()
    };
    // 规则来源与成员归属（规则计分 / 成员贡献计分）
    if (extra && typeof extra === 'object') {
        if (extra.ruleName) record.ruleName = extra.ruleName;
        if (extra.memberId) record.memberId = extra.memberId;
        if (extra.memberName) record.memberName = extra.memberName;
        if (typeof extra.beforeContribution === 'number') record.beforeContribution = extra.beforeContribution;
        if (typeof extra.afterContribution === 'number') record.afterContribution = extra.afterContribution;
    }
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
        'subtract-all': '全员减分',
        'add-member': '成员加分',
        'subtract-member': '成员减分'
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
    if (record.group === null || record.group === undefined) {
        // 全员操作，恢复所有小组
        if (record.before && typeof record.before === 'object') {
            Object.keys(record.before).forEach(function(groupKey) {
                setGroupScore(scoreData, groupKey, record.before[groupKey]);
            });
        }
    } else {
        // 单个小组操作
        setGroupScore(scoreData, record.group, record.before);

        // 因个人加减分：同时还原该成员贡献值
        if (record.memberId) {
            const member = getGroupMembers(scoreData, record.group).find(item => item.id === record.memberId);
            if (member) {
                const restoredContribution = (typeof record.beforeContribution === 'number')
                    ? record.beforeContribution
                    : getMemberContribution(member) - (record.after - record.before);
                setMemberContribution(member, restoredContribution);
            }
        }
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
        const groupScore = getGroupScore(data, groupNumber);
        const nameElement = group.querySelector('h2');
        const scoreElement = group.querySelector('.score-value');
        const inputElement = group.querySelector('.score-input');
        const membersButton = group.querySelector('.score-members');
        if (nameElement) nameElement.textContent = getGroupName(data, groupNumber);
        if (scoreElement) scoreElement.textContent = groupScore;
        if (inputElement) inputElement.value = groupScore;
        if (membersButton) membersButton.textContent = `成员 (${getGroupMembers(data, groupNumber).length})`;
    });
}

// 渲染小组卡片（按 groupCount 动态生成）
function renderGroups(data) {
    const container = document.querySelector('.score-container');
    if (!container) return;
    container.innerHTML = '';
    const groupCount = getGroupCount(data);
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= groupCount; i++) {
        fragment.appendChild(createGroupCard(data, i.toString()));
    }
    container.appendChild(fragment);
}

// 创建单个小组卡片
function createGroupCard(data, group) {
    const section = document.createElement('section');
    section.className = 'score-group';
    section.dataset.group = group;

    const title = document.createElement('h2');
    title.textContent = getGroupName(data, group);
    section.appendChild(title);

    const display = document.createElement('div');
    display.className = 'score-display';

    const scoreValue = document.createElement('span');
    scoreValue.className = 'score-value';
    scoreValue.textContent = getGroupScore(data, group);
    display.appendChild(scoreValue);

    const scoreInput = document.createElement('input');
    scoreInput.type = 'number';
    scoreInput.className = 'score-input';
    scoreInput.value = getGroupScore(data, group);
    display.appendChild(scoreInput);

    const saveButton = document.createElement('button');
    saveButton.className = 'score-save';
    saveButton.textContent = '保存';
    display.appendChild(saveButton);

    section.appendChild(display);

    const controls = document.createElement('div');
    controls.className = 'score-controls';

    const addButton = document.createElement('button');
    addButton.className = 'score-add';
    addButton.textContent = '增加';
    controls.appendChild(addButton);

    const subtractButton = document.createElement('button');
    subtractButton.className = 'score-subtract';
    subtractButton.textContent = '减少';
    controls.appendChild(subtractButton);

    const resetButton = document.createElement('button');
    resetButton.className = 'score-reset';
    resetButton.textContent = '重置';
    controls.appendChild(resetButton);

    section.appendChild(controls);

    const membersButton = document.createElement('button');
    membersButton.className = 'score-members';
    membersButton.textContent = `成员 (${getGroupMembers(data, group).length})`;
    section.appendChild(membersButton);

    return section;
}

// 添加操作反馈
function addFeedback(element) {
    element.classList.add('updated');
    setTimeout(() => element.classList.remove('updated'), 500);
}

// 更新单个小组卡片的分数显示
function updateGroupCardScore(group, score, addFeedback) {
    const scoreGroup = document.querySelector(`.score-group[data-group="${group}"]`);
    if (!scoreGroup) return;
    const scoreElement = scoreGroup.querySelector('.score-value');
    const inputElement = scoreGroup.querySelector('.score-input');
    if (scoreElement) {
        scoreElement.textContent = score;
        if (addFeedback) addFeedback(scoreElement);
    }
    if (inputElement) {
        inputElement.value = score;
    }
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

// 构建（规则列表 + 自定义分值）计分面板
// onApply(delta, meta)：delta 为分值增量，meta 为规则来源信息（自定义分值时为 null）
function createScoreOptionsPanel(scoreData, defaultDirection, onApply) {
    const panel = document.createElement('div');

    const rulesTitle = document.createElement('h4');
    rulesTitle.className = 'settings-subtitle';
    rulesTitle.textContent = '规则计分';
    panel.appendChild(rulesTitle);

    const ruleList = document.createElement('div');
    ruleList.className = 'rule-list';

    const rules = getRules(scoreData);
    if (rules.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'member-empty';
        empty.textContent = '暂无规则，可在设置中添加';
        ruleList.appendChild(empty);
    } else {
        rules.forEach(rule => {
            const ruleValue = Number(rule.value) || 0;
            const ruleButton = document.createElement('button');
            ruleButton.className = 'popup-button';
            ruleButton.style.cssText = 'width: 100%; margin: 4px 0; display: flex; justify-content: space-between; align-items: center;';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = rule.name;
            ruleButton.appendChild(nameSpan);

            const valueSpan = document.createElement('span');
            valueSpan.textContent = ruleValue > 0 ? `+${ruleValue}` : `${ruleValue}`;
            valueSpan.style.cssText = `font-weight: 600; color: ${ruleValue >= 0 ? '#10b981' : '#ef4444'};`;
            ruleButton.appendChild(valueSpan);

            ruleButton.addEventListener('click', () => {
                onApply(ruleValue, { ruleName: rule.name });
            });
            ruleList.appendChild(ruleButton);
        });
    }
    panel.appendChild(ruleList);

    const customSection = document.createElement('div');
    customSection.className = 'settings-section';

    const customTitle = document.createElement('h4');
    customTitle.className = 'settings-subtitle';
    customTitle.textContent = '自定义分值';
    customSection.appendChild(customTitle);

    const customRow = document.createElement('div');
    customRow.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    const directionSelect = document.createElement('select');
    directionSelect.className = 'settings-input';
    directionSelect.style.cssText = 'flex: 0 0 90px; margin-bottom: 0;';

    const addOption = document.createElement('option');
    addOption.value = 'add';
    addOption.textContent = '加分';
    directionSelect.appendChild(addOption);

    const subtractOption = document.createElement('option');
    subtractOption.value = 'subtract';
    subtractOption.textContent = '减分';
    directionSelect.appendChild(subtractOption);
    directionSelect.value = defaultDirection === 'subtract' ? 'subtract' : 'add';
    customRow.appendChild(directionSelect);

    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.className = 'settings-input';
    valueInput.min = '1';
    valueInput.step = '1';
    valueInput.placeholder = '分值';
    valueInput.style.cssText = 'flex: 1 1 auto; min-width: 0; margin-bottom: 0;';
    customRow.appendChild(valueInput);

    const confirmButton = document.createElement('button');
    confirmButton.className = 'popup-button';
    confirmButton.textContent = '确定';
    confirmButton.style.cssText = 'flex: 0 0 auto; margin: 0;';
    customRow.appendChild(confirmButton);

    const applyCustom = () => {
        const magnitude = parseInt(valueInput.value, 10);
        if (isNaN(magnitude) || magnitude < 1) {
            alert('请输入大于 0 的有效分值！');
            return;
        }
        const delta = directionSelect.value === 'subtract' ? -magnitude : magnitude;
        onApply(delta, null);
    };

    valueInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyCustom();
    });
    confirmButton.addEventListener('click', applyCustom);

    customSection.appendChild(customRow);
    panel.appendChild(customSection);

    return panel;
}

// 创建（规则驱动的）小组计分弹出层
function createPopup(type, group, scoreData, saveData, loadDataToPage, addFeedback) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    // 使用文档片段批量创建DOM元素，减少重排重绘
    const fragment = document.createDocumentFragment();
    
    const closePopup = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 400);
    };

    const applyScore = (delta, meta) => {
        if (!delta) return;
        const beforeScore = getGroupScore(scoreData, group);
        setGroupScore(scoreData, group, beforeScore + delta);
        const afterScore = getGroupScore(scoreData, group);
        addHistoryRecord(scoreData, delta > 0 ? 'add' : 'subtract', group, beforeScore, afterScore, meta);
        saveData(scoreData);
        updateGroupCardScore(group, afterScore, addFeedback);
        closePopup();
    };

    const title = document.createElement('h3');
    title.textContent = `计分 - ${getGroupName(scoreData, group)}`;
    fragment.appendChild(title);

    fragment.appendChild(createScoreOptionsPanel(scoreData, type, applyScore));

    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', closePopup);
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

// 创建规则管理弹出层（新增 / 编辑 / 删除计分规则）
function createRuleManagementPopup(scoreData, saveData) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'popup';

    const title = document.createElement('h3');
    title.textContent = '规则管理';
    popup.appendChild(title);

    const closePopup = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 400);
    };

    // 规则列表
    const listSection = document.createElement('div');
    listSection.className = 'settings-section';

    const listTitle = document.createElement('h4');
    listTitle.className = 'settings-subtitle';
    listTitle.textContent = '现有规则';
    listSection.appendChild(listTitle);

    const ruleListContainer = document.createElement('div');
    ruleListContainer.className = 'rule-list';
    listSection.appendChild(ruleListContainer);

    const renderRuleList = () => {
        ruleListContainer.innerHTML = '';
        const rules = getRules(scoreData);
        if (rules.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'member-empty';
            empty.textContent = '暂无规则，请在下方添加';
            ruleListContainer.appendChild(empty);
            return;
        }
        rules.forEach(rule => {
            const row = document.createElement('div');
            row.className = 'member-item';

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'member-name-input';
            nameInput.value = rule.name;
            row.appendChild(nameInput);

            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.className = 'member-name-input';
            valueInput.style.cssText = 'flex: 0 0 80px; min-width: 0;';
            valueInput.value = rule.value;
            row.appendChild(valueInput);

            const saveButton = document.createElement('button');
            saveButton.className = 'popup-button';
            saveButton.textContent = '保存';
            saveButton.style.cssText = 'flex: 0 0 auto; margin: 0; padding: 6px 10px; font-size: 13px;';
            saveButton.addEventListener('click', () => {
                const name = nameInput.value.trim();
                const value = parseInt(valueInput.value, 10);
                if (!name) {
                    alert('请输入规则名称！');
                    return;
                }
                if (isNaN(value) || value === 0) {
                    alert('请输入有效分值（不能为 0，可为负数）！');
                    return;
                }
                rule.name = name;
                rule.value = value;
                saveData(scoreData);
                renderRuleList();
                showToast('✅ 规则已更新', 'success');
            });
            row.appendChild(saveButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'popup-button';
            deleteButton.textContent = '删除';
            deleteButton.style.cssText = 'flex: 0 0 auto; margin: 0; padding: 6px 10px; font-size: 13px; background: #ef4444; color: white;';
            deleteButton.addEventListener('click', () => {
                createConfirmPopup('确认删除', `确定要删除规则"${rule.name}"吗？`, () => {
                    const rules = getRules(scoreData);
                    const index = rules.findIndex(r => r.id === rule.id);
                    if (index > -1) {
                        rules.splice(index, 1);
                    }
                    saveData(scoreData);
                    renderRuleList();
                    showToast('✅ 规则已删除', 'success');
                });
            });
            row.appendChild(deleteButton);

            ruleListContainer.appendChild(row);
        });
    };

    renderRuleList();
    popup.appendChild(listSection);

    // 新增规则
    const addSection = document.createElement('div');
    addSection.className = 'settings-section';

    const addTitle = document.createElement('h4');
    addTitle.className = 'settings-subtitle';
    addTitle.textContent = '新增规则';
    addSection.appendChild(addTitle);

    const addRow = document.createElement('div');
    addRow.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    const newNameInput = document.createElement('input');
    newNameInput.type = 'text';
    newNameInput.className = 'settings-input';
    newNameInput.placeholder = '规则名称（如：认真听讲）';
    newNameInput.style.cssText = 'flex: 1 1 auto; min-width: 0; margin-bottom: 0;';
    addRow.appendChild(newNameInput);

    const newValueInput = document.createElement('input');
    newValueInput.type = 'number';
    newValueInput.className = 'settings-input';
    newValueInput.placeholder = '分值';
    newValueInput.style.cssText = 'flex: 0 0 90px; margin-bottom: 0;';
    addRow.appendChild(newValueInput);

    const addButton = document.createElement('button');
    addButton.className = 'popup-button';
    addButton.textContent = '添加';
    addButton.style.cssText = 'flex: 0 0 auto; margin: 0;';
    addButton.addEventListener('click', () => {
        const name = newNameInput.value.trim();
        const value = parseInt(newValueInput.value, 10);
        if (!name) {
            alert('请输入规则名称！');
            return;
        }
        if (isNaN(value) || value === 0) {
            alert('请输入有效分值（不能为 0，可为负数）！');
            return;
        }
        const rules = getRules(scoreData);
        rules.push(createRule(name, value));
        saveData(scoreData);
        newNameInput.value = '';
        newValueInput.value = '';
        renderRuleList();
        showToast('✅ 规则已添加', 'success');
    });
    addRow.appendChild(addButton);

    newValueInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addButton.click();
    });

    addSection.appendChild(addRow);
    popup.appendChild(addSection);

    const closeButton = document.createElement('button');
    closeButton.className = 'popup-cancel';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', closePopup);
    popup.appendChild(closeButton);

    overlay.appendChild(popup);

    const handleScroll = (e) => {
        if (popup.scrollHeight <= popup.clientHeight) {
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
    
    // 初始化 Impeccable 精致模式（默认关闭）
    initImpeccableMode();
    
    const wallpaperSettings = initWallpaperSettings();
    if (!isPerformanceModeEnabled) {
        applyWallpaper(wallpaperSettings);
    }
    
    let scoreData = initData();
    
    renderGroups(scoreData);
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
                createScopeChoicePopup('add', group, scoreData, saveData, loadDataToPage, addFeedback);
            } else if (target.classList.contains('score-subtract')) {
                createScopeChoicePopup('subtract', group, scoreData, saveData, loadDataToPage, addFeedback);
            } else if (target.classList.contains('score-reset')) {
                createConfirmPopup('确认重置', '确定要重置该小组的积分吗？', () => {
                    const beforeScore = getGroupScore(scoreData, group);
                    setGroupScore(scoreData, group, 0);
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
            } else if (target.classList.contains('score-members')) {
                createMemberManagementPopup(scoreData, group, saveData, loadDataToPage);
            } else if (target.classList.contains('score-save')) {
                const inputElement = scoreGroup.querySelector('.score-input');
                const scoreValue = parseInt(inputElement.value);
                
                if (isNaN(scoreValue)) {
                    alert('请输入有效的整数！');
                    inputElement.value = getGroupScore(scoreData, group);
                    return;
                }
                
                if (scoreValue >= 1000) {
                    alert('积分值不能大于等于1000！');
                    inputElement.value = getGroupScore(scoreData, group);
                    return;
                }
                
                const beforeScore = getGroupScore(scoreData, group);
                setGroupScore(scoreData, group, scoreValue);
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
                    const groupCount = getGroupCount(scoreData);
                    for (let i = 1; i <= groupCount; i++) {
                        setGroupScore(scoreData, i.toString(), 0);
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
            } else if (target.classList.contains('contribution-rank')) {
                createContributionRankPopup(scoreData);
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

// 创建（规则驱动的）全员计分弹出层
function createGlobalPopup(type, scoreData, saveData, loadDataToPage, addFeedback) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'popup';

    const title = document.createElement('h3');
    title.textContent = '全员计分';
    popup.appendChild(title);

    const closePopup = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 400);
    };

    const applyScore = (delta, meta) => {
        if (!delta) return;
        const groupCount = getGroupCount(scoreData);

        const beforeScores = {};
        for (let i = 1; i <= groupCount; i++) {
            beforeScores[i.toString()] = getGroupScore(scoreData, i.toString());
        }

        for (let i = 1; i <= groupCount; i++) {
            const key = i.toString();
            setGroupScore(scoreData, key, beforeScores[key] + delta);
        }

        const afterScores = {};
        for (let i = 1; i <= groupCount; i++) {
            afterScores[i.toString()] = getGroupScore(scoreData, i.toString());
        }

        addHistoryRecord(scoreData, delta > 0 ? 'add-all' : 'subtract-all', null, beforeScores, afterScores, meta);
        saveData(scoreData);

        for (let i = 1; i <= groupCount; i++) {
            const key = i.toString();
            updateGroupCardScore(key, getGroupScore(scoreData, key), addFeedback);
        }
        closePopup();
    };

    popup.appendChild(createScoreOptionsPanel(scoreData, type, applyScore));

    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', closePopup);
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

// 应用新的小组数量（保留 1~newCount，删除多余小组数据）
function applyGroupCount(data, newCount) {
    const groups = data.groups || {};
    const nextGroups = {};
    for (let i = 1; i <= newCount; i++) {
        const key = i.toString();
        nextGroups[key] = groups[key] || createDefaultGroup(i);
    }
    data.groups = nextGroups;
    data.groupCount = newCount;
}

// 设置小组成员数量（增加时补全末尾成员，减少时删除末尾成员）
function setMemberCount(data, group, count) {
    const g = getGroup(data, group);
    if (!g) return;
    if (!Array.isArray(g.members)) {
        g.members = [];
    }
    const members = g.members;
    if (count > members.length) {
        for (let i = members.length; i < count; i++) {
            members.push(createMember(group, i + 1));
        }
    } else if (count < members.length) {
        members.splice(count);
    }
}

// 创建小组设置弹出层（小组数量 + 小组名称）
function createGroupSettingsPopup(scoreData, saveData, loadDataToPage) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'popup';

    const title = document.createElement('h3');
    title.textContent = '小组设置';
    popup.appendChild(title);

    const closePopup = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 400);
    };

    // 小组数量
    const countSection = document.createElement('div');
    countSection.className = 'settings-section';

    const countLabel = document.createElement('label');
    countLabel.className = 'settings-label';
    countLabel.textContent = `小组数量（${MIN_GROUP_COUNT}-${MAX_GROUP_COUNT}）`;
    countSection.appendChild(countLabel);

    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.className = 'settings-input';
    countInput.min = MIN_GROUP_COUNT.toString();
    countInput.max = MAX_GROUP_COUNT.toString();
    countInput.value = getGroupCount(scoreData);
    countSection.appendChild(countInput);

    const applyCount = () => {
        const newCount = parseInt(countInput.value, 10);
        if (isNaN(newCount) || newCount < MIN_GROUP_COUNT || newCount > MAX_GROUP_COUNT) {
            alert(`请输入 ${MIN_GROUP_COUNT}-${MAX_GROUP_COUNT} 之间的有效数字！`);
            countInput.value = getGroupCount(scoreData);
            return;
        }
        const currentCount = getGroupCount(scoreData);
        if (newCount === currentCount) {
            return;
        }

        const apply = () => {
            applyGroupCount(scoreData, newCount);
            saveData(scoreData);
            renderGroups(scoreData);
            loadDataToPage(scoreData);
            closePopup();
        };

        if (newCount < currentCount) {
            createConfirmPopup('确认减少小组', `将删除小组 ${newCount + 1}~${currentCount} 及其数据，确定继续吗？`, apply);
            return;
        }
        apply();
    };

    const countButton = document.createElement('button');
    countButton.className = 'popup-button';
    countButton.textContent = '应用小组数量';
    countButton.addEventListener('click', applyCount);
    countSection.appendChild(countButton);
    popup.appendChild(countSection);

    // 小组名称
    const nameSection = document.createElement('div');
    nameSection.className = 'settings-section';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'settings-label';
    nameLabel.textContent = '小组名称';
    nameSection.appendChild(nameLabel);

    const nameItems = [];
    const groupCount = getGroupCount(scoreData);
    for (let i = 1; i <= groupCount; i++) {
        const row = document.createElement('div');
        row.className = 'group-name-row';

        const rowLabel = document.createElement('span');
        rowLabel.className = 'group-name-label';
        rowLabel.textContent = `小组 ${i}`;
        row.appendChild(rowLabel);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'group-name-input';
        nameInput.value = getGroupName(scoreData, i.toString());
        row.appendChild(nameInput);

        nameItems.push({ group: i.toString(), input: nameInput });
        nameSection.appendChild(row);
    }

    const saveNamesButton = document.createElement('button');
    saveNamesButton.className = 'popup-button';
    saveNamesButton.textContent = '保存小组名称';
    saveNamesButton.addEventListener('click', () => {
        nameItems.forEach(item => {
            const group = getGroup(scoreData, item.group);
            if (group) {
                const value = item.input.value.trim();
                group.name = value || `小组 ${item.group}`;
            }
        });
        saveData(scoreData);
        loadDataToPage(scoreData);
        showToast('✅ 小组名称已保存', 'success');
    });
    nameSection.appendChild(saveNamesButton);
    popup.appendChild(nameSection);

    const closeButton = document.createElement('button');
    closeButton.className = 'popup-cancel';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', closePopup);
    popup.appendChild(closeButton);

    overlay.appendChild(popup);

    const handleScroll = (e) => {
        if (popup.scrollHeight <= popup.clientHeight) {
            e.preventDefault();
        }
        e.stopPropagation();
    };

    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);

    document.body.appendChild(overlay);
}

// 创建成员管理弹出层（人数 + 名字 + 坐标）
function createMemberManagementPopup(scoreData, group, saveData, loadDataToPage) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'popup';

    const title = document.createElement('h3');
    title.textContent = `成员管理 - ${getGroupName(scoreData, group)}`;
    popup.appendChild(title);

    const closePopup = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 400);
    };

    // 人数设置
    const countSection = document.createElement('div');
    countSection.className = 'settings-section';

    const countLabel = document.createElement('label');
    countLabel.className = 'settings-label';
    countLabel.textContent = '人数';
    countSection.appendChild(countLabel);

    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.className = 'settings-input';
    countInput.min = '0';
    countInput.max = '100';
    countInput.value = getGroupMembers(scoreData, group).length;
    countSection.appendChild(countInput);

    // 成员名单
    const listSection = document.createElement('div');
    listSection.className = 'settings-section';

    const listTitle = document.createElement('h4');
    listTitle.className = 'settings-subtitle';
    listTitle.textContent = '成员名单（留空则显示坐标）';
    listSection.appendChild(listTitle);

    const memberListContainer = document.createElement('div');
    memberListContainer.className = 'member-list';

    const renderMemberList = () => {
        memberListContainer.innerHTML = '';
        const members = getGroupMembers(scoreData, group);
        countInput.value = members.length;
        if (members.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'member-empty';
            empty.textContent = '暂无成员，请先设置人数';
            memberListContainer.appendChild(empty);
            return;
        }
        members.forEach((member) => {
            const item = document.createElement('div');
            item.className = 'member-item';

            const coord = document.createElement('span');
            coord.className = 'member-coord';
            coord.textContent = `${member.col || 1}列${member.row || 1}行`;
            item.appendChild(coord);

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'member-name-input';
            nameInput.value = typeof member.name === 'string' ? member.name : '';
            nameInput.placeholder = getMemberDisplayName(member);
            nameInput.dataset.memberId = member.id;
            item.appendChild(nameInput);

            const scoreButton = document.createElement('button');
            scoreButton.className = 'popup-button';
            scoreButton.textContent = '计分';
            scoreButton.style.cssText = 'flex: 0 0 auto; margin: 0; padding: 6px 10px; font-size: 13px;';
            scoreButton.addEventListener('click', () => {
                memberListContainer.querySelectorAll('.member-name-input').forEach(input => {
                    const target = members.find(m => m.id === input.dataset.memberId);
                    if (target) {
                        target.name = input.value.trim();
                    }
                });
                saveData(scoreData);
                createMemberScorePopup(scoreData, group, member, saveData, loadDataToPage, addFeedback);
            });
            item.appendChild(scoreButton);

            memberListContainer.appendChild(item);
        });
    };

    const applyCount = () => {
        const newCount = parseInt(countInput.value, 10);
        const currentCount = getGroupMembers(scoreData, group).length;
        if (isNaN(newCount) || newCount < 0 || newCount > 100) {
            alert('请输入 0-100 之间的有效数字！');
            countInput.value = currentCount;
            return;
        }
        if (newCount === currentCount) {
            return;
        }

        const apply = () => {
            setMemberCount(scoreData, group, newCount);
            saveData(scoreData);
            renderMemberList();
            loadDataToPage(scoreData);
        };

        if (newCount < currentCount) {
            createConfirmPopup('确认减少人数', `将删除末尾 ${currentCount - newCount} 位成员及其贡献，确定继续吗？`, apply);
            return;
        }
        apply();
    };

    const countButton = document.createElement('button');
    countButton.className = 'popup-button';
    countButton.textContent = '应用人数';
    countButton.addEventListener('click', applyCount);
    countSection.appendChild(countButton);
    popup.appendChild(countSection);

    renderMemberList();
    listSection.appendChild(memberListContainer);

    const saveNamesButton = document.createElement('button');
    saveNamesButton.className = 'popup-button';
    saveNamesButton.textContent = '保存成员名字';
    saveNamesButton.addEventListener('click', () => {
        const members = getGroupMembers(scoreData, group);
        memberListContainer.querySelectorAll('.member-name-input').forEach(input => {
            const member = members.find(m => m.id === input.dataset.memberId);
            if (member) {
                member.name = input.value.trim();
            }
        });
        saveData(scoreData);
        renderMemberList();
        showToast('✅ 成员名字已保存', 'success');
    });
    listSection.appendChild(saveNamesButton);
    popup.appendChild(listSection);

    const closeButton = document.createElement('button');
    closeButton.className = 'popup-cancel';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', closePopup);
    popup.appendChild(closeButton);

    overlay.appendChild(popup);

    const handleScroll = (e) => {
        if (popup.scrollHeight <= popup.clientHeight) {
            e.preventDefault();
        }
        e.stopPropagation();
    };

    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);

    document.body.appendChild(overlay);
}

// 创建成员贡献计分弹出层（个人计分同时计入小组分数与个人贡献）
function createMemberScorePopup(scoreData, group, member, saveData, loadDataToPage, addFeedback, direction) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'popup';

    const title = document.createElement('h3');
    title.textContent = `成员计分 - ${getMemberDisplayName(member)}`;
    popup.appendChild(title);

    const groupHint = document.createElement('div');
    groupHint.className = 'member-coord';
    groupHint.textContent = `所属小组：${getGroupName(scoreData, group)}`;
    popup.appendChild(groupHint);

    const closePopup = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 400);
    };

    const applyScore = (delta, meta) => {
        if (!delta) return;

        const beforeScore = getGroupScore(scoreData, group);
        setGroupScore(scoreData, group, beforeScore + delta);
        const afterScore = getGroupScore(scoreData, group);

        // 因个人加减分：等量计入该成员贡献
        const beforeContribution = getMemberContribution(member);
        setMemberContribution(member, beforeContribution + delta);
        const afterContribution = getMemberContribution(member);

        const extra = Object.assign({}, meta || {}, {
            memberId: member.id,
            memberName: getMemberDisplayName(member),
            beforeContribution: beforeContribution,
            afterContribution: afterContribution
        });
        addHistoryRecord(scoreData, delta > 0 ? 'add-member' : 'subtract-member', group, beforeScore, afterScore, extra);
        saveData(scoreData);
        updateGroupCardScore(group, afterScore, addFeedback);
        closePopup();
    };

    popup.appendChild(createScoreOptionsPanel(scoreData, direction === 'subtract' ? 'subtract' : 'add', applyScore));

    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', closePopup);
    popup.appendChild(cancelButton);

    overlay.appendChild(popup);

    const handleScroll = (e) => {
        if (popup.scrollHeight <= popup.clientHeight) {
            e.preventDefault();
        }
        e.stopPropagation();
    };

    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);

    document.body.appendChild(overlay);
}

// 创建「小组 / 成员」计分范围选择弹出层
function createScopeChoicePopup(direction, group, scoreData, saveData, loadDataToPage, addFeedback) {
    const isSubtract = direction === 'subtract';

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'popup';

    const title = document.createElement('h3');
    title.textContent = `计分 - ${getGroupName(scoreData, group)}`;
    popup.appendChild(title);

    const hint = document.createElement('div');
    hint.className = 'member-coord';
    hint.textContent = '请选择计分对象';
    popup.appendChild(hint);

    const closePopup = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 400);
    };

    const groupButton = document.createElement('button');
    groupButton.className = 'popup-button';
    groupButton.textContent = isSubtract ? '小组减分' : '小组加分';
    groupButton.addEventListener('click', () => {
        closePopup();
        setTimeout(() => {
            createPopup(direction, group, scoreData, saveData, loadDataToPage, addFeedback);
        }, 400);
    });
    popup.appendChild(groupButton);

    const memberButton = document.createElement('button');
    memberButton.className = 'popup-button';
    memberButton.textContent = isSubtract ? '成员减分' : '成员加分';
    memberButton.addEventListener('click', () => {
        if (getGroupMembers(scoreData, group).length === 0) {
            showToast('⚠️ 该小组暂无成员，请先在成员管理中录入', 'warning');
            return;
        }
        closePopup();
        setTimeout(() => {
            createMemberSelectPopup(direction, group, scoreData, saveData, loadDataToPage, addFeedback);
        }, 400);
    });
    popup.appendChild(memberButton);

    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', closePopup);
    popup.appendChild(cancelButton);

    overlay.appendChild(popup);

    const handleScroll = (e) => {
        if (popup.scrollHeight <= popup.clientHeight) {
            e.preventDefault();
        }
        e.stopPropagation();
    };

    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);

    document.body.appendChild(overlay);
}

// 创建成员选择弹出层（选定成员后进入规则面板计分）
function createMemberSelectPopup(direction, group, scoreData, saveData, loadDataToPage, addFeedback) {
    const isSubtract = direction === 'subtract';

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'popup';

    const title = document.createElement('h3');
    title.textContent = `选择成员 - ${getGroupName(scoreData, group)}`;
    popup.appendChild(title);

    const closePopup = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 400);
    };

    const list = document.createElement('div');
    list.className = 'member-list';

    getGroupMembers(scoreData, group).forEach(member => {
        const button = document.createElement('button');
        button.className = 'popup-button';
        button.style.cssText = 'width: 100%; margin: 4px 0;';
        button.textContent = getMemberDisplayName(member);
        button.addEventListener('click', () => {
            closePopup();
            setTimeout(() => {
                createMemberScorePopup(scoreData, group, member, saveData, loadDataToPage, addFeedback, isSubtract ? 'subtract' : 'add');
            }, 400);
        });
        list.appendChild(button);
    });
    popup.appendChild(list);

    const cancelButton = document.createElement('button');
    cancelButton.className = 'popup-cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', closePopup);
    popup.appendChild(cancelButton);

    overlay.appendChild(popup);

    const handleScroll = (e) => {
        if (popup.scrollHeight <= popup.clientHeight) {
            e.preventDefault();
        }
        e.stopPropagation();
    };

    overlay.addEventListener('wheel', handleScroll);
    popup.addEventListener('wheel', handleScroll);

    document.body.appendChild(overlay);
}

// 收集成员贡献排名（groupFilter 为空时表示跨组榜）
function collectContributionRanking(scoreData, groupFilter) {
    const ranking = [];
    const groupCount = getGroupCount(scoreData);
    const groups = groupFilter
        ? [groupFilter.toString()]
        : Array.from({ length: groupCount }, (_, index) => (index + 1).toString());

    groups.forEach(group => {
        getGroupMembers(scoreData, group).forEach(member => {
            ranking.push({
                group: group,
                groupName: getGroupName(scoreData, group),
                name: getMemberDisplayName(member),
                contribution: getMemberContribution(member)
            });
        });
    });

    ranking.sort((a, b) => b.contribution - a.contribution);
    return ranking;
}

// 创建贡献榜弹出层（组内榜 + 跨组榜）
function createContributionRankPopup(scoreData) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'popup';

    const title = document.createElement('h3');
    title.textContent = '贡献榜';
    popup.appendChild(title);

    const closePopup = () => {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 400);
    };

    let currentMode = 'group';
    let currentGroup = '1';

    // 视图切换（组内榜 / 跨组榜）
    const tabRow = document.createElement('div');
    tabRow.style.cssText = 'display: flex; gap: 8px; margin-bottom: 12px;';

    const groupTabButton = document.createElement('button');
    groupTabButton.textContent = '组内榜';

    const allTabButton = document.createElement('button');
    allTabButton.textContent = '跨组榜';

    const activeTabStyle = 'flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff;';
    const inactiveTabStyle = 'flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #374151;';

    const updateTabStyles = () => {
        groupTabButton.style.cssText = currentMode === 'group' ? activeTabStyle : inactiveTabStyle;
        allTabButton.style.cssText = currentMode === 'all' ? activeTabStyle : inactiveTabStyle;
    };

    // 小组选择（仅组内榜显示）
    const groupSelect = document.createElement('select');
    groupSelect.className = 'settings-input';
    groupSelect.style.cssText = 'margin-bottom: 12px;';

    const groupCount = getGroupCount(scoreData);
    for (let i = 1; i <= groupCount; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = getGroupName(scoreData, i.toString());
        groupSelect.appendChild(option);
    }
    groupSelect.value = currentGroup;

    const listContainer = document.createElement('div');
    listContainer.className = 'member-list';
    listContainer.style.cssText = 'max-height: 320px; overflow-y: auto; margin-bottom: 10px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px;';

    const render = () => {
        listContainer.innerHTML = '';
        const filter = currentMode === 'group' ? currentGroup : null;
        const ranking = collectContributionRanking(scoreData, filter);
        const hasContribution = ranking.some(item => item.contribution !== 0);

        if (ranking.length === 0 || !hasContribution) {
            const empty = document.createElement('div');
            empty.className = 'member-empty';
            empty.textContent = '暂无贡献数据';
            listContainer.appendChild(empty);
            return;
        }

        ranking.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'member-item';

            const rank = document.createElement('span');
            rank.style.cssText = 'flex: 0 0 36px; font-size: 13px; font-weight: 600; color: #6b7280;';
            rank.textContent = `#${index + 1}`;
            row.appendChild(rank);

            const name = document.createElement('span');
            name.style.cssText = 'flex: 1; min-width: 0; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
            name.textContent = item.name;
            row.appendChild(name);

            if (currentMode === 'all') {
                const tag = document.createElement('span');
                tag.style.cssText = 'flex: 0 0 auto; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #4f46e5; font-size: 12px;';
                tag.textContent = item.groupName;
                row.appendChild(tag);
            }

            const contribution = document.createElement('span');
            contribution.style.cssText = `flex: 0 0 56px; text-align: right; font-size: 14px; font-weight: 600; color: ${item.contribution >= 0 ? '#10b981' : '#ef4444'};`;
            contribution.textContent = item.contribution > 0 ? `+${item.contribution}` : `${item.contribution}`;
            row.appendChild(contribution);

            listContainer.appendChild(row);
        });
    };

    const refresh = () => {
        updateTabStyles();
        groupSelect.style.display = currentMode === 'group' ? '' : 'none';
        render();
    };

    groupTabButton.addEventListener('click', () => {
        currentMode = 'group';
        refresh();
    });
    allTabButton.addEventListener('click', () => {
        currentMode = 'all';
        refresh();
    });
    groupSelect.addEventListener('change', () => {
        currentGroup = groupSelect.value;
        render();
    });

    tabRow.appendChild(groupTabButton);
    tabRow.appendChild(allTabButton);
    popup.appendChild(tabRow);
    popup.appendChild(groupSelect);
    popup.appendChild(listContainer);

    const closeButton = document.createElement('button');
    closeButton.className = 'popup-cancel';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', closePopup);
    popup.appendChild(closeButton);

    refresh();

    overlay.appendChild(popup);

    const handleScroll = (e) => {
        if (popup.scrollHeight <= popup.clientHeight) {
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

    // 顶部标签栏
    const settingsTabs = document.createElement('div');
    settingsTabs.className = 'settings-tabs';

    // 内容面板容器
    const settingsPanels = document.createElement('div');
    settingsPanels.className = 'settings-panels';

    const settingsTabsConfig = [
        { key: 'display', label: '界面与显示' },
        { key: 'scoring', label: '计分与小组' },
        { key: 'data', label: '备份与数据' },
        { key: 'about', label: '关于' }
    ];

    const settingsPanelMap = {};

    settingsTabsConfig.forEach(function(tabConfig, index) {
        const tabButton = document.createElement('button');
        tabButton.className = 'settings-tab' + (index === 0 ? ' active' : '');
        tabButton.dataset.tab = tabConfig.key;
        tabButton.textContent = tabConfig.label;

        const panel = document.createElement('div');
        panel.className = 'settings-panel' + (index === 0 ? ' active' : '');
        panel.dataset.panel = tabConfig.key;

        tabButton.addEventListener('click', function() {
            settingsTabs.querySelectorAll('.settings-tab').forEach(function(btn) {
                btn.classList.remove('active');
            });
            tabButton.classList.add('active');

            settingsPanels.querySelectorAll('.settings-panel').forEach(function(p) {
                p.classList.remove('active');
            });
            panel.classList.add('active');
        });

        settingsTabs.appendChild(tabButton);
        settingsPanels.appendChild(panel);
        settingsPanelMap[tabConfig.key] = panel;
    });

    const displayPanel = settingsPanelMap.display;
    const scoringPanel = settingsPanelMap.scoring;
    const dataPanel = settingsPanelMap.data;
    const aboutPanel = settingsPanelMap.about;

    popup.appendChild(settingsTabs);
    popup.appendChild(settingsPanels);
    

    
    // 界面与显示面板按钮容器
    const displayButtonContainer = document.createElement('div');
    displayButtonContainer.className = 'popup-buttons';
    
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
    displayButtonContainer.appendChild(wallpaperButton);
    
    // 规则管理
    const ruleManagementButton = document.createElement('button');
    ruleManagementButton.className = 'popup-button';
    ruleManagementButton.textContent = '规则管理';
    ruleManagementButton.addEventListener('click', function() {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            createRuleManagementPopup(scoreData, saveData);
        }, 400);
    });
    const scoringButtonContainer = document.createElement('div');
    scoringButtonContainer.className = 'popup-buttons';
    scoringButtonContainer.appendChild(ruleManagementButton);
    scoringPanel.appendChild(scoringButtonContainer);
    
    // 小组设置
    const groupSettingsButton = document.createElement('button');
    groupSettingsButton.className = 'popup-button';
    groupSettingsButton.textContent = '小组设置';
    groupSettingsButton.addEventListener('click', function() {
        overlay.classList.add('closing');
        popup.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(overlay);
            createGroupSettingsPopup(scoreData, saveData, loadDataToPage);
        }, 400);
    });
    scoringButtonContainer.appendChild(groupSettingsButton);
    
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
    const dataButtonContainer = document.createElement('div');
    dataButtonContainer.className = 'popup-buttons';
    dataButtonContainer.appendChild(historyButton);
    dataPanel.appendChild(dataButtonContainer);
    
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
    displayPanel.appendChild(performanceSection);
    
    // Impeccable 精致模式设置（独立开关，默认关闭）
    const impeccableSection = document.createElement('div');
    impeccableSection.className = 'performance-mode-section impeccable-mode-section';
    
    const impeccableTitle = document.createElement('h4');
    impeccableTitle.textContent = 'Impeccable 精致模式';
    impeccableSection.appendChild(impeccableTitle);
    
    const impeccableToggle = document.createElement('div');
    impeccableToggle.className = 'performance-mode-toggle';
    
    const impeccableLabel = document.createElement('label');
    impeccableLabel.textContent = '启用 Impeccable 精致界面（玻璃质感、光影与微交互）';
    impeccableLabel.setAttribute('for', 'impeccable-toggle');
    
    const impeccableCheckbox = document.createElement('input');
    impeccableCheckbox.type = 'checkbox';
    impeccableCheckbox.id = 'impeccable-toggle';
    impeccableCheckbox.checked = isImpeccableModeEnabled;
    impeccableCheckbox.addEventListener('change', function() {
        toggleImpeccableMode();
        impeccableInfoText.textContent = isImpeccableModeEnabled ? '已启用 Impeccable 精致模式' : '已关闭 Impeccable 精致模式（默认）';
    });
    
    impeccableToggle.appendChild(impeccableLabel);
    impeccableToggle.appendChild(impeccableCheckbox);
    impeccableSection.appendChild(impeccableToggle);
    
    const impeccableInfo = document.createElement('div');
    impeccableInfo.className = 'performance-info';
    
    const impeccableInfoText = document.createElement('div');
    impeccableInfoText.textContent = isImpeccableModeEnabled ? '已启用 Impeccable 精致模式' : '已关闭 Impeccable 精致模式（默认）';
    impeccableInfo.appendChild(impeccableInfoText);
    
    impeccableSection.appendChild(impeccableInfo);
    displayPanel.appendChild(impeccableSection);
    displayPanel.appendChild(displayButtonContainer);
    
    // 导出JSON
    const exportButton = document.createElement('button');
    exportButton.className = 'popup-button';
    exportButton.textContent = '导出JSON';
    exportButton.addEventListener('click', function() {
        // 包含壁纸设置信息
        const wallpaperSettings = initWallpaperSettings();
        const exportData = {
            version: scoreData.version,
            groupCount: scoreData.groupCount,
            groups: scoreData.groups,
            rules: scoreData.rules,
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
    dataButtonContainer.appendChild(exportButton);
    
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
                        // 迁移导入数据到 v2，兼容旧格式
                        const migrated = migrateData(importedData);
                        scoreData.version = migrated.version;
                        scoreData.groupCount = migrated.groupCount;
                        scoreData.groups = migrated.groups;
                        scoreData.rules = migrated.rules;
                        scoreData.history = migrated.history;
                        saveData(scoreData);
                        renderGroups(scoreData);
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
    dataButtonContainer.appendChild(importButton);
    
    // 版本信息
    const aboutInfo = document.createElement('div');
    aboutInfo.className = 'settings-about';

    const aboutVersion = document.createElement('div');
    aboutVersion.className = 'settings-about-item';
    aboutVersion.textContent = '版本号：' + CURRENT_VERSION;
    aboutInfo.appendChild(aboutVersion);

    const aboutAuthor = document.createElement('div');
    aboutAuthor.className = 'settings-about-item';
    aboutAuthor.textContent = '作者：江晚正愁余';
    aboutInfo.appendChild(aboutAuthor);

    aboutPanel.appendChild(aboutInfo);

    const aboutButtonContainer = document.createElement('div');
    aboutButtonContainer.className = 'popup-buttons';
    aboutPanel.appendChild(aboutButtonContainer);
    
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
    aboutButtonContainer.appendChild(versionLogButton);
    
    // 配置 GitHub Token
    const tokenConfigButton = document.createElement('button');
    tokenConfigButton.className = 'popup-button';
    tokenConfigButton.textContent = '🔑 配置 GitHub Token';
    tokenConfigButton.style.backgroundColor = '#6366f1';
    tokenConfigButton.addEventListener('click', function() {
        const currentToken = getGitHubToken();
        const token = prompt('请输入你的 GitHub Personal Access Token：\n\n提示：\n1. 访问 https://github.com/settings/tokens 生成 Token\n2. 勾选 "gist" 权限\n3. Token 格式: ghp_xxxxxxxx', currentToken || '');
        
        if (token !== null) {
            if (token.trim()) {
                setGitHubToken(token.trim());
                showToast('✅ Token 配置成功！', 'success');
                const status = getCloudBackupStatus();
                statusDisplay.textContent = status.message;
                statusDisplay.style.color = status.status === 'backed_up' ? '#10b981' : '#9ca3af';
            } else {
                showToast('❌ Token 不能为空', 'error');
            }
        }
    });
    dataButtonContainer.appendChild(tokenConfigButton);
    
    // 备份到云端
    const backupButton = document.createElement('button');
    backupButton.className = 'popup-button';
    backupButton.textContent = '📤 备份到云端';
    backupButton.style.backgroundColor = '#6366f1';
    backupButton.addEventListener('click', async function() {
        backupButton.disabled = true;
        backupButton.textContent = '备份中...';
        
        const result = await backupToCloud();
        
        if (result.success) {
            showToast('✅ 备份成功！数据已保存到云端', 'success');
            const status = getCloudBackupStatus();
            statusDisplay.textContent = status.message;
            statusDisplay.style.color = '#10b981';
        } else {
            showToast('❌ ' + result.error, 'error');
        }
        
        backupButton.disabled = false;
        backupButton.textContent = '📤 备份到云端';
    });
    dataButtonContainer.appendChild(backupButton);
    
    // 从云端恢复
    const restoreButton = document.createElement('button');
    restoreButton.className = 'popup-button';
    restoreButton.textContent = '📥 从云端恢复';
    restoreButton.style.backgroundColor = '#f59e0b';
    restoreButton.addEventListener('click', async function() {
        const gistId = localStorage.getItem(GIST_ID_KEY);
        if (!gistId) {
            showToast('❌ 未找到云端备份记录', 'error');
            return;
        }
        
        const confirmed = confirm('⚠️ 确认要从云端恢复数据吗？\n\n此操作将覆盖当前所有数据！');
        if (!confirmed) return;
        
        restoreButton.disabled = true;
        restoreButton.textContent = '恢复中...';
        
        const result = await restoreFromCloud();
        
        if (result.success) {
            showToast('✅ 恢复成功！数据已从云端下载', 'success');
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showToast('❌ ' + result.error, 'error');
            restoreButton.disabled = false;
            restoreButton.textContent = '📥 从云端恢复';
        }
    });
    dataButtonContainer.appendChild(restoreButton);
    
    // 云端状态显示
    const statusContainer = document.createElement('div');
    statusContainer.style.cssText = 'margin-top: 15px; padding: 10px; background: #f3f4f6; border-radius: 8px; text-align: center;';
    const statusLabel = document.createElement('span');
    statusLabel.textContent = '☁️ 云端状态：';
    statusLabel.style.cssText = 'font-size: 14px; color: #6b7280;';
    statusContainer.appendChild(statusLabel);
    const statusDisplay = document.createElement('span');
    const status = getCloudBackupStatus();
    statusDisplay.textContent = status.message;
    
    const statusColors = {
        'backed_up': '#10b981',
        'not_backed_up': '#f59e0b',
        'not_configured': '#9ca3af'
    };
    statusDisplay.style.cssText = `font-size: 14px; font-weight: 600; color: ${statusColors[status.status] || '#9ca3af'}; margin-left: 5px;`;
    statusContainer.appendChild(statusDisplay);
    dataButtonContainer.appendChild(statusContainer);
    
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
            
            const groupName = (record.group === null || record.group === undefined)
                ? '全员'
                : getGroupName(scoreData, record.group);
            actionInfo.textContent = `${formatActionType(record.type)} - ${groupName}`;
            recordItem.appendChild(actionInfo);

            // 成员归属与规则来源
            const detailParts = [];
            if (record.memberName) detailParts.push(`成员：${record.memberName}`);
            if (record.ruleName) detailParts.push(`规则：${record.ruleName}`);
            if (detailParts.length > 0) {
                const detailInfo = document.createElement('div');
                detailInfo.style.cssText = 'font-size: 13px; color: #666; margin-bottom: 4px;';
                detailInfo.textContent = detailParts.join(' · ');
                recordItem.appendChild(detailInfo);
            }
            
            // 时间
            const timeInfo = document.createElement('div');
            timeInfo.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 4px;';
            timeInfo.textContent = formatTimestamp(record.timestamp);
            recordItem.appendChild(timeInfo);
            
            // 分数变化
            const scoreChange = document.createElement('div');
            scoreChange.style.cssText = 'font-size: 14px; color: #333;';
            
            if (record.group === null || record.group === undefined) {
                // 全员操作，显示简要信息
                scoreChange.textContent = '所有小组分数已更新';
            } else if (typeof record.beforeContribution === 'number' && typeof record.afterContribution === 'number') {
                // 个人贡献计分：同时展示小组分数与成员贡献的变化
                scoreChange.textContent = `分数 ${record.before} → ${record.after}　贡献 ${record.beforeContribution} → ${record.afterContribution}`;
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
    const groupCount = getGroupCount(scoreData);
    let maxScore = null;
    let winningGroup = '';
    
    for (let i = 1; i <= groupCount; i++) {
        const key = i.toString();
        const score = getGroupScore(scoreData, key);
        if (maxScore === null || score > maxScore) {
            maxScore = score;
            winningGroup = key;
        }
    }
    
    if (winningGroup) {
        createEvaluateResultPopup(`${getGroupName(scoreData, winningGroup)} 得分最高，分数为 ${maxScore}！`, () => {
            for (let i = 1; i <= groupCount; i++) {
                setGroupScore(scoreData, i.toString(), 0);
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
