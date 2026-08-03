# 技术与实现决策

> 状态：随对齐更新  
> 与 [thinking-map.md](./thinking-map.md) §7 对应  

---

## 已锁定

### A. 前端形态与视觉

| 项 | 结论 |
|----|------|
| 视觉参考 | **Suno**（[suno.com](https://suno.com/)）— 暗色、氛围感、结果卡片、创作向 AI 产品气质 |
| 工程栈（默认） | **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion** |
| 不优先 | 黑胶/唱盘拟物为主视觉（可后期点缀）；重 3D/WebGL 首期不做 |
| 说明 | 先对齐 Suno 的「质感与信息层级」，不像素级抄站；玻璃/卡片等手段服务于可读 shortlist |

**v0.1 UI 重点：** `/chat` 对话流 + 伴奏结果卡；顶栏简洁；暗色背景。

### B. Agent 运行时

| 项 | 结论 |
|----|------|
| 选型 | **自建薄编排 + 显式 tool calling** |
| 形态 | 服务端 `runTurn`：LLM ↔ tools 循环（parse / plan / search / rank / refine），设最大轮数 |
| 可加 | 需要流式对话 UI 时用 **Vercel AI SDK** 等薄封装，不改变工具边界 |
| 不做（v0.1） | **LangGraph** / 重型图编排 / 多 Agent 平台 — 图变复杂后再评估 |
| 原则 | 价值在 tools 与 shortlist 质量；编排保持可读、可 debug |

### C. 模型与密钥

| 项 | 结论 |
|----|------|
| 原则 | **Provider 可替换**；业务只依赖 chat + tool calling |
| 接口 | OpenAI 兼容（实现默认可 xAI：`XAI_API_KEY` + `https://api.x.ai/v1`） |
| 密钥 | **仅服务端**环境变量，不进前端包 |
| 模型 ID | 实现时再定具体名；业务代码不硬编码绑死一家 |

### D. 第一真实检索源

| 项 | 结论 |
|----|------|
| 真源 | **YouTube Data API**（唯一真实检索） |
| 其余源 | mock / 深链占位，v0.1 不接真 API |
| 密钥 | `YOUTUBE_API_KEY`（或等价）仅服务端 |

### E. 会话存储

| 项 | 结论 |
|----|------|
| 形态 | **服务端短期会话** |
| v0.1 实现 | 进程内 Map（或单文件/SQLite）；不必上 Redis |
| 目标 | 多轮 refine、刷新后仍可续聊（进程重启可丢，可接受） |

### F. 参考链接解析范围

| 项 | 结论 |
|----|------|
| YouTube | **深解析**（标题、频道、描述 hints → query） |
| 其他 URL | **降级**：当用户补充描述 / 尽力取标题，不承诺全平台解析 |
| 失败 | 提示后走纯自然语言检索，不白屏 |

---

## 非阻塞默认（可改，先当已定）

| # | 结论 |
|---|------|
| G | `/` → 重定向 `/chat` 或极简落地进 chat |
| H | 「地下精选」导航 v0.1 隐藏或「即将推出」 |
| I | UI 中文优先 |
| J | 默认 shortlist **5** 条 |
| K | 信息不足最多追问 **1** 次，否则先出结果 |
| L | 演示三条路径：描述 / 参考链接 / refine |

---

## 变更记录

| 日期 | 项 | 内容 |
|------|-----|------|
| 2026-08-03 | A | 视觉参考 Suno；栈默认 Next + TW + shadcn + Motion |
| 2026-08-03 | B | 自建薄编排 + tool calling；LangGraph 不进 v0.1 |
| 2026-08-03 | C–F | 全按默认：可换 LLM / YT 真源 / 服务端会话 / YT 深解析+其他降级 |
