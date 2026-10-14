(function () {
  'use strict';

  const COLLAPSED = { width: 64, height: 64 };
  const EXPANDED = { width: 320, height: 520 };
  const SETTINGS_KEY = 'classScoreSystem_widget';
  const GEOMETRY_KEY = 'classScoreSystem_widgetGeometry';
  const FEEDBACK_MS = 1600;

  const T = window.__TAURI__;
  if (!T || !T.window || !T.event || !T.dpi) {
    document.body.dataset.state = 'no-tauri';
    return;
  }

  const win = T.window.getCurrentWindow();
  const emitTo = T.event.emitTo;

  const ball = document.getElementById('ball');
  const listEl = document.getElementById('list');
  const feedbackEl = document.getElementById('feedback');
  const crumbEl = document.getElementById('crumb');
  const crumbTargetEl = document.getElementById('crumbTarget');
  const tabGroup = document.getElementById('tabGroup');
  const tabMember = document.getElementById('tabMember');
  const ballSubjectEl = document.getElementById('ballSubject');
  const panelSubjectEl = document.getElementById('panelSubject');
  const collapseBtn = document.getElementById('collapse');
  const panelHead = document.getElementById('panelHead');
  const backBtn = document.getElementById('back');
  const openMainBtn = document.getElementById('openMain');

  let snapshot = null;
  let mode = 'group';
  let pickedGroup = null;
  let pickedMember = null;
  let expanded = false;
  let restoreOrigin = null;
  let feedbackTimer = null;

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch (error) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* 隐私模式下写失败不影响使用 */
    }
  }

  function groupName(group) {
    const found = findGroup(group);
    return found ? found.name : `小组 ${group}`;
  }

  function findGroup(group) {
    if (!snapshot || !Array.isArray(snapshot.groups)) return null;
    return snapshot.groups.find(item => String(item.key) === String(group)) || null;
  }

  function showRules() {
    if (mode === 'group') return Boolean(pickedGroup);
    return Boolean(pickedMember);
  }

  function memberLabel(member) {
    const name = typeof member.name === 'string' ? member.name.trim() : '';
    return name || `${member.col || 1}列${member.row || 1}行`;
  }

  function makeRow(primary, trailing) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'row';

    const name = document.createElement('span');
    name.className = 'row-name';
    name.textContent = primary;
    button.appendChild(name);

    if (trailing) {
      const value = document.createElement('span');
      value.className = trailing.numeric ? 'row-score' : (trailing.minus ? 'row-value is-minus' : 'row-value');
      value.textContent = trailing.text;
      button.appendChild(value);
    }
    li.appendChild(button);
    return { li, button };
  }

  function renderNote(text) {
    listEl.textContent = '';
    const li = document.createElement('li');
    const p = document.createElement('p');
    p.className = 'list-note';
    p.textContent = text;
    li.appendChild(p);
    listEl.appendChild(li);
  }

  function renderGroups() {
    listEl.textContent = '';
    snapshot.groups.forEach(group => {
      const { li, button } = makeRow(group.name, { text: String(group.score), numeric: true });
      button.addEventListener('click', () => {
        pickedGroup = String(group.key);
        pickedMember = null;
        render();
      });
      li.dataset.group = String(group.key);
      listEl.appendChild(li);
    });
  }

  function renderMembers() {
    const group = findGroup(pickedGroup);
    const members = group && Array.isArray(group.members) ? group.members : [];
    if (!members.length) {
      renderNote('这个组还没有成员，请在主界面的「成员」里添加');
      return;
    }
    listEl.textContent = '';
    members.forEach(member => {
      const { li, button } = makeRow(memberLabel(member), { text: String(Number(member.contribution) || 0), numeric: true });
      button.addEventListener('click', () => {
        pickedMember = { id: member.id, name: memberLabel(member) };
        render();
      });
      listEl.appendChild(li);
    });
  }

  function renderRules() {
    const rules = (snapshot.rules || [])
      .map(rule => ({ name: rule.name, value: Number(rule.value) || 0 }))
      .filter(rule => rule.value !== 0)
      .sort((a, b) => b.value - a.value);
    if (!rules.length) {
      renderNote('还没有可用的计分规则，请在主界面「设置 → 规则管理」里添加');
      return;
    }
    listEl.textContent = '';
    rules.forEach(rule => {
      const { li, button } = makeRow(rule.name, {
        text: rule.value > 0 ? `+${rule.value}` : `${rule.value}`,
        minus: rule.value < 0
      });
      button.addEventListener('click', () => applyRule(rule));
      listEl.appendChild(li);
    });
  }

  function renderCrumb() {
    const target = pickedMember ? `${groupName(pickedGroup)} · ${pickedMember.name}` : groupName(pickedGroup);
    if (pickedGroup) {
      crumbEl.hidden = false;
      crumbTargetEl.textContent = showRules() ? target : `计分对象：${target}`;
    } else {
      crumbEl.hidden = true;
    }
  }

  function render() {
    if (!snapshot || !Array.isArray(snapshot.groups) || !snapshot.groups.length) {
      crumbEl.hidden = true;
      renderNote('还没有班级数据，打开主界面开始记录');
      return;
    }
    const subject = snapshot.subject || '';
    ballSubjectEl.textContent = subject.charAt(0);
    panelSubjectEl.textContent = subject;
    renderCrumb();

    if (showRules()) renderRules();
    else if (mode === 'member' && pickedGroup) renderMembers();
    else renderGroups();
  }

  function applyRule(rule) {
    emitTo('main', 'widget:score', {
      mode: mode,
      group: pickedGroup,
      memberId: mode === 'member' && pickedMember ? pickedMember.id : null,
      ruleName: rule.name,
      delta: Number(rule.value) || 0
    });
  }

  function showFeedback(message, tone, flashGroup) {
    feedbackEl.textContent = message;
    feedbackEl.dataset.tone = tone;
    feedbackEl.hidden = false;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedbackEl.hidden = true;
      if (showRules()) goBack();
      if (flashGroup) flashRow(flashGroup);
    }, FEEDBACK_MS);
  }

  function flashRow(group) {
    const row = listEl.querySelector(`li[data-group="${CSS.escape(String(group))}"]`);
    if (!row) return;
    row.dataset.flash = 'on';
    setTimeout(() => { delete row.dataset.flash; }, 600);
  }

  async function resizeTo(size) {
    await win.setSize(new T.dpi.LogicalSize(size.width, size.height));
  }

  async function expand() {
    // macOS 的 setContentSize 锚在左下角（tao-0.37.1 util/async.rs:88 直接调
    // NSWindow.setContentSize），高度从 64 涨到 520 会把顶边往上顶 456，
    // 所以尺寸改完必须重新按左上角定位；Windows 上 setSize 本就锚在左上角，重复定位无害
    let origin = null;
    let target = null;
    try {
      const [monitor, position] = await Promise.all([win.currentMonitor(), win.outerPosition()]);
      origin = { x: Math.round(position.x), y: Math.round(position.y) };
      target = origin;
      if (monitor) {
        const scale = monitor.scaleFactor || window.devicePixelRatio || 1;
        const left = monitor.position.x;
        const top = monitor.position.y;
        const right = left + monitor.size.width;
        const bottom = top + monitor.size.height;
        const wantW = EXPANDED.width * scale;
        const wantH = EXPANDED.height * scale;
        let x = origin.x;
        let y = origin.y;
        if (x + wantW > right) x = right - wantW;
        if (y + wantH > bottom) y = bottom - wantH;
        if (x < left) x = left;
        if (y < top) y = top;
        target = { x: Math.round(x), y: Math.round(y) };
      }
    } catch (error) {
      /* 拿不到显示器信息时原地展开，不影响功能 */
    }
    restoreOrigin = origin;
    await resizeTo(EXPANDED);
    if (target) await win.setPosition(new T.dpi.PhysicalPosition(target.x, target.y));
    expanded = true;
    document.body.dataset.state = 'expanded';
    render();
  }

  async function collapse() {
    expanded = false;
    document.body.dataset.state = 'collapsed';
    await resizeTo(COLLAPSED);
    // 缩回去同样会动顶边，所以只要记下过就必定复位
    if (restoreOrigin) {
      await win.setPosition(new T.dpi.PhysicalPosition(restoreOrigin.x, restoreOrigin.y));
      writeJson(GEOMETRY_KEY, restoreOrigin);
      restoreOrigin = null;
    }
  }

  function setMode(next) {
    if (mode === next) return;
    mode = next;
    pickedGroup = null;
    pickedMember = null;
    document.body.dataset.mode = next;
    tabGroup.classList.toggle('is-active', next === 'group');
    tabMember.classList.toggle('is-active', next === 'member');
    tabGroup.setAttribute('aria-selected', String(next === 'group'));
    tabMember.setAttribute('aria-selected', String(next === 'member'));
    render();
  }

  function goBack() {
    if (showRules()) {
      if (mode === 'member') pickedMember = null;
      else pickedGroup = null;
      render();
      return;
    }
    if (pickedGroup) {
      pickedGroup = null;
      render();
    }
  }

  async function restoreGeometry() {
    const saved = readJson(GEOMETRY_KEY);
    if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') return;
    try {
      const monitor = await win.currentMonitor();
      if (!monitor) return;
      const inside = saved.x >= monitor.position.x
        && saved.y >= monitor.position.y
        && saved.x <= monitor.position.x + monitor.size.width - COLLAPSED.width
        && saved.y <= monitor.position.y + monitor.size.height - COLLAPSED.height;
      if (inside) await win.setPosition(new T.dpi.PhysicalPosition(saved.x, saved.y));
    } catch (error) {
      /* 显示器变了就用默认位置 */
    }
  }

  function refreshPosition() {
    return win.outerPosition().then(position => ({ x: position.x, y: position.y }));
  }

  let positionSaveTimer = null;

  // Windows 上 startDragging 会 ReleaseCapture 并进入原生移动循环，期间的
  // mouseup 不回页面，只能拖完后延时补读一次位置
  function schedulePositionSave() {
    if (positionSaveTimer) clearTimeout(positionSaveTimer);
    positionSaveTimer = setTimeout(() => {
      positionSaveTimer = null;
      refreshPosition().then(position => writeJson(GEOMETRY_KEY, position)).catch(() => {});
    }, 600);
  }

  // 位移超过阈值才交给系统拖拽，否则算点击。整块标 data-tauri-drag-region 不行：
  // 那会让 mousedown 无条件进原生拖拽，Windows 上页面收不到 mouseup，球点不动。
  function makeDraggable(el, onCleanClick) {
    let startScreen = null;
    let dragging = false;

    el.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button, select, input, a')) {
        startScreen = null;
        return;
      }
      startScreen = { x: event.screenX, y: event.screenY };
      dragging = false;
    });

    el.addEventListener('pointermove', event => {
      if (!startScreen || dragging) return;
      if (Math.hypot(event.screenX - startScreen.x, event.screenY - startScreen.y) > 4) {
        dragging = true;
        win.startDragging().then(schedulePositionSave).catch(() => {});
      }
    });

    el.addEventListener('pointerup', () => {
      const wasDragging = dragging;
      startScreen = null;
      dragging = false;
      if (!wasDragging && onCleanClick) onCleanClick();
    });

    el.addEventListener('pointercancel', () => {
      startScreen = null;
      dragging = false;
    });
  }

  async function setVisible(enabled) {
    try {
      if (enabled) {
        await win.unminimize();
        await win.setAlwaysOnTop(true);
        await win.show();
        await win.setFocus();
      } else {
        await win.hide();
      }
    } catch (error) {
      /* 窗口调用失败不该打断渲染 */
    }
  }

  makeDraggable(ball, expand);
  makeDraggable(panelHead, null);

  ball.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      expand();
    }
  });

  collapseBtn.addEventListener('click', collapse);
  backBtn.addEventListener('click', goBack);
  tabGroup.addEventListener('click', () => setMode('group'));
  tabMember.addEventListener('click', () => setMode('member'));
  openMainBtn.addEventListener('click', () => emitTo('main', 'widget:open-main'));

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !expanded) return;
    if (showRules() || pickedGroup) goBack();
    else collapse();
  });

  T.event.listen('score:data', event => {
    snapshot = event.payload;
    if (pickedGroup && !findGroup(pickedGroup)) {
      pickedGroup = null;
      pickedMember = null;
    }
    render();
  });

  T.event.listen('score:done', event => {
    const payload = event.payload || {};
    showFeedback(payload.message || '已加分', 'ok', payload.group);
  });

  T.event.listen('score:error', event => {
    showFeedback((event.payload && event.payload.message) || '加分失败', 'error');
  });

  T.event.listen('widget:config', event => {
    const config = event.payload || {};
    setVisible(config.enabled !== false);
    if (config.enabled !== false) emitTo('main', 'widget:snapshot');
  });

  restoreGeometry().then(() => {
    setVisible((readJson(SETTINGS_KEY) || {}).enabled !== false);
    render();
    // 主窗口可能还在初始化，重试几次直到拿到快照
    let attempts = 0;
    const poll = setInterval(() => {
      if (snapshot || attempts >= 6) {
        clearInterval(poll);
        return;
      }
      attempts += 1;
      emitTo('main', 'widget:snapshot');
    }, 500);
    emitTo('main', 'widget:snapshot');
  });
})();
