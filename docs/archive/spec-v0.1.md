# Beat Hunter — v0.1 可开发规格

> 版本：v0.1  
> 状态：**可开工**  
> 依据：[product-concept.md](./product-concept.md)、[thinking-map.md](./thinking-map.md)、[tech-decisions.md](./tech-decisions.md)、[information-architecture.md](./information-architecture.md)

---

## 1. 目标与非目标

### 1.1 一句话目标

在 Web `/chat` 上交付 **找伴奏 Agent 最小闭环**：自然语言和/或参考链接 → **可试听 shortlist（默认 5 条）** → 多轮 refine；视觉气质参考 **Suno**（暗色、结果卡）。

### 1.2 本版必做

| 能力 | 说明 |
|------|------|
| 站点壳 | 暗色布局 + 顶栏「找伴奏」；地下精选可隐藏或「即将推出」 |
| `/chat` UI | 消息流、输入框、加载态、伴奏结果卡片 |
| Agent 编排 | 自建薄编排 + tool calling（非 LangGraph） |
| 参考解析 | YouTube 深解析；其他 URL 降级 |
| 检索 | **YouTube Data API** 唯一真源；其余源可不实现 |
| Shortlist | 结构化 `BeatCandidate[]` + `reason` + 外链 |
| 多轮 | 基于反馈再检索/重排 |
| 会话 | 服务端短期会话（进程内存即可） |
| 合规文案 | 试听参考；商用以源站为准 |

### 1.3 本版明确不做

- Agent 推荐专辑  
- `/explore` 真实数据、打分、登录  
- BeatStars / Bilibili 真 API  
- 账号体系、支付、跨会话偏好  
- 编曲 / 混音 / 上传音频文件  
- 灰产下载  
- 像素级复刻 Suno  

---

## 2. 技术基线（已锁定）

