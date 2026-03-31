// 班级积分管理系统
// 版本: 1.1.3

// 更新服务器URL
const UPDATE_SERVER_URL = 'https://jiangwanzhengchouyv.github.io/PointOS/updates';
const CURRENT_VERSION = '1.1.3';

// 存储键名
const STORAGE_KEY = 'classScoreSystem';
const ACCELERATION_SETTINGS_KEY = 'classScoreSystem_acceleration';
const WALLPAPER_STORAGE_KEY = 'wallpaperSettings';
const UPDATE_REMINDER_STORAGE_KEY = 'updateReminderSettings';

// 预设壁纸
const PRESET_WALLPAPERS = [
    { id: 'default', name: '默认渐变', url: '', type: 'default' },
    { id: 'nature', name: '自然风光', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80', type: 'preset' },
    { id: 'geometric', name: '几何图案', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80', type: 'preset' },
    { id: 'library', name: '图书馆', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=80', type: 'preset' },
    { id: 'classroom', name: '教室', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&q=80', type: 'preset' }
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

// 应用壁纸
function applyWallpaper(settings) {
    const body = document.body;
    if (settings.type === 'default' || !settings.url) {
        body.style.backgroundImage = 'none';
        body.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f0f9ff 100%)';
        body.classList.remove('wallpaper-custom');
    } else {
        body.style.backgroundImage = `url(${settings.url})`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundAttachment = 'fixed';
        body.classList.add('wallpaper-custom');
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

// 检查是否应该显示更新提示
function shouldShowUpdateReminder() {
    const settings = JSON.parse(localStorage.getItem(UPDATE_REMINDER_STORAGE_KEY) || '{}');
    if (!settings.lastRemindTime) return true;
    return Date.now() - settings.lastRemindTime > 24 * 60 * 60 * 1000;
}

// 保存提醒设置
function saveReminderSettings() {
    localStorage.setItem(UPDATE_REMINDER_STORAGE_KEY, JSON.stringify({ lastRemindTime: Date.now() }));
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
    
    const presetsContainer = document.createElement('div');
    presetsContainer.className = 'presets-container';
    
    PRESET_WALLPAPERS.forEach(wallpaper => {
        const presetItem = document.createElement('div');
        presetItem.className = 'preset-item';
        if ((wallpaper.type === 'default' && tempSettings.type === 'default') || 
            (wallpaper.url === tempSettings.url && tempSettings.type !== 'custom')) {
            presetItem.classList.add('selected');
        }
        
        if (wallpaper.type === 'default') {
            presetItem.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f0f9ff 100%)';
        } else {
            presetItem.style.backgroundImage = `url(${wallpaper.url})`;
            presetItem.style.backgroundSize = 'cover';
            presetItem.style.backgroundPosition = 'center';
        }
        
        const presetLabel = document.createElement('span');
        presetLabel.textContent = wallpaper.name;
        presetItem.appendChild(presetLabel);
        
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
        
        presetsContainer.appendChild(presetItem);
    });
    
    presetsSection.appendChild(presetsContainer);
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

// 显示更新详情
function showUpdateDetails(updateInfo) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup update-details';
    
    const title = document.createElement('h3');
    title.textContent = '更新详情';
    popup.appendChild(title);
    
    const versionInfo = document.createElement('div');
    versionInfo.className = 'update-detail-info';
    versionInfo.innerHTML = `
        <p><strong>版本：</strong>${updateInfo.version}</p>
        <p><strong>日期：</strong>${updateInfo.date || '未知'}</p>
        <p><strong>重要程度：</strong>${updateInfo.importance === 'high' ? '高' : '中'}</p>
    `;
    popup.appendChild(versionInfo);
    
    const changesTitle = document.createElement('h4');
    changesTitle.textContent = '更新内容：';
    popup.appendChild(changesTitle);
    
    const changesList = document.createElement('ul');
    updateInfo.changes.forEach(change => {
        const li = document.createElement('li');
        li.textContent = change;
        changesList.appendChild(li);
    });
    popup.appendChild(changesList);
    
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-cancel';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', () => document.body.removeChild(overlay));
    popup.appendChild(closeButton);
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

// 执行更新
function performUpdate(updateInfo) {
    const serverUrl = UPDATE_SERVER_URL;
    
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'update-progress';
    progressContainer.innerHTML = `
        <p>正在下载更新...</p>
        <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
        <p class="progress-text">0%</p>
        <button class="update-cancel">取消</button>
    `;
    popup.appendChild(progressContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    let isCancelled = false;
    progressContainer.querySelector('.update-cancel').addEventListener('click', () => {
        isCancelled = true;
        alert('更新已取消');
        document.body.removeChild(overlay);
    });
    
    const timeoutId = setTimeout(() => {
        if (!isCancelled) {
            isCancelled = true;
            alert('更新超时，请检查网络连接后重试');
            document.body.removeChild(overlay);
        }
    }, 30000);
    
    const filesToDownload = [
        { url: `${serverUrl}/积分.html?t=${Date.now()}`, name: '积分.html' },
        { url: `${serverUrl}/style.css?t=${Date.now()}`, name: 'style.css' },
        { url: `${serverUrl}/script.js?t=${Date.now()}`, name: 'script.js' }
    ];
    let downloadedFiles = 0;
    
    const processFiles = async () => {
        for (const fileInfo of filesToDownload) {
            if (isCancelled) throw new Error('更新已取消');
            
            progressContainer.innerHTML = `
                <p>正在下载 ${fileInfo.name}...</p>
                <div class="progress-bar"><div class="progress-fill" style="width: ${Math.round((downloadedFiles / filesToDownload.length) * 100)}%"></div></div>
                <p class="progress-text">${Math.round((downloadedFiles / filesToDownload.length) * 100)}%</p>
                <button class="update-cancel">取消</button>
            `;
            
            progressContainer.querySelector('.update-cancel').addEventListener('click', () => {
                isCancelled = true;
                alert('更新已取消');
                document.body.removeChild(overlay);
            });
            
            const response = await fetch(fileInfo.url, { timeout: 10000 });
            
            if (!response.ok) {
                throw new Error(`下载文件失败: ${fileInfo.url} (${response.status})`);
            }
            
            const content = await response.text();
            
            progressContainer.innerHTML = `
                <p>正在保存 ${fileInfo.name}...</p>
                <div class="progress-bar"><div class="progress-fill" style="width: ${Math.round((downloadedFiles / filesToDownload.length) * 100)}%"></div></div>
                <p class="progress-text">${Math.round((downloadedFiles / filesToDownload.length) * 100)}%</p>
                <button class="update-cancel">取消</button>
            `;
            
            progressContainer.querySelector('.update-cancel').addEventListener('click', () => {
                isCancelled = true;
                alert('更新已取消');
                document.body.removeChild(overlay);
            });
            
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileInfo.name,
                    types: [{ description: 'Text file', accept: { 'text/*': ['.html', '.css', '.js'] } }]
                });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
            } else {
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileInfo.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
            
            downloadedFiles++;
            const progress = Math.round((downloadedFiles / filesToDownload.length) * 100);
            progressContainer.innerHTML = `
                <p>已完成 ${fileInfo.name}</p>
                <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                <p class="progress-text">${progress}%</p>
                <button class="update-cancel">取消</button>
            `;
        }
    };
    
    processFiles()
        .then(() => {
            if (isCancelled) return;
            clearTimeout(timeoutId);
            progressContainer.innerHTML = '<p>下载完成，正在应用更新...</p>';
            setTimeout(() => {
                alert('更新成功！正在应用更新...');
                document.body.removeChild(overlay);
                setTimeout(() => location.reload(true), 500);
            }, 1000);
        })
        .catch(error => {
            clearTimeout(timeoutId);
            if (!isCancelled) {
                alert('更新失败：' + error.message);
                document.body.removeChild(overlay);
            }
        });
}

// 显示更新提示
function showUpdateNotification(updateInfo) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup update-notification';
    
    const riskWarning = document.createElement('div');
    riskWarning.className = 'risk-warning';
    riskWarning.textContent = '⚠️ 更新有风险，请先备份数据';
    popup.appendChild(riskWarning);
    
    const title = document.createElement('h3');
    title.textContent = `发现新版本 ${updateInfo.version}`;
    popup.appendChild(title);
    
    const versionInfo = document.createElement('div');
    versionInfo.className = 'version-info';
    versionInfo.innerHTML = `
        <p>当前版本：${CURRENT_VERSION}</p>
        <p>更新日期：${updateInfo.date || '未知'}</p>
        <p>重要程度：${updateInfo.importance === 'high' ? '高' : '中'}</p>
    `;
    popup.appendChild(versionInfo);
    
    const changesTitle = document.createElement('h4');
    changesTitle.textContent = '更新内容：';
    popup.appendChild(changesTitle);
    
    const changesList = document.createElement('ul');
    changesList.className = 'changes-list';
    updateInfo.changes.forEach(change => {
        const li = document.createElement('li');
        li.textContent = change;
        changesList.appendChild(li);
    });
    popup.appendChild(changesList);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'notification-buttons';
    
    const updateNowBtn = document.createElement('button');
    updateNowBtn.className = 'update-now';
    updateNowBtn.textContent = '立即更新';
    updateNowBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        performUpdate(updateInfo);
    });
    
    const remindLaterBtn = document.createElement('button');
    remindLaterBtn.className = 'remind-later';
    remindLaterBtn.textContent = '稍后提醒';
    remindLaterBtn.addEventListener('click', () => {
        saveReminderSettings();
        document.body.removeChild(overlay);
    });
    
    const viewDetailsBtn = document.createElement('button');
    viewDetailsBtn.className = 'view-details';
    viewDetailsBtn.textContent = '查看更新详情';
    viewDetailsBtn.addEventListener('click', () => showUpdateDetails(updateInfo));
    
    buttonContainer.appendChild(updateNowBtn);
    buttonContainer.appendChild(remindLaterBtn);
    buttonContainer.appendChild(viewDetailsBtn);
    popup.appendChild(buttonContainer);
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

// 自动检查更新
function checkForUpdatesAutomatically() {
    if (!shouldShowUpdateReminder()) return;
    
    fetch(`${UPDATE_SERVER_URL}/update-info.json?${Date.now()}`)
        .then(response => {
            if (!response.ok) throw new Error(`网络错误: ${response.status}`);
            return response.json();
        })
        .then(updateInfo => {
            if (!updateInfo.version || !updateInfo.changes) {
                throw new Error('更新说明文件格式错误');
            }
            if (updateInfo.version > CURRENT_VERSION) {
                showUpdateNotification(updateInfo);
            }
        })
        .catch(error => console.error('自动检查更新失败:', error));
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
            
            // 更新设置
            const updateSection = document.createElement('div');
            updateSection.className = 'update-section';
            
            const updateTitle = document.createElement('h4');
            updateTitle.textContent = '更新设置';
            updateSection.appendChild(updateTitle);
            
            const urlDisplay = document.createElement('p');
            urlDisplay.className = 'server-url-display';
            urlDisplay.textContent = `当前更新服务器: ${UPDATE_SERVER_URL}`;
            urlDisplay.style.marginBottom = '15px';
            updateSection.appendChild(urlDisplay);
            
            const checkUpdateButton = document.createElement('button');
            checkUpdateButton.className = 'popup-button';
            checkUpdateButton.textContent = '检查更新';
            checkUpdateButton.addEventListener('click', function() {
                // 检查更新逻辑
                const progressContainer = document.createElement('div');
                progressContainer.className = 'update-progress';
                progressContainer.innerHTML = `
                    <p class="progress-step">正在准备检查更新...</p>
                    <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
                    <p class="progress-text">0%</p>
                `;
                
                const parent = checkUpdateButton.parentNode;
                parent.removeChild(checkUpdateButton);
                parent.appendChild(progressContainer);
                
                const updateUrls = [
                    UPDATE_SERVER_URL,
                    'https://ghproxy.com/https://raw.githubusercontent.com/jiangwanzhengchouyv/PointOS/main/',
                    'https://cdn.jsdelivr.net/gh/jiangwanzhengchouyv/PointOS@main/updates',
                    'https://cdn.statically.io/gh/jiangwanzhengchouyv/PointOS/main/updates'
                ];
                
                const checkUpdateWithRetry = async (urls, retryCount = 0) => {
                    const maxRetries = 3;
                    
                    try {
                        progressContainer.querySelector('.progress-step').textContent = '正在检查更新信息...';
                        progressContainer.querySelector('.progress-fill').style.width = '20%';
                        progressContainer.querySelector('.progress-text').textContent = '20%';
                        
                        const promises = urls.map(url => 
                            fetch(`${url}/update-info.json?${Date.now()}`)
                                .then(response => {
                                    if (!response.ok) throw new Error(`网络错误: ${response.status}`);
                                    return response.json();
                                })
                        );
                        
                        const updateInfo = await Promise.any(promises);
                        
                        progressContainer.querySelector('.progress-step').textContent = '正在验证更新信息...';
                        progressContainer.querySelector('.progress-fill').style.width = '80%';
                        progressContainer.querySelector('.progress-text').textContent = '80%';
                        
                        if (!updateInfo.version || !updateInfo.changes) {
                            throw new Error('更新说明文件格式错误');
                        }
                        
                        progressContainer.querySelector('.progress-step').textContent = '检查完成';
                        progressContainer.querySelector('.progress-fill').style.width = '100%';
                        progressContainer.querySelector('.progress-text').textContent = '100%';
                        
                        if (updateInfo.version > CURRENT_VERSION) {
                            parent.removeChild(progressContainer);
                            showUpdateNotification(updateInfo);
                        } else {
                            setTimeout(() => {
                                alert('当前已是最新版本！');
                                parent.removeChild(progressContainer);
                                parent.appendChild(checkUpdateButton);
                            }, 500);
                        }
                    } catch (error) {
                        if (retryCount < maxRetries) {
                            progressContainer.querySelector('.progress-step').textContent = `检查失败，${maxRetries - retryCount}秒后重试...`;
                            setTimeout(() => checkUpdateWithRetry(urls, retryCount + 1), 2000);
                        } else {
                            alert('检查更新失败：' + error.message);
                            parent.removeChild(progressContainer);
                            parent.appendChild(checkUpdateButton);
                        }
                    }
                };
                
                checkUpdateWithRetry(updateUrls);
            });
            updateSection.appendChild(checkUpdateButton);
            
            popup.appendChild(updateSection);
            
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
            })
            .catch(error => console.error('Service Worker registration failed:', error));
    });
    
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
            alert('更新成功！请刷新页面以应用更新。');
            location.reload(true);
        }
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    init();
    setTimeout(() => checkForUpdatesAutomatically(), 1000);
});
