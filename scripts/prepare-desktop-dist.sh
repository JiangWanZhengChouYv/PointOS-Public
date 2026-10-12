#!/bin/sh
# 桌面版前端产物。本仓库没有 node 也没有压缩器，所以桌面版直接吃未压缩源文件：
# 改 script.js / widget.js 后立刻能在桌面端验证，不需要先重压缩。
# 网页版仍然用 .min 产物，两者互不影响。
#
# service-worker.js 故意不打包 —— WebView 里注册失败会被 script.js 自己的 catch 吞掉。
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
out="$root/desktop-dist"

assets="index.html style.css script.js widget.html widget.css widget.js performance-test.js version.json"

for f in $assets; do
  if [ ! -f "$root/$f" ]; then
    echo "缺少前端产物: $f" >&2
    exit 1
  fi
done

rm -rf "$out"
mkdir -p "$out"
for f in $assets; do
  cp "$root/$f" "$out/$f"
done

# 把网页版的 .min 引用改回未压缩文件
sed -e 's#href="style\.min\.css#href="style.css#' \
    -e 's#src="script\.min\.js#src="script.js#' \
    "$out/index.html" > "$out/index.html.tmp" && mv "$out/index.html.tmp" "$out/index.html"

if ! grep -q 'href="style.css?v=' "$out/index.html" || ! grep -q 'src="script.js?v=' "$out/index.html"; then
  echo "引用重写失败：index.html 里找不到 style.min.css / script.min.js 的引用" >&2
  exit 1
fi

# WKWebView 没有实现 JS 弹窗代理（wry 0.57 未实现 WKUIDelegate 的
# runJavaScript{Alert,Confirm,TextInput}Panel），alert/confirm/prompt 会静默失效。
# script.js 里有 14 处 alert、1 处 confirm、1 处 prompt，所以桌面产物注入一层垫片。
cat > "$out/desktop-shim.js" <<'JS'
(function () {
  'use strict';
  function notify(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type, 4000);
    }
  }
  window.alert = function (message) {
    notify(String(message), 'warning');
  };
  // confirm/prompt 需要同步返回值，无法改成异步原生对话框，
  // 这里显式中止并说明原因，避免点了没反应。
  window.confirm = function () {
    notify('桌面版不支持系统确认框，该操作未执行', 'error');
    return false;
  };
  window.prompt = function () {
    notify('桌面版不支持系统输入框，该操作未执行', 'error');
    return null;
  };
})();
JS

sed 's#<script src="script.js?v=[^"]*" defer></script>#&\n  <script src="desktop-shim.js" defer></script>#' \
  "$out/index.html" > "$out/index.html.tmp" && mv "$out/index.html.tmp" "$out/index.html"

# 版本号一变 sed 就会静默不匹配，这里必须失败退出
if ! grep -q 'desktop-shim.js' "$out/index.html"; then
  echo "垫片注入失败：index.html 里找不到 script.js 的 defer 标签" >&2
  exit 1
fi

echo "desktop-dist 已准备:"
ls -1 "$out"
