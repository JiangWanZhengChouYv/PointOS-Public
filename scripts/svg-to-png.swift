#!/usr/bin/env xcrun swift
// 把 SVG 光栅化成带透明通道的 PNG。
// 用法: xcrun swift scripts/svg-to-png.swift <in.svg> <out.png> <边长>
//
// 为什么不用 qlmanage：QuickLook 生成缩略图时会把 SVG 合成到白底，
// 圆角外那一圈会变成不透明的白，烤进 .ico / .icns 后就是应用图标的白边框。
import AppKit
import Foundation

let args = CommandLine.arguments
guard args.count >= 4, let side = Int(args[3]), side > 0 else {
  FileHandle.standardError.write(Data("用法: svg-to-png.swift <in.svg> <out.png> <边长>\n".utf8))
  exit(2)
}

guard let image = NSImage(contentsOfFile: args[1]) else {
  FileHandle.standardError.write(Data("读不到 SVG: \(args[1])\n".utf8))
  exit(1)
}

guard let rep = NSBitmapImageRep(
  bitmapDataPlanes: nil,
  pixelsWide: side,
  pixelsHigh: side,
  bitsPerSample: 8,
  samplesPerPixel: 4,
  hasAlpha: true,
  isPlanar: false,
  colorSpaceName: .deviceRGB,
  bytesPerRow: 0,
  bitsPerPixel: 0
) else {
  FileHandle.standardError.write(Data("无法创建 \(side)x\(side) 位图\n".utf8))
  exit(1)
}

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
image.draw(in: NSRect(x: 0, y: 0, width: side, height: side))
NSGraphicsContext.restoreGraphicsState()

guard let png = rep.representation(using: .png, properties: [:]) else {
  FileHandle.standardError.write(Data("PNG 编码失败\n".utf8))
  exit(1)
}

do {
  try png.write(to: URL(fileURLWithPath: args[2]))
} catch {
  FileHandle.standardError.write(Data("写入失败: \(error)\n".utf8))
  exit(1)
}

print("已生成 \(args[2]) \(side)x\(side) 角alpha=\(String(format: "%.2f", rep.colorAt(x: 0, y: 0)?.alphaComponent ?? -1))")
