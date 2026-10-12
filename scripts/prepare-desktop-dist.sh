#!/bin/sh
# 生成桌面版前端产物 desktop/dist/。
#
# 共用代码只有一份：网页侧从 web/ 拷未压缩源文件，桌面侧从 desktop/src/ 拷自己的
# 文件。本仓库没有 node 也没有打包器，桌面版直接吃源文件，改完立刻能验证，
# 不需要先重压缩；网页版继续用 .min，两者互不影响。
#
# service-worker.js 故意不打包 —— WebView 里注册失败会被 script.js 自己的 catch 吞掉。
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
out="$root/desktop/dist"

web_assets="index.html style.css script.js version.json performance-test.js"
desktop_assets="widget.html widget.css widget.js desktop-shim.js desktop-bridge.js"

for f in $web_assets; do
  if [ ! -f "$root/web/$f" ]; then
    echo "缺少网页产物: web/$f" >&2
    exit 1
  fi
done

for f in $desktop_assets; do
  if [ ! -f "$root/desktop/src/$f" ]; then
    echo "缺少桌面产物: desktop/src/$f" >&2
    exit 1
  fi
done

rm -rf "$out"
mkdir -p "$out"
for f in $web_assets; do
  cp "$root/web/$f" "$out/$f"
done
for f in $desktop_assets; do
  cp "$root/desktop/src/$f" "$out/$f"
done

# 网页版引用的是已压缩文件，桌面版换成未压缩源
sed -e 's#href="style\.min\.css#href="style.css#' \
    -e 's#src="script\.min\.js#src="script.js#' \
  "$out/index.html" > "$out/index.html.tmp" && mv "$out/index.html.tmp" "$out/index.html"

if ! grep -q 'href="style.css?v=' "$out/index.html" || ! grep -q 'src="script.js?v=' "$out/index.html"; then
  echo "引用重写失败：index.html 里找不到 style.min.css / script.min.js 的引用" >&2
  exit 1
fi

# 桌面专属脚本排在 script.js 之后：bridge 要包一层 window.saveStore
sed 's#<script src="script.js?v=[^"]*" defer></script>#&\n  <script src="desktop-shim.js" defer></script>\n  <script src="desktop-bridge.js" defer></script>#' \
  "$out/index.html" > "$out/index.html.tmp" && mv "$out/index.html.tmp" "$out/index.html"

# 版本号一变 sed 就会静默不匹配，这里必须失败退出
if ! grep -q 'desktop-bridge.js' "$out/index.html"; then
  echo "桌面脚本注入失败：index.html 里找不到 script.js 的 defer 标签" >&2
  exit 1
fi

echo "desktop/dist 已准备:"
ls -1 "$out"
