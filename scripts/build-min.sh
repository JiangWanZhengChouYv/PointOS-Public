#!/bin/sh
# 生成 web/ 下的 .min 产物。
#
# 只做保守压缩：删整行注释、删独立块注释、删行首行尾空白和空行。
# 不合并行、不动行内空白、不重命名标识符，所以不会触发 ASI 差异，也不会
# 碰到字符串里的 // （URL）。压缩率低于 terser，但零依赖、可重复、可验证。
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root/web"

awk '
BEGIN { inblock = 0 }
{
  line = $0

  if (inblock) {
    if (index(line, "*/") > 0) {
      inblock = 0
      sub(/^.*\*\//, "", line)
      if (line ~ /^[ \t]*$/) next
    } else {
      next
    }
  } else if (line ~ /^[ \t]*\/\*/) {
    if (index(substr(line, index(line, "/*") + 2), "*/") == 0) { inblock = 1; next }
    tail = line
    sub(/^[ \t]*\/\*.*\*\//, "", tail)
    if (tail ~ /^[ \t]*$/) next
    # 注释后面还有代码：整行原样保留，宁可不压也不改语义
  }

  if (line ~ /^[ \t]*\/\//) next

  sub(/^[ \t]+/, "", line)
  sub(/[ \t]+$/, "", line)
  if (line == "") next
  print line
}
' script.js > script.min.js

awk '
BEGIN { inblock = 0 }
{
  line = $0

  if (inblock) {
    if (index(line, "*/") > 0) {
      inblock = 0
      sub(/^.*\*\//, "", line)
      if (line ~ /^[ \t]*$/) next
    } else {
      next
    }
  } else if (line ~ /^[ \t]*\/\*/) {
    if (index(substr(line, index(line, "/*") + 2), "*/") == 0) { inblock = 1; next }
    tail = line
    sub(/^[ \t]*\/\*.*\*\//, "", tail)
    if (tail ~ /^[ \t]*$/) next
  }

  sub(/^[ \t]+/, "", line)
  sub(/[ \t]+$/, "", line)
  if (line == "") next
  print line
}
' style.css > style.min.css

# 页面本身只删整行 HTML 注释与缩进；这个文件里没有 pre/textarea
awk '
{
  line = $0
  if (line ~ /^[ \t]*<!--.*-->$/) next
  sub(/^[ \t]+/, "", line)
  sub(/[ \t]+$/, "", line)
  if (line == "") next
  print line
}
' index.html > index.min.html

echo "压缩结果："
for f in script.min.js style.min.css index.min.html; do
  printf '  %-16s %s 字节\n' "$f" "$(wc -c < "$f" | tr -d ' ')"
done