| 层 | 选型 |
|----|------|
| 前端 | Next.js App Router + TypeScript + Tailwind + shadcn/ui + Framer Motion |
| 视觉 | 参考 [Suno](https://suno.com/)，中文 UI |
| Agent | 服务端自建 `runTurn` + tools 循环；可选 Vercel AI SDK 做流式 |
| LLM | OpenAI 兼容；密钥仅服务端；默认可 xAI（`XAI_API_KEY`） |
| 检索 | YouTube Data API（`YOUTUBE_API_KEY`） |
| 会话 | 服务端进程内 Map（sessionId → Session） |
| 首页 | `/` → redirect `/chat`（或极简落地再进 chat） |

环境变量（示例名，勿提交真实值）：

```text
XAI_API_KEY=
YOUTUBE_API_KEY=
# 可选
LLM_BASE_URL=https://api.x.ai/v1
LLM_MODEL=          # 实现时填具体模型
```

---

## 3. 用户故事与验收路径

### US-1 纯描述找伴奏

**作为**歌手，**我希望**用一句话描述气质，**以便**马上拿到几条可点开试听的伴奏。

- 示例输入：`找适合女声的慢热 R&B 伴奏，鼓不要太抢`  
- 验收：一轮内返回 **≤5** 张卡片；每张含标题、来源、可点击 `url`、至少一行 `reason`  

### US-2 参考链接找伴奏

**作为**歌手，**我希望**粘贴参考歌链接，**以便**按相似气质找 instrumental / type beat。

- 示例：YouTube 成品歌或 type beat URL + 可选补充  
- 验收：解析成功时回复体现参考曲信息；卡片 `reason` 含风格相关语义；失败时降级自然语言并说明  

### US-3 多轮 refine

**作为**歌手，**我希望**说「再快一点 / 鼓轻一点」，**以便**短名单更贴。

- 验收：同一 `sessionId` 下第二轮结果相对第一轮有可见变化（重搜或重排）；不丢会话上下文  

### US-4 失败可理解

- YouTube / LLM 失败：UI 有错误或降级文案，**不白屏**  
- 无效 URL：提示后可继续纯描述搜索  

---

## 4. 页面与交互

### 4.1 路由

| 路径 | 行为 |
|------|------|
| `/` | 重定向 `/chat` 或极简落地 |
| `/chat` | 主产品 |
| `/chat?ref_url=<url>` | 可选：预填参考链接并自动或提示首轮检索 |
| `/explore` | v0.1 可不实现；或占位页「即将推出」 |

### 4.2 `/chat` 布局（逻辑区）

```text
┌─────────────────────────────────────────┐
│  Logo / Beat Hunter    [找伴奏]  (精选灰) │
├─────────────────────────────────────────┤
│                                         │
│  消息流                                  │
│   · 用户气泡                             │
│   · 助手文本                             │
│   · 伴奏卡片网格（嵌在助手轮次内）         │
│                                         │
├─────────────────────────────────────────┤
│  [输入框........................] [发送]  │
│  小字：结果仅供试听参考，商用请以源站为准   │
└─────────────────────────────────────────┘
```

### 4.3 伴奏卡片字段（展示）

| 字段 | 必填 | 说明 |
|------|------|------|
| title | 是 | 标题 |
| source | 是 | 如 `youtube` |
| url | 是 | 新标签打开 |
| reason | 是 | 为何推荐（1～2 句） |
| thumbnail | 否 | 有则显示 |
| license_hint | 否 | 默认可静态「请以源站授权为准」 |

交互：整卡或主按钮「打开源站」；v0.1 不做站内完整播放器（可用 YouTube 外链；嵌入播放器为可选增强）。

### 4.4 交互原则

- 信息不足时最多追问 **1** 个关键问题，否则直接出 shortlist  
- 默认条数 **5**（最少 3，最多 5）  
- 加载中禁用重复狂点发送或合并为单 flight  

---

## 5. 数据模型（v0.1）

### 5.1 `BeatCandidate`

```ts
type BeatSource = "youtube" | "mock";

interface BeatCandidate {
  id: string;              // 稳定 id，如 yt:<videoId>
  title: string;
  source: BeatSource;
  url: string;
  reason: string;
  thumbnail?: string;
  license_hint?: string;
  // 可选扩展
  channel_title?: string;
  duration_sec?: number;
  tags?: string[];
}
```

### 5.2 `Session`

```ts
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;      // ISO
  candidates?: BeatCandidate[];  // 该轮若产出 shortlist
}

interface SessionConstraints {
  style?: string[];
  mood?: string[];
  vocal?: string;          // 如 female / male / any
  tempo?: string;          // slow | mid | fast | relative hints
  avoid?: string[];        // 如 "heavy drums"
  free_text?: string;
  reference?: {
    url?: string;
    title?: string;
    hints?: string[];
  };
}

interface Session {
  id: string;
  messages: ChatMessage[];
  constraints: SessionConstraints;
  last_shortlist: BeatCandidate[];
  created_at: string;
  updated_at: string;
}
```

### 5.3 存储

- `Map<sessionId, Session>` 于 Node 进程  
- 无持久化要求；进程重启会话可丢  
- 客户端持有 `sessionId`（localStorage 或 cookie 均可）  

---

## 6. API 草图

Base：同源 Next Route Handlers，如 `/api/...`。

### 6.1 `POST /api/chat`

创建会话首条或续聊。

**Request**

```json
{
  "session_id": "可选，空则新建",
  "message": "用户自然语言",
  "ref_url": "可选参考链接"
}
```

**Response 200**

```json
{
  "session_id": "uuid",
  "assistant_message": "文本回复",
  "candidates": [ /* BeatCandidate[]，可能为空（仅追问时） */ ],
  "status": "ok" | "need_clarification" | "degraded",
  "warnings": ["可选说明，如参考解析失败"]
}
```

**错误**

| HTTP | 场景 |
|------|------|
| 400 | 空 message 且无 ref_url |
| 502/503 | 上游 LLM/YouTube 不可用（body 含可读 `error`） |

流式（可选增强）：`POST /api/chat/stream` SSE/AI SDK data stream；**非 v0.1 硬门槛**，可先 JSON 一轮返回。

### 6.2 `GET /api/session/:id`

- 返回该会话 messages + last_shortlist  
- 用于刷新恢复 UI  
- 404：会话不存在（提示新建）  

---

## 7. Agent 与工具

### 7.1 编排

```text
runTurn(session, userMessage, refUrl?):
  更新 constraints（可 LLM 或规则）
  loop max_tool_rounds (建议 4～6):
    llm(messages, tools)
    if tool_calls → 执行 → append tool results
    else → 解析最终回复与 candidates → break
  写入 session，返回 assistant + candidates
```

规则：

- 工具失败不抛垮整轮：写入 warning，尽量仍返回部分结果或说明  
- 禁止工具：荐专、explore 写入、下载音频  

### 7.2 工具清单（v0.1）

| Tool | 入参（逻辑） | 出参（逻辑） | 实现要点 |
|------|--------------|--------------|----------|
| `parse_reference` | `url` | title, channel?, hints[] | YT：Data API 或 oEmbed；非 YT：降级 |
| `plan_queries` | constraints | queries: string[] | 可 LLM；生成 1～3 条检索词（含 type beat / instrumental 等） |
| `search_youtube` | `query`, `max_results?` | raw hits[] | YouTube Search API；过滤明显无关可后置 |
| `rank_and_explain` | hits[], constraints | BeatCandidate[] | LLM 或启发式排序 + 写 reason；截断至 ≤5 |
| `refine_constraints` | feedback, prev | updated constraints | 将「更快/鼓轻」等合并进 constraints |

实现上可将 `plan` + `rank` 与主 LLM 合并，但**对外行为**须等价于上表能力。

### 7.3 System 提示要点（逻辑，非最终文案）

- 角色：帮歌手找**可试听伴奏**，输出短名单而非长文攻略  
- 默认给结果；最多追问 1 次  
- 每条推荐必须能对应 tool 检索到的真实 url  
- 说明试听 vs 商用边界  
- 不做专辑推荐主任务  

---

## 8. YouTube 接入要点

| 项 | 说明 |
|----|------|
| 用途 | `search.list` 为主；解析可用 `videos.list` / oEmbed |
| Query 习惯 | 附带 `type beat` / `instrumental` / `beat` 等（由 plan 决定） |
| 配额 | 开发注意日配额；失败时 `status: degraded` |
| 合规 | 只链出官方 watch URL；不提供下载；UI 声明试听参考 |

Mock：无 key 时允许 `source: "mock"` 假数据跑通 UI（README 注明 demo 模式）。

---

## 9. 前端实现切片（建议顺序）

| 顺序 | 切片 | 完成标准 |
|------|------|----------|
| 1 | 工程初始化 | Next + TW + 基础布局，视觉偏 Suno 暗色 |
| 2 | `/chat` 静态 UI | 假消息 + 假 `BeatCandidate` 卡片 |
| 3 | Session API | 创建/读取会话 |
| 4 | Chat API 无 LLM | 固定 mock shortlist 打通前后端 |
| 5 | `search_youtube` | 真检索 → 卡片真实链接 |
| 6 | LLM + tools 闭环 | 描述 / 参考 / refine 三条路径 |
| 7 | 降级与文案 | 错误态、合规 footer |
| 8 | 动效抛光 | Motion 入场；不挡功能 |

---

## 10. 验收清单（DoD）

### 功能

- [x] US-1 纯描述 → ≤5 条可点开 shortlist  
- [x] US-2 YouTube 参考链接 → reason 含风格相关语义  
- [x] US-3 同会话 refine 一轮可见变化  
- [x] US-4 API/解析失败有说明、不白屏  
- [x] 刷新后（进程未重启）可用 sessionId 恢复消息  
- [x] `/chat?ref_url=` 深链预检索  

### 工程

- [x] 密钥不进客户端 bundle  
- [x] README：如何配置 env、如何跑三条演示路径  
- [x] TypeScript 核心类型与 `BeatCandidate` 一致  

### 体验

- [x] 中文 UI  
- [x] 暗色 + 结果卡可读（对比度可用）  
- [x] 合规小字可见  
- [x] 卡片入场动效（Framer Motion）  

---

## 11. 演示脚本（作品集 / 录屏）

1. **描述：** 输入女声慢热 R&B → 展示卡片 → 点开一条 YouTube  
2. **参考：** 贴参考曲链接 → 展示「基于 xxx」→ shortlist  
3. **Refine：** 「鼓再轻一点，节奏稍快」→ 新 shortlist  

总时长建议 2～3 分钟内讲完。

---

## 12. 风险与降级

| 风险 | 降级 |
|------|------|
| 无 YT key / 配额用尽 | mock candidates + 明显 demo 标记 |
| LLM 不可用 | 规则 plan + 启发式 rank（无文采 reason 可模板化） |
| 参考非 YT | 降级提示 + 当文本约束 |
| 结果不准 | 强调 refine；不追求一轮完美 |

---

## 13. 后续（不在本规格）

- v0.2：多源、会话收藏抽屉、可观测  
- explore 只读精选 → 打分 → ref 跳转  
- Agent 荐专附加能力  
- LangGraph 仅当编排复杂度显著上升时再评估  

---

## 14. 文档索引

| 文档 | 关系 |
|------|------|
| 本文 | v0.1 开发与验收契约 |
| [tech-decisions.md](./tech-decisions.md) | A–F 选型 |
| [product-concept.md](./product-concept.md) | 产品为什么 |
| [information-architecture.md](./information-architecture.md) | 路由与导航 |
| `agent-tools.md` / `data-model.md` | 可选再拆；本规格 §5–7 已够开工 |
