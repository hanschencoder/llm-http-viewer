# LLM HTTP Viewer

调试 LLM API 时，HAR 文件里埋着完整的请求/响应记录，但原始 JSON 难以阅读——层层嵌套的 messages 数组、动辄数千行的流式分块、分散在不同字段里的 system prompt 和 tool 定义，靠肉眼翻 JSON 既慢又容易漏。

**LLM HTTP Viewer** 把 HAR 文件解析成交互式界面，让你快速定位问题、审查提示词、分析流式输出。

**典型使用场景：**
- 调试 LLM 应用时，检查实际发给模型的 messages 是否符合预期（system prompt、few-shot 示例、tool schema）
- 排查流式响应中断或格式异常，逐块查看 SSE 原始数据
- 对比不同请求的 prompt 差异，优化提示词工程
- 审查请求中的敏感信息泄露（API key、用户数据等）

纯客户端 SPA，所有解析在浏览器本地完成，数据不离开本机，可安全用于生产环境的 HAR 文件。

## 功能
- **拖拽上传** `.har` / `.json` 文件，即时解析，无需服务器
- **请求列表** 支持搜索过滤，显示 Method / URL / Status / 耗时
- **Request 面板**
  - Body：交互式 JSON 树，点击任意 string value 即时侧边预览
  - Headers / Query Params / Cookies
  - **提取提示词**：自动识别 OpenAI / Anthropic 格式，一键将 system、messages、tools 整合为带层级标题的 Markdown，支持 thinking、图片、工具调用等内容类型
- **Response 面板**
  - Overview：完整 URL、协议版本、状态码、请求/响应体大小、时序可视化（DNS / Connect / SSL / TTFB / Download）
  - Body：流式响应自动检测 SSE 格式（兼容 OpenAI 和 Anthropic），重建视图自动提取 Thinking / Tool Use / Response 分块并带标题分节展示；支持切换原始分块视图；非流式内容渲染 Markdown
  - Headers / Cookies
- **Markdown 预览**：带目录侧边栏（树形结构，支持折叠展开、点击跳转），一键复制全文
- **主题切换**：11 个预设配色（浅色：GitHub / Atom / Xcode / IntelliJ；深色：GitHub Dark / Dimmed / Tokyo Night / Nord / Rosé Pine / One Dark / Night Owl）
- 所有分栏均可拖拽调整大小

## 前置条件
Node.js 18+
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

产物在 `dist/` 目录，可直接部署到任意静态托管（Nginx、GitHub Pages、Cloudflare Pages 等）。

## 如何获取 HAR 文件

在 Chrome / Edge 开发者工具的 **Network** 面板中，右键任意请求 → **Save all as HAR with content**，或点击面板左上角下载图标导出。

## 技术栈
React 19 + TypeScript + Vite 8 + Allotment + react-markdown + remark-gfm + rehype-highlight + highlight.js + github-markdown-css
