(function () {
  'use strict';

  // WKWebView 没有实现 JS 弹窗代理（wry 0.57 未实现 WKUIDelegate 的
  // runJavaScript{Alert,Confirm,TextInput}Panel），alert/confirm/prompt 会静默失效。
  // script.js 里有 14 处 alert，这里把提示转到应用内 toast。
  function notify(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type, 4000);
    }
  }

  window.alert = function (message) {
    notify(String(message), 'warning');
  };

  // confirm/prompt 需要同步返回值，异步原生对话框替换不了调用点，
  // 所以这两个由 desktop-bridge.js 里的应用内对话框接管；
  // 这里只是兜底：万一还有没改到的调用点，明确中止而不是没反应。
  window.confirm = function () {
    notify('该操作需要应用内确认框，未执行', 'error');
    return false;
  };

  window.prompt = function () {
    notify('该操作需要应用内输入框，未执行', 'error');
    return null;
  };
})();
