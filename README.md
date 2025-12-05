# ProdTask 生产管理系统

基于 React 的移动端优先生产任务管理系统。支持管理员发布任务、员工接单、AI 辅助描述完善、以及实时反馈沟通。

## ✨ 功能特点

- **角色权限管理**：
  - **管理员**：创建/删除任务、管理团队账号、查看所有进度、AI 辅助生成任务详情。
  - **员工**：查看分配任务、更新任务状态、提交反馈。
- **PWA 支持**：可添加到手机主屏幕，体验接近原生 App。
- **实时反馈**：内置任务评论系统，支持任务维度的沟通。
- **AI 智能集成**：使用 Google Gemini API 自动完善简短的任务指令。
- **交互体验**：包含操作音效、动画效果和白色清爽主题。
- **通知系统**：支持应用内红点通知及浏览器系统通知。

## 🚀 快速开始

本项目采用无构建（No-Build）的现代开发方式，直接使用 ES Modules。

### 1. 克隆项目
```bash
git clone https://github.com/your-username/prodtask.git
cd prodtask
```

### 2. 配置环境
本项目使用 Google Gemini API。在实际部署或本地运行时，请确保你有可用的 API Key。
*(注：在演示环境中，API Key 通常通过环境变量注入)*

### 3. 运行项目
由于使用了 ES Modules，你需要一个静态文件服务器来运行它。

**使用 Python (Mac/Linux/Windows):**
```bash
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

**使用 Node.js (npx):**
```bash
npx serve
```

## 📱 默认账号

为了方便测试，系统预置了以下账号（数据存储在 LocalStorage 中）：

- **管理员**: 
  - 姓名: `管理员 (Admin)` 
  - 密码: `admin`
- **员工**: 
  - 姓名: `李明 (员工)` 
  - 密码: `123`

## 🛠 技术栈

- **前端框架**: React 19
- **样式库**: Tailwind CSS
- **图标库**: Lucide React
- **AI 模型**: Google Gemini (via @google/genai)
- **运行环境**: 浏览器原生 ES Modules (无需 Webpack/Vite 打包)

## 📄 许可证

MIT License
