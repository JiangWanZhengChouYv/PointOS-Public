(function () {
  'use strict';

  // 桌面专属层：网页版没有 window.__TAURI__，整个文件直接空转。
  // 这里只调用 web/script.js 暴露的全局函数与全局绑定，不反向修改共享代码。
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

  const VERSION_URL = 'https://cdn.jsdelivr.net/gh/JiangWanZhengChouYv/PointOS-Public@main/web/version.json';

  function isNewer(remote, local) {
    const a = String(remote).split('.').map(n => parseInt(n, 10) || 0);
    const b = String(local).split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] || 0;
      const y = b[i] || 0;
      if (x !== y) return x > y;
    }
    return false;
  }

  // 桌面版版本来自打包进二进制的 tauri.conf.json，所以本地改代码不会误报更新；
  // 走 JSDelivr 而不是 api.github.com，是因为教室网络下 CDN 更稳
  function checkDesktopUpdate() {
    if (!T.app || !T.app.getVersion) return;
    Promise.all([
      T.app.getVersion(),
      fetch(VERSION_URL, { cache: 'no-store' }).then(response => (response.ok ? response.json() : null))
    ])
      .then(function (results) {
        const local = results[0];
        const remote = results[1] && results[1].version;
        if (remote && isNewer(remote, local)) {
          showToast(`桌面版 v${remote} 已发布，点右上角「下载桌面版」升级`, 'info', 10000);
        }
      })
      .catch(function () {
        /* 断网或 CDN 抖动都不该影响上课 */
      });
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

    setTimeout(checkDesktopUpdate, 1500);

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
    return result;
  };

  // script.js 的 DOMContentLoaded 监听先注册，所以 init() 已经跑完，数据可用
  document.addEventListener('DOMContentLoaded', boot);
})();
