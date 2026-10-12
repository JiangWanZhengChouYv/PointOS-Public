#!/bin/sh
# 从 index.html 内嵌的 base64 favicon 生成 Tauri 桌面图标集。
# 单一真源：网页标签页图标与应用 Dock 图标永远是同一个图形。
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

b64=$(sed -n 's/.*base64,\([A-Za-z0-9+/=]*\)".*/\1/p' "$root/index.html" | head -1)
if [ -z "$b64" ]; then
  echo "index.html 里找不到 base64 内嵌 favicon" >&2
  exit 1
fi
printf '%s' "$b64" | base64 -d > "$tmp/app-icon.svg"

if ! command -v cargo >/dev/null 2>&1; then
  echo "需要 cargo-tauri，请先 cargo install tauri-cli --locked" >&2
  exit 1
fi

if ! command -v xcrun >/dev/null 2>&1; then
  echo "需要 xcrun（Xcode 命令行工具）来光栅化 SVG" >&2
  exit 1
fi

# 用 NSImage 光栅化，保留透明通道；qlmanage 会合成到白底，烤出白边框
xcrun swift "$root/scripts/svg-to-png.swift" "$tmp/app-icon.svg" "$tmp/app-icon.png" 1024
src="$tmp/app-icon.png"
if [ ! -f "$src" ]; then
  echo "SVG 光栅化失败，没有生成 1024x1024 源图" >&2
  exit 1
fi

# tauri icon 的默认输出目录相对于当前工作目录，先固定到仓库根
cd "$root"
cargo tauri icon "$src"

# 桌面版只用到桌面图标，移动端产物删掉避免污染仓库
rm -rf "$root/src-tauri/icons/android" "$root/src-tauri/icons/ios"

echo "图标已生成:"
ls -1 "$root/src-tauri/icons"
