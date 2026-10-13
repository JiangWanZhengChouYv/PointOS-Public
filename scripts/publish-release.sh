#!/bin/sh
# 把 CI 产物 + 签名清单发成一个 GitHub Release，让桌面版的自动更新能读到。
#
# 用法：sh scripts/publish-release.sh v1.8.2 [可选：指定 workflow run id]
#
# 为什么要脚本：latest.json 里的 signature 字段必须是 .sig 文件的**内容**
# （不是 URL），资产 URL 又要对中文文件名做百分号编码，手工拼极易错。
# 脚本把这两处固化下来，并且每一步都对不上就失败退出。
set -eu

# 资产名是中文，URL 编码和文件名都要按 UTF-8 处理
LC_ALL=zh_CN.UTF-8
export LC_ALL

tag=${1:-}
run_id=${2:-}

if [ -z "$tag" ]; then
  echo "用法: sh scripts/publish-release.sh v1.8.2 [run-id]" >&2
  exit 1
fi

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
owner_repo=$(cd "$root" && gh repo view --json nameWithOwner --jq .nameWithOwner)
version=${tag#v}
work=/tmp/pointos-release-$version
rm -rf "$work"
mkdir -p "$work/mac" "$work/win"

if [ -z "$run_id" ]; then
  run_id=$(gh run list --repo "$owner_repo" --workflow desktop.yml --status success -L 1 --json databaseId --jq '.[0].databaseId')
fi
if [ -z "$run_id" ] || [ "$run_id" = "null" ]; then
  echo "找不到成功的 desktop 构建 run，先推 tag 触发 CI 再回来" >&2
  exit 1
fi
echo "使用 CI run: $run_id"

gh run download "$run_id" --repo "$owner_repo" -n desktop-aarch64-apple-darwin -D "$work/mac"
gh run download "$run_id" --repo "$owner_repo" -n desktop-x86_64-pc-windows-msvc -D "$work/win"

# macOS：自动更新吃 .app.tar.gz（不是 dmg）；Windows 吃 nsis 的 setup.exe
mac_bundle=$(find "$work/mac" -name '*.app.tar.gz' -type f | head -1)
mac_sig=$(find "$work/mac" -name '*.app.tar.gz.sig' -type f | head -1)
mac_dmg=$(find "$work/mac" -name '*.dmg' -type f | head -1)
win_exe=$(find "$work/win" -name '*-setup.exe' -type f | head -1)
win_sig=$(find "$work/win" -name '*-setup.exe.sig' -type f | head -1)

for f in "$mac_bundle" "$mac_sig" "$mac_dmg" "$win_exe" "$win_sig"; do
  if [ -z "$f" ] || [ ! -f "$f" ]; then
    echo "产物缺失：$f" >&2
    echo "检查 CI 是否用了带签名 env 的新版 workflow" >&2
    exit 1
  fi
done

# 插件解包时会丢掉压缩包第一层路径，所以根目录必须正好是那个 .app
mac_app_name=$(basename "$mac_bundle" | sed -E 's/\.app\.tar\.gz$//')
tar -tzf "$mac_bundle" | head -3 | grep -q "^${mac_app_name}\.app/" || {
  echo ".app.tar.gz 结构不对：根目录应该是 $mac_app_name.app/" >&2
  tar -tzf "$mac_bundle" | head -5 >&2
  exit 1
}

pub_date=$(date -u +%Y-%m-%dT%H:%M:%SZ)

python3 "$root/scripts/make-updater-manifest.py" \
  --version "$version" --tag "$tag" --repo "$owner_repo" --pub-date "$pub_date" \
  --mac-artifact "$mac_bundle" --mac-sig "$mac_sig" \
  --win-artifact "$win_exe" --win-sig "$win_sig" \
  --out "$work/latest.json"


echo "== 要上传的资产 =="
ls -1 "$work/mac" "$work/win" "$work/latest.json"

if ! gh release view "$tag" --repo "$owner_repo" >/dev/null 2>&1; then
  gh release create "$tag" --repo "$owner_repo" --title "v$version" \
    --notes "班级积分管理系统 v$version（更新内容见应用内「版本日志」）"
fi

# 逐个上传：glob 展开，文件名带空格或中文都不会被拆坏
for f in "$work/mac"/* "$work/win"/* "$work/latest.json"; do
  [ -f "$f" ] || continue
  gh release upload "$tag" "$f" --repo "$owner_repo" --clobber
done

# 发布后逐个 URL 验一遍：自动更新是拿这些地址下载的，404 就等于没更新
manifest_url="https://github.com/$owner_repo/releases/latest/download/latest.json"
for url in "$manifest_url" $(python3 -c "
import json;d=json.load(open('$work/latest.json',encoding='utf-8'))
[print(v['url']) for v in d['platforms'].values()]
"); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 30 "$url")
  echo "HTTP $code  $url"
  [ "$code" = "200" ] || { echo "更新地址不可用，Release 视为发布失败" >&2; exit 1; }
done

echo
echo "完成。桌面版下次启动会从这个清单里拿到 v$version："
echo "  $manifest_url"
