#!/bin/sh
# 把刚构建出的 .app 装到 /Applications，并让开机自启指向新路径。
# 每次重新构建后重跑一次即可。
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
app_name="班级积分管理系统.app"
src="$root/src-tauri/target/release/bundle/macos/$app_name"
dest="/Applications/$app_name"
login_item="$HOME/Library/LaunchAgents/班级积分管理系统.plist"
marker="$HOME/Library/Application Support/com.classscoresystem.desktop/.autostart-default"

if [ ! -d "$src" ]; then
  echo "找不到构建产物: $src" >&2
  echo "先跑: (cd src-tauri && cargo tauri build --bundles app)" >&2
  exit 1
fi

# 结束正在运行的实例，否则拷贝会撞上占用
for pid in $(pgrep -f 'class-score-desktop' || true); do
  kill "$pid" 2>/dev/null || true
done
sleep 1

rm -rf "$dest"
ditto "$src" "$dest"
echo "已安装: $dest"

# 删掉旧登录项和首次运行标记，让新实例启动时按 /Applications 路径重新注册
rm -f "$login_item" "$marker"

open "$dest"
sleep 5

if [ ! -f "$login_item" ]; then
  echo "登录项没有重新生成: $login_item" >&2
  echo "可在主界面「设置 → 悬浮计分球」里手动打开开机自启" >&2
  exit 1
fi

echo "登录项已重注册:"
cat "$login_item"
case "$(cat "$login_item")" in
  *"/Applications/$app_name"*) echo "OK：开机启动指向 /Applications" ;;
  *) echo "警告：plist 里的路径仍然不是 /Applications" >&2; exit 1 ;;
esac
