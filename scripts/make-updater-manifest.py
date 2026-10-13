#!/usr/bin/env python3
"""生成桌面版自动更新清单 latest.json。

signature 字段必须是 .sig 文件的内容（不是 URL）；资产 URL 里的中文文件名要百分号编码。
这两处是最容易手工写错的地方，所以单独成脚本，可以脱离发布流程单独跑、单独验。
"""
import argparse
import base64
import json
import urllib.parse


def read_signature(path):
    raw = open(path, encoding='utf-8').read().strip()
    # CI 产出的 .sig 是整体 base64 的一行；解出来才是 minisign 的签名块
    try:
        decoded = base64.b64decode(raw).decode('utf-8')
    except Exception:
        decoded = raw
    if 'trusted comment' not in decoded:
        raise SystemExit(f'{path} 不像 tauri 生成的签名文件')
    # 清单里要填的是 .sig 文件本身的内容，插件会再解一次 base64
    return raw


def bound_version(signature_content):
    decoded = base64.b64decode(signature_content.strip()).decode('utf-8', errors='replace')
    marker = 'version:'
    index = decoded.rindex(marker)
    tail = decoded[index + len(marker):]
    return tail.split('\t')[0].split('\n')[0].strip()


def entry(base_url, artifact, sig_path, expected_version, label):
    signature = read_signature(sig_path)
    name = artifact.rsplit('/', 1)[-1]
    bound = bound_version(signature)
    if bound != expected_version:
        raise SystemExit(
            f'{label} 的签名绑定版本是 {bound}，和清单里的 {expected_version} 不一致；'
            '客户端开了 requireSignedVersion 会直接拒绝这次更新'
        )
    return {'url': base_url + urllib.parse.quote(name), 'signature': signature}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--version', required=True)
    p.add_argument('--tag', required=True)
    p.add_argument('--repo', required=True, help='owner/name')
    p.add_argument('--pub-date', required=True)
    p.add_argument('--mac-artifact', required=True)
    p.add_argument('--mac-sig', required=True)
    p.add_argument('--win-artifact', required=True)
    p.add_argument('--win-sig', required=True)
    p.add_argument('--out', required=True)
    a = p.parse_args()

    base = f'https://github.com/{a.repo}/releases/download/{a.tag}/'
    manifest = {
        'version': a.version,
        'notes': f'v{a.version}',
        'pub_date': a.pub_date,
        'platforms': {
            'darwin-aarch64': entry(base, a.mac_artifact, a.mac_sig, a.version, 'macOS'),
            'windows-x86_64': entry(base, a.win_artifact, a.win_sig, a.version, 'Windows'),
        },
    }
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'latest.json 已写出: {a.out}')
    for key, value in manifest['platforms'].items():
        print(f'  {key}: {value["url"]}')


if __name__ == '__main__':
    main()
