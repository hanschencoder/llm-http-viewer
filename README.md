# LLM HTTP Viewer
解析 HAR 文件，可视化 LLM API 的 HTTP 请求与响应。
## 功能
- 拖拽或点击上传 `.har` 文件，纯客户端解析，无需后端
- 请求列表支持搜索过滤，显示 Method / URL / Status / 耗时
- **Request 面板**：Body（交互式 JSON 树）/ Headers / Query / Cookies 四个 Tab；点击任意 string value 右侧即时 Markdown 预览
- **Response 面板**：
  - Overview：完整 URL、协议版本、状态码、请求/响应体大小、时序可视化（DNS / Connect / SSL / TTFB / Download）
  - Body：流式响应自动检测 SSE 格式（兼容 OpenAI 和 Anthropic），支持原始分块和完整拼接视图；非流式渲染 Markdown
  - Headers / Cookies
- **主题切换**：11 个预设配色（浅色：GitHub / Atom / Xcode / IntelliJ；深色：GitHub Dark / Dimmed / Tokyo Night / Nord / Rosé Pine / One Dark / Night Owl）
- 所有分栏均可拖拽调整大小
## 快速开始
```bash
npm install
npm run dev
```
浏览器打开 `http://localhost:5173`，将 `.har` 文件拖入页面即可。
## 构建
```bash
npm run build
```
产物在 `dist/` 目录，可直接部署到任意静态托管。
## 技术栈
React 19 + TypeScript + Vite 8 + Allotment + react-markdown + remark-gfm + rehype-highlight + highlight.js + github-markdown-css
