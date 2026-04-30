# LLM HTTP Viewer
## 命令
```bash
# 开发
npm run dev
# 构建（含类型检查）
npm run build
# 预览构建产物
npm run preview
```
## 架构
纯客户端 SPA，无后端，所有解析在浏览器完成。

**数据层**
- `src/utils/har-parser.ts` — HAR 解析，输出 `ParsedEntry[]`；包含 cookies、timings、bodySize 等完整字段
- `src/utils/stream-parser.ts` — SSE 流解析，支持 OpenAI `choices[].delta.content` 和 Anthropic `content_block_delta`
- `src/utils/themes.ts` — 主题定义（11 个），用 `?inline` import CSS 后通过 `<style>` 标签动态注入

**组件层**
- `src/components/RequestPanel.tsx` — 请求面板，含 Body / Headers / Query / Cookies 四个 Tab
- `src/components/ResponsePanel.tsx` — 响应面板，含 Overview / Body / Headers / Cookies 四个 Tab
- `src/components/OverviewPanel.tsx` — 请求概览：URL、状态、协议、尺寸、时序可视化（含 TTFB）
- `src/components/JsonTreeView.tsx` — 递归 JSON 树；点击 string 触发 `onValueSelect`，点击 array 自动展开子项
- `src/components/StreamViewer.tsx` — 流式响应双视图（重建内容 / 原始分块），SSE/Raw 自动检测可手动覆盖
- `src/components/KVTable.tsx` — 共享键值表格组件（Headers/Query/Cookies 复用）
- `src/components/PreviewPanel.tsx` — Markdown 预览（react-markdown + remark-gfm + rehype-highlight）
- `src/components/ThemePicker.tsx` — 主题下拉选择器，位于顶部 header

**布局**：`allotment` 实现可拖拽分栏，左侧垂直分上下，右侧视选中状态动态增减垂直分栏。

## 约定
- 样式全局在 `App.css`，主题 CSS（markdown + highlight.js）在运行时通过 `themes.ts` 动态注入，不在 `main.tsx` 静态引入
- 不引入额外状态管理库，用 React useState + useCallback
- `ParsedEntry` 是贯穿全局的核心数据结构，定义在 `src/types.ts`
