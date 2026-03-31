# 班级积分管理系统

## 项目概述

班级积分管理系统是一个轻量级的 Web 应用，用于教师管理班级小组的积分，支持加分、减分、重置等操作，并提供数据导出导入功能。

### 主要功能

- 📊 小组积分管理：支持 7 个小组的积分跟踪
- ➕ 灵活的加减分操作：可选择不同分值进行加减
- 📱 响应式设计：适配不同设备屏幕
- 🎨 自定义壁纸：支持预设和自定义壁纸
- 💾 数据持久化：使用本地存储保存数据
- 📤 数据导出导入：支持 JSON 格式的数据备份和恢复
- 🌐 网络加速：优化全球访问速度
- 📱 离线访问：支持 Service Worker 离线功能

## 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **存储**：LocalStorage
- **性能优化**：Service Worker, 资源压缩, 图片懒加载
- **部署**：GitHub Pages

## 安装指南

### 方法一：直接访问

1. 访问 GitHub Pages 部署版本：[班级积分管理系统](https://jiangwanzhengchouyv.github.io/PointOS/)

### 方法二：本地部署

1. 克隆仓库：
   ```bash
   git clone https://github.com/jiangwanzhengchouyv/PointOS.git
   ```

2. 进入项目目录：
   ```bash
   cd PointOS
   ```

3. 打开 `index.html` 文件即可使用

## 使用说明

### 基本操作

1. **加分**：点击小组的「增加」按钮，选择加分值
2. **减分**：点击小组的「减少」按钮，选择减分值
3. **重置**：点击小组的「重置」按钮，将该小组积分重置为 0
4. **全部重置**：点击「全部重置」按钮，将所有小组积分重置为 0
5. **全员增加/减少**：点击「全员增加」或「全员减少」按钮，为所有小组添加或减少相同分值

### 高级功能

1. **设置**：点击「设置」按钮，可进行以下操作：
   - 网络加速设置
   - 自定义壁纸
   - 导出/导入数据
   - 检查更新

2. **评比**：点击「评比」按钮，系统会自动计算得分最高的小组，并重置所有积分

3. **数据管理**：
   - 导出 JSON：将当前积分数据导出为 JSON 文件
   - 导入 JSON：从 JSON 文件导入积分数据

## 性能优化

系统已实施以下性能优化措施：

1. **资源压缩**：CSS 和 JavaScript 文件已压缩
2. **图片懒加载**：壁纸图片采用懒加载方式
3. **缓存策略**：合理的 HTTP 缓存策略
4. **Service Worker**：支持离线访问
5. **CDN 加速**：优化全球访问速度

## 贡献指南

欢迎对项目进行贡献！以下是贡献步骤：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 联系方式

- 项目维护者：江晚正愁余
- GitHub：[jiangwanzhengchouyv](https://github.com/jiangwanzhengchouyv)

---

**感谢使用班级积分管理系统！** 🎉