(function () {
  'use strict';

  // 桌面专属层：网页版没有 window.__TAURI__，整个文件直接空转。
  // 这里只调用 docs/script.js 暴露的全局函数与全局绑定，不反向修改共享代码。
  const T = window.__TAURI__;
  if (!T || !T.event) return;

  const WIDGET_SETTINGS_KEY = 'classScoreSystem_widget';

  // 覆盖共享代码里的默认实现：网页版走 blob 下载和 <input type=file>，
  // WKWebView 没有下载处理，这里换成系统对话框（读写都在 Rust 命令里做）
  window.saveTextFile = function (fileName, text) {
    return T.core.invoke('save_text_file', { name: fileName, contents: text })
      .then(function (savedPath) {
        if (savedPath && typeof showToast === 'function') {
          showToast('已导出到 ' + savedPath, 'success');
        }
        return savedPath;
      });
  };

  window.openTextFile = function () {
    return T.core.invoke('open_text_file');
  };

  // 桌面版 reload 拿到的还是打进二进制的同一份文件，所以网页那套
  // 「清缓存 + 刷新」的更新提示条只会反复弹、永远关不掉。
  // showUpdateNotification 是四条触发路径（版本轮询、Service Worker 消息、
  // updatefound、CACHE_UPDATED）唯一的出口，在这里掐断。
  window.checkVersionUpdate = function () { return Promise.resolve(); };
  window.showUpdateNotification = function () {};

  // 「下载桌面版」是给网页版访客看的，桌面版里出现没有意义
  function removeDesktopDownloadEntries() {
    document.querySelectorAll('a.desktop-download').forEach(el => el.remove());
    document.querySelectorAll('.settings-about-item').forEach(function (item) {
      if (item.querySelector('a[href*="releases"]')) item.remove();
    });
  }

  removeDesktopDownloadEntries();

  function readSettings() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(WIDGET_SETTINGS_KEY));
    } catch (error) {
      saved = null;
    }
    const config = (saved && typeof saved === 'object') ? saved : {};
    return {
      enabled: config.enabled !== false,
      subject: SUBJECTS.indexOf(config.subject) >= 0 ? config.subject : ''
    };
  }

  function emitToWidget(event, payload) {
    const result = T.event.emitTo('widget', event, payload);
    if (result && result.catch) result.catch(() => {});
  }

  function writeSettings(settings) {
    localStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(settings));
    emitToWidget('widget:config', settings);
  }

  function subjectDataOf(subject) {
    if (subjectStore && subjectStore.subjects && subjectStore.subjects[subject]) {
      return subjectStore.subjects[subject];
    }
    return scoreData;
  }

  function activeSubjectName() {
    const settings = readSettings();
    return settings.subject || activeSubject;
  }

  function snapshot() {
    const subject = activeSubjectName();
    const data = subjectDataOf(subject);
    if (!data || !data.groups) return { subject: subject, groups: [], rules: [] };
    return {
      subject: subject,
      groups: Object.keys(data.groups).map(function (key) {
        return {
          key: key,
          name: getGroupName(data, key),
          score: getGroupScore(data, key),
          members: getGroupMembers(data, key).map(function (member) {
            return {
              id: member.id,
              name: getMemberDisplayName(member),
              contribution: getMemberContribution(member)
            };
          })
        };
      }),
      rules: getRules(data).map(function (rule) {
        return { name: rule.name, value: Number(rule.value) || 0 };
      })
    };
  }

  function pushSnapshot() {
    if (!subjectStore || !scoreData) return;
    emitToWidget('score:data', snapshot());
  }

  // 悬浮球只发意图，写数据仍然由本窗口完成，保证计分逻辑只有一份
  function applyScore(payload) {
    const subject = activeSubjectName();
    const data = subjectDataOf(subject);
    const group = String(payload.group || '');
    const delta = Number(payload.delta) || 0;

    if (!data || !data.groups || !data.groups[group]) return { ok: false, message: '找不到该小组' };
    if (delta === 0) return { ok: false, message: '这条规则分值是 0，未计分' };

    const beforeScore = getGroupScore(data, group);
    setGroupScore(data, group, beforeScore + delta);
    const afterScore = getGroupScore(data, group);

    const extra = { ruleName: typeof payload.ruleName === 'string' ? payload.ruleName : '' };
    let type = delta > 0 ? 'add' : 'subtract';

    if (payload.mode === 'member' && payload.memberId) {
      const member = getGroupMembers(data, group).find(function (item) { return item.id === payload.memberId; });
      if (!member) return { ok: false, message: '找不到该成员' };
      const beforeContribution = getMemberContribution(member);
      setMemberContribution(member, beforeContribution + delta);
      extra.memberId = member.id;
      extra.memberName = getMemberDisplayName(member);
      extra.beforeContribution = beforeContribution;
      extra.afterContribution = getMemberContribution(member);
      type = delta > 0 ? 'add-member' : 'subtract-member';
    }

    addHistoryRecord(data, type, group, beforeScore, afterScore, extra);
    saveStore();

    if (data === scoreData) {
      updateGroupCardScore(group, afterScore, addFeedback);
    }

    const isMember = type === 'add-member' || type === 'subtract-member';
    const label = isMember ? extra.memberName : getGroupName(data, group);
    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    const suffix = extra.ruleName ? ` · ${extra.ruleName}` : '';
    return { ok: true, group: group, message: `${label} ${sign}${suffix}` };
  }

  function showMainWindow() {
    if (!T.window) return;
    const win = T.window.getCurrentWindow();
    win.show();
    win.setFocus();
  }

  // 托盘的「显示 / 隐藏悬浮球」只是改设置项的快捷方式，保证开关只有一个真源
  function toggleFromTray() {
    const settings = readSettings();
    const next = !settings.enabled;
    writeSettings({ enabled: next, subject: settings.subject });
    const toggle = document.getElementById('widget-toggle');
    if (toggle) toggle.checked = next;
    syncSectionText(next);
  }

  function syncSectionText(enabled) {
    const info = document.getElementById('widget-info-text');
    if (info) info.textContent = enabled ? '悬浮球显示在桌面上' : '悬浮球已隐藏';
  }

  function makeRow(className) {
    const row = document.createElement('div');
    row.className = className;
    return row;
  }

  function makeSwitch(id, labelText, checked) {
    const row = makeRow('performance-mode-toggle');
    const label = document.createElement('label');
    label.textContent = labelText;
    label.setAttribute('for', id);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.checked = checked;

    row.appendChild(label);
    row.appendChild(input);
    return { row: row, input: input };
  }

  function appendWidgetSection(panel) {
    const settings = readSettings();

    const section = makeRow('performance-mode-section widget-mode-section');
    const title = document.createElement('h4');
    title.textContent = '悬浮计分球';
    section.appendChild(title);

    const info = document.createElement('div');
    info.className = 'performance-info';
    const infoText = document.createElement('div');
    infoText.id = 'widget-info-text';
    infoText.textContent = settings.enabled ? '悬浮球显示在桌面上' : '悬浮球已隐藏';
    info.appendChild(infoText);

    const enableSwitch = makeSwitch('widget-toggle', '显示悬浮球', settings.enabled);
    enableSwitch.input.addEventListener('change', function () {
      writeSettings({ enabled: enableSwitch.input.checked, subject: subjectSelect.value });
      syncSectionText(enableSwitch.input.checked);
    });
    section.appendChild(enableSwitch.row);

    const subjectRow = makeRow('performance-mode-toggle');
    const subjectLabel = document.createElement('label');
    subjectLabel.textContent = '悬浮球计分学科';
    subjectLabel.setAttribute('for', 'widget-subject');
    const subjectSelect = document.createElement('select');
    subjectSelect.className = 'widget-subject-select';
    subjectSelect.id = 'widget-subject';

    const follow = document.createElement('option');
    follow.value = '';
    follow.textContent = '跟随主界面';
    subjectSelect.appendChild(follow);
    SUBJECTS.forEach(function (subject) {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      subjectSelect.appendChild(option);
    });
    subjectSelect.value = settings.subject;
    subjectSelect.addEventListener('change', function () {
      writeSettings({ enabled: enableSwitch.input.checked, subject: subjectSelect.value });
      // 换学科要按新学科重推一次快照
      pushSnapshot();
    });
    subjectRow.appendChild(subjectLabel);
    subjectRow.appendChild(subjectSelect);
    section.appendChild(subjectRow);

    const autostartSwitch = makeSwitch('widget-autostart', '开机自动启动', false);
    const autostartInfo = document.createElement('div');
    autostartInfo.className = 'performance-info';
    const autostartText = document.createElement('div');
    autostartText.textContent = '正在读取开机启动状态…';
    autostartInfo.appendChild(autostartText);

    autostartSwitch.input.addEventListener('change', function () {
      const wanted = autostartSwitch.input.checked;
      T.core.invoke('set_autostart', { enabled: wanted })
        .then(function () {
          autostartText.textContent = wanted ? '已加入开机启动项' : '已从开机启动项移除';
        })
        .catch(function (error) {
          autostartSwitch.input.checked = !wanted;
          showToast(`设置开机自启失败：${error}`, 'error');
        });
    });
    section.appendChild(autostartSwitch.row);
    section.appendChild(autostartInfo);

    if (T.core && T.core.invoke) {
      T.core.invoke('get_autostart')
        .then(function (enabled) {
          autostartSwitch.input.checked = Boolean(enabled);
          autostartText.textContent = enabled ? '已加入开机启动项' : '未加入开机启动项';
        })
        .catch(function () {
          autostartSwitch.row.hidden = true;
          autostartText.textContent = '此系统不支持开机自启';
        });
    }

    section.appendChild(info);
    panel.appendChild(section);
  }

  // 自更新：查签名清单 → 确认后下载 → 装完重启，全在 Rust 侧的两个命令里做。
  // 本地版本取打进二进制的 tauri.conf.json，所以改代码不会误报更新。
  let localVersion = '';
  let updatePrompted = false;

  function setUpdateStatus(text) {
    const el = document.getElementById('widget-update-status');
    if (el) el.textContent = text;
  }

  function confirmAndInstall(info) {
    // 主窗口默认可能是隐藏的，确认框必须看得见才能点
    showMainWindow();
    return uiConfirm(
      `发现新版本 v${info.version}（当前 v${localVersion || '未知'}）。下载完成后软件会自动重启完成安装。`,
      '软件更新'
    ).then(function (accepted) {
      if (!accepted) {
        setUpdateStatus(`发现新版本 v${info.version}，随时可以在这里点「检查更新」安装`);
        return undefined;
      }
      setUpdateStatus(`正在下载 v${info.version}…`);
      return T.core.invoke('install_app_update').catch(function (error) {
        setUpdateStatus('更新失败：' + error);
        showToast(`更新失败：${error}`, 'error');
      });
    });
  }

  function checkSelfUpdate(manual) {
    setUpdateStatus('正在检查更新…');
    return T.core.invoke('check_app_update')
      .then(function (info) {
        if (!info) {
          setUpdateStatus(`已是最新版本 v${localVersion || '未知'}`);
          if (manual) showToast('已经是最新版本', 'success');
          return undefined;
        }
        if (!manual && updatePrompted) {
          setUpdateStatus(`发现新版本 v${info.version}`);
          return undefined;
        }
        updatePrompted = true;
        return confirmAndInstall(info);
      })
      .catch(function (error) {
        // 断网 / GitHub 抖动不该影响上课，只在设置面板里留一行说明
        setUpdateStatus('检查更新失败：' + error);
      });
  }

  function appendUpdateSection(panel) {
    const section = makeRow('performance-mode-section widget-mode-section');
    const title = document.createElement('h4');
    title.textContent = '软件更新';
    section.appendChild(title);

    const info = document.createElement('div');
    info.className = 'performance-info';
    const status = document.createElement('div');
    status.id = 'widget-update-status';
    status.textContent = localVersion
      ? `当前版本 v${localVersion}`
      : '正在读取版本…';
    info.appendChild(status);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'popup-button frost-solid frost-indigo';
    button.textContent = '检查更新';
    button.addEventListener('click', function () {
      checkSelfUpdate(true);
    });
    section.appendChild(button);
    section.appendChild(info);
    panel.appendChild(section);
  }

  function boot() {
    T.event.listen('widget:snapshot', function () {
      pushSnapshot();
    });

    T.event.listen('widget:score', function (event) {
      const result = applyScore(event.payload || {});
      if (!result.ok) {
        emitToWidget('score:error', { message: result.message });
        return;
      }
      emitToWidget('score:done', { message: result.message, group: result.group });
    });

    T.event.listen('widget:open-main', showMainWindow);
    T.event.listen('widget:toggle-from-tray', toggleFromTray);

    // WebView 里 target=_blank 不会开新窗口，下载与外链统一交给系统浏览器
    document.addEventListener('click', function (event) {
      const link = event.target.closest && event.target.closest('a[target="_blank"]');
      if (!link || !link.href) return;
      event.preventDefault();
      T.core.invoke('open_url', { url: link.href }).catch(function (error) {
        showToast(`打开链接失败：${error}`, 'error');
      });
    });

    // 当前版本要从二进制里读，确认框和状态文本都靠它
    T.app.getVersion()
      .then(function (version) { localVersion = version; })
      .catch(function () {})
      // 开机静默查一次；本机已经问过的版本由 updatePrompted 兜住，不重复打扰
      .then(function () { setTimeout(function () { checkSelfUpdate(false); }, 1200); });

    pushSnapshot();
  }

  // 主窗口每次保存都推快照给球，避免两边数据漂开
  const originalSaveStore = window.saveStore;
  window.saveStore = function () {
    const result = originalSaveStore.apply(this, arguments);
    pushSnapshot();
    return result;
  };

  // 设置面板是桌面专属节的宿主：弹窗建好后往里追加一节
  const originalSettingsPopup = window.createSettingsPopup;
  window.createSettingsPopup = function () {
    const result = originalSettingsPopup.apply(this, arguments);
    const panel = document.querySelector('.settings-panel[data-panel="display"]');
    if (panel) appendWidgetSection(panel);
    // 软件更新属于"关于"：那里本来就有版本号与更新日志，桌面版又刚好把下载入口移掉
    const aboutPanel = document.querySelector('.settings-panel[data-panel="about"]');
    if (aboutPanel) appendUpdateSection(aboutPanel);
    removeDesktopDownloadEntries();
    return result;
  };

  // script.js 的 DOMContentLoaded 监听先注册，所以 init() 已经跑完，数据可用
  document.addEventListener('DOMContentLoaded', boot);
})();
