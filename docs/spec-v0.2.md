# Beat Hunter — v0.2 可开发规格

> 版本：v0.2  
> 状态：**可开工**  
> 主题：**搜索机制可感知差异化** + **UI 承载理解与策略**  
> 继承：v0.1 已交付的 `/chat` 闭环、会话、YouTube、Agent tools  
> 依据：[search-strategy.md](./search-strategy.md)、[spec-v0.1.md](./spec-v0.1.md)、[ideas-backlog.md](./ideas-backlog.md)、[product-concept.md](./product-concept.md)、[tech-decisions.md](./tech-decisions.md)

---

## 1. 目标与非目标

### 1.1 一句话目标

让用户明显感到：**不是自己去 YouTube 盲搜**——系统先**理解需求**，再生成**多角度伴奏域检索词**，**过滤重排**后给出可解释短名单；UI 展示「我的理解」与「本轮检索策略」。

### 1.2 相对 v0.1 的增量

| 维度 | v0.1 | v0.2 |
|------|------|------|
| 需求理解 | 弱规则 / 模型自由发挥 | 稳定 **Intent** 结构 + 中文复述 |
| 检索词 | 易变成单次/随意 query | **2～4 条多角度 query 族**，伴奏域规范 |
| 结果质量 | 召回后弱筛 | **规则预筛 + 精排**，偏 type beat |
| 可解释 | 仅卡片 reason | reason + **queries_used** + intent 复述 |
| 可观测 | 几乎无 | 响应与日志含 intent / queries / 分数摘要 |
| UI | 可用暗色壳 | **策略可视化** + 层级/质感优化（仍参考 Suno，不抄站） |

### 1.3 本版必做（P0 + P1）

#### P0 搜索机制

| 能力 | 说明 |
|------|------|
| Intent 抽取 | 每轮输出结构化意图（规则 +/或 LLM） |
| Query Plan | 2～4 条**角度不同**的英文检索词 + 伴奏后缀策略 |
| Multi-query 召回 | 执行全部/预算内 query，合并去重 |
| 过滤 + 打分 | 伴奏向启发式；降权教程/合集/明显成品噪音 |
| 精排 + reason | 从候选池选 ≤5，中文 reason 点名用户约束 |
| 响应扩展字段 | `intent`、`intent_summary`、`queries_used`（必给前端） |
| Refine | 约束累积后重新 plan → 搜 → 排；策略展示同步更新 |

#### P1 UI

| 能力 | 说明 |
|------|------|
| 理解条 | 展示 `intent_summary`（「我理解：…」） |
| 策略折叠 | 展示本轮 `queries_used`（默认可折叠） |
| 卡片增强 | 封面、来源、reason 层级更清晰；空/加载/降级态 |
| 视觉抛光 | 间距、对比度、动效节奏；仍暗色、中文 |
| 不挡主路径 | 策略区可收起，不挤爆对话 |

### 1.4 本版明确不做

- `/explore` 真实策展与打分（仍可占位）  
- 第二真源（BeatStars / B 站 API）  
- 流式 token 输出（可后置；不阻塞本版）  
- 账号 / 跨会话偏好 / 支付  
- Agent 荐专  
- 像素级复刻 Suno  
- LangGraph  
- 完整离线 eval 平台（仅需**小样本手工/半自动抽检**，见 §10）

---

## 2. 技术基线

沿用 v0.1 / tech-decisions：

| 层 | 选型 |
|----|------|
| 前端 | Next.js + TS + Tailwind + Framer Motion |
| Agent | 自建薄编排 + tool calling |
| LLM | OpenAI 兼容（`OPENAI_API_KEY` / `XAI_API_KEY` + `LLM_BASE_URL` + `LLM_MODEL`） |
| 检索 | YouTube Data API 唯一真源 |
| 会话 | 服务端短期 Session（可继续进程 Map） |

### 2.1 架构原则（v0.2 强化）

```text
用户消息
  → buildIntent / updateIntent
  → planQueries(intent) → string[]   // 可 LLM 或规则，须符合规范
  → searchYouTube × N → hits[]
  → filterAndScore(hits, intent) → scored[]
  → rankAndExplain(scored) → BeatCandidate[]  // LLM 或规则
  → 返回 + intent_summary + queries_used
```

允许用 tools 实现，但**行为契约**以本节与 §6 为准，避免模型跳过 Intent/Query 直接乱搜。

推荐工具形态（可在 v0.1 tools 上演进）：

| Tool | v0.2 要求 |
|------|-----------|
| `parse_reference` | 同 v0.1，结果并入 intent.reference |
| `upsert_intent`（可选） | 写入/合并结构化 intent |
| `plan_queries` | **必须**产出 2～4 条合规 query（或编排层强制调用等价逻辑） |
| `search_youtube` | 同 v0.1；编排层可对 plan 结果批量调用 |
| `finalize_shortlist` | 仅允许使用本轮召回（且宜来自 score 池）的 video_id |

若继续「单 loop 自由 tool-calling」，须在 system prompt + 校验层保证：

1. 至少产生合法 `queries_used`  
2. finalize 的 id ∈ 本轮 hitIndex  
3. 响应带 `intent` / `intent_summary`  

---

## 3. 用户故事与验收路径

### US-1 描述需求且看到「理解」

**作为**歌手，**我希望**系统用一句话复述它理解的需求，**以便**确认没跑偏。

- 输入：`适合女声的慢热 R&B，鼓不要太抢`  
- 验收：  
  - 有 `intent_summary`（或 UI 等价文案）含女声/慢/R&B/鼓 中至少 2 类信号  
  - shortlist ≤5，可点开  
  - 至少一条 reason 触及上述约束之一  

### US-2 看到检索策略（非黑盒）

**作为**用户，**我希望**看到本轮实际用的搜索词，**以便**明白和自己搜的差别。

- 验收：UI 可展开看到 `queries_used`（≥2 条）  
- 验收：query **不是**用户中文原文整段；多数含 `type beat` / `instrumental` / `beat` 等伴奏域信号  

### US-3 多角度 query，而非复制粘贴

**作为**产品，**我们要求**同一轮 query 角度有区分。

- 验收：`queries_used` 两两之间不是仅差一个空格/标点；至少体现 2 种角度（如主风格 vs 约束强调，或主风格 vs 参考）  
- 可用启发式：规范化后编辑距离或 token Jaccard 相似度低于阈值（实现自定，写入测试）  

### US-4 结果更偏伴奏

**作为**歌手，**我希望**列表少出现教程/反应/整专直播。

- 验收：对固定 5 条用例人工抽检，shortlist 中标题含伴奏向信号的比例 **≥ 60%**（定义见 §7）  
- 无法达线时：文档记录已知限制 + 降级说明，不得静默假成功  

### US-5 参考链接路径

- 验收：YouTube 参考解析后，intent 含 reference 信息；summary 或 reason 体现参考；queries 中至少一条受 reference 影响（或 summary 说明如何用参考）  

### US-6 Refine

- 验收：同会话「鼓再轻一点 / 再快一点」后，`intent` 有更新，且 `queries_used` 或 shortlist 相对上轮有可见变化  

### US-7 降级不白屏

- 无 YT / 无 LLM / API 失败：有 `status` + warnings + 可读 UI；有 mock 或规则路径时标明  

### US-8 UI 主路径不被策略区打断

- 验收：策略区默认折叠或次级样式；首屏仍能快速看到卡片；移动宽度可用  

---

## 4. API 契约变更

### 4.1 `POST /api/chat` 响应（扩展，向后兼容）

在 v0.1 字段基础上**增加**：

```json
{
  "session_id": "uuid",
  "assistant_message": "文本",
  "candidates": [ /* BeatCandidate[] */ ],
  "status": "ok | need_clarification | degraded",
  "warnings": [],

  "intent": {
    "style": ["r&b"],
    "mood": ["warm"],
    "vocal": "female",
    "tempo": "slow",
    "avoid": ["heavy drums"],
    "purpose": "practice_singing",
    "free_text": "用户原话摘要",
    "reference": {
      "url": "…",
      "title": "…",
      "hints": ["…"]
    }
  },
  "intent_summary": "女声向、慢热 R&B、鼓点靠后；按 type beat / instrumental 检索。",
  "queries_used": [
    "slow rnb type beat soft drums female",
    "chill r&b instrumental light drums",
    "late night rnb beat soft percussion"
  ],
  "debug": {
    "recall_count": 18,
    "after_filter_count": 11
  }
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `intent` | 是* | 结构可部分为空；*degraded 时尽量给 |
| `intent_summary` | 是* | 中文一句或两句 |
| `queries_used` | 是* | 实际调用过的 query；mock 时可为计划 query |
| `debug` | 否 | 仅开发或 `?debug=1` 时返回，避免干扰演示 |

前端 v0.1 可忽略新字段；v0.2 UI **必须**使用 summary + queries。

### 4.2 Session

`Session.constraints` 升级为与 `intent` 对齐（可同构或迁移字段）。  
`GET /api/session/:id` 可附带 `last_intent` / `last_queries_used`（可选，利于刷新恢复展示）。

---

## 5. 数据模型（v0.2）

### 5.1 `SearchIntent`

```ts
interface SearchIntent {
  style?: string[];
  mood?: string[];
  vocal?: "female" | "male" | "any" | string;
  tempo?: "slow" | "mid" | "fast" | string;
  avoid?: string[];
  purpose?: string;
  free_text?: string;
  reference?: {
    url?: string;
    title?: string;
    hints?: string[];
  };
}
```

与 v0.1 `SessionConstraints` 合并：实现上可 **rename / 扩展同一对象**，避免两套并行。

### 5.2 `BeatCandidate`

保持 v0.1 字段；可选增加：

```ts
score?: number;           // 内部打分，默认不展示
match_tags?: string[];    // 如 ["soft-drums", "female-friendly"]
```

### 5.3 编排中间态（服务端）

```ts
interface QueryPlan {
  queries: string[];      // 2～4
  rationale?: string;     // 可选，不强制展示
}

interface ScoredHit {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
  score: number;
  score_reasons: string[];
}
```

---

## 6. 搜索机制规范（实现必须遵守）

详见 [search-strategy.md](./search-strategy.md)；本规格**可验收**条款如下。

### 6.1 Intent

- 每轮用户输入后更新 intent（merge，不丢上一轮 avoid/style，除非用户明确改口）  
- `intent_summary` 用中文，面向用户，不堆 JSON  

### 6.2 Query 族

| 规则 | 要求 |
|------|------|
| 条数 | 2～4（默认 3） |
| 语言 | 检索词以**英文**为主（专有风格词可保留） |
| 伴奏域 | 每条宜含 `type beat` / `instrumental` / `beat` 之一（或等价策略并在 debug 说明） |
| 禁止 | 整段中文用户原文作为唯一 query |
| 多样性 | 角度覆盖：主风格、约束强调、（若有）参考 中至少两类 |
| 长度 | 单条建议 ≤ 12 个 token 量级，避免散文 |

### 6.3 召回

- 对 `queries_used` 逐条 `search_youtube`（注意配额：默认每 query maxResults 5～8）  
- videoId 去重；保留首次命中来源 query（可选 debug）  

### 6.4 过滤与打分（规则层，必做）

**加分信号（示例）：**

- 标题匹配：`type beat`, `instrumental`, `beat`, `prod by`, `free for profit` 等  
- 与 intent.style / tempo / vocal 英文同义重叠  

**减分 / 强降权（示例）：**

- `tutorial`, `how to`, `reaction`, `full album`, `live concert`（无 beat 信号时）  
- 与 avoid 明显冲突的标题词（如 avoid heavy drums 且标题 `hard 808 drill`）  

输出：按 score 排序的池子（如 Top 12）再交给精排。

### 6.5 精排与 reason

- 最终 ≤5  
- `video_id` **必须**来自本轮召回集合  
- reason：中文 1～2 句，尽量点名 intent 中的具体约束  
- LLM 不可用时：规则 top5 + 模板 reason，`status: degraded`  

### 6.6 Refine

- 「再快一点」「鼓轻一点」等写入 intent，再跑完整 pipeline  
- 不得无视历史 intent 只根据最后一句搜  

---

## 7. UI 规格

### 7.1 信息架构（单轮助手回复）

```text
┌─────────────────────────────────────┐
│ 助手文案 assistant_message            │
├─────────────────────────────────────┤
│ 我的理解：intent_summary              │  ← 次级卡片/条
│ ▸ 本轮检索词 (N)                      │  ← 默认折叠
│     · query1                          │
│     · query2                          │
├─────────────────────────────────────┤
│ [BeatCard] [BeatCard] …               │
└─────────────────────────────────────┘
```

### 7.2 视觉与交互

| 项 | 要求 |
|----|------|
| 气质 | 继续暗色、氛围感；参考 Suno 的层级与留白，不抄组件 |
| 理解条 | 与气泡区分：更弱边框/更小字号 |
| 检索词 | mono 或小号字；可复制（可选） |
| 卡片 | 缩略图、title、channel、reason、youtube 标识 |
| 加载 | 明确「理解需求 → 检索 → 整理短名单」阶段文案（可轮播或固定一句） |
| 降级 | badge：正常 / 降级（沿用 v0.1 可增强） |
| 新会话 | 保留 |
| 建议 chip | 保留或按新文案微调 |

### 7.3 无障碍与性能

- 对比度可读  
- 策略区不阻挡发送  
- 动效不造成布局剧烈跳动（卡片入场可保留）  

---

## 8. 实现切片（建议顺序）

| 顺序 | 切片 | 完成标准 |
|------|------|----------|
| 1 | Intent 模型与 merge | Session 存 intent；规则抽取覆盖女声/慢/鼓等 |
| 2 | QueryPlan 规范化 | `planQueries` 输出 2～4 条合规 query；单测多样性 |
| 3 | filterAndScore | 伴奏向打分；单测加减分样例 |
| 4 | 编排接入 pipeline | Agent 或固定流水线产出 extended 响应 |
| 5 | API 字段 | `intent` / `intent_summary` / `queries_used` |
| 6 | UI 理解条 + 策略折叠 | US-1/2/8 |
| 7 | UI 卡片与加载抛光 | 质感达标（主观 + 对照 Suno 原则） |
| 8 | Refine 回归 | US-6 |
| 9 | 抽检 5 case | US-4 记录结果 |

---

## 9. 测试与抽检用例（最低集）

| ID | 用户输入 | 期望 intent 信号 | 期望 query 特征 |
|----|----------|------------------|-----------------|
| C1 | 适合女声的慢热 R&B，鼓不要太抢 | female, slow, r&b, avoid drums | soft/light + type beat |
| C2 | 偏暗的 trap soul，适合写词 | trap/soul, mood dark | trap soul type beat |
| C3 | （仅 YouTube 参考 URL） | reference.title 有值 | 含 reference 启发或 instrumental |
| C4 | 在 C1 后：再快一点 | tempo 倾向 fast | 相对 C1 query 有速度差异 |
| C5 | 教我编曲的视频 | 仍应偏 beat 检索或说明边界 | 不应只搜 tutorial |

---

## 10. 验收清单（DoD）

### 搜索

- [ ] Intent + summary 每轮可得  
- [ ] `queries_used` ≥2，合规（英文主、伴奏域、非中文原文）  
- [ ] Multi-query 去重召回  
- [ ] 规则 filter/score 生效（有单测或样例日志）  
- [ ] finalize 不引用未召回 id  
- [ ] Refine 更新 intent 与结果  
- [ ] 5 条抽检记录（可放 `docs/eval-v0.2.md` 或 PR 说明）  

### UI

- [ ] 展示 intent_summary  
- [ ] 可展开 queries_used  
- [ ] 卡片/加载/降级态完整  
- [ ] 暗色质感有可感知提升（对照 v0.1 截图）  

### 工程

- [ ] README 更新 v0.2 演示路径（含「看理解/看检索词」）  
- [ ] 密钥仍仅服务端  
- [ ] build 通过  

---

## 11. 演示脚本（v0.2 录屏）

1. 输入 C1 → 指着 **我的理解** 与 **检索词** → 点开一条 YouTube  
2. 贴参考链接 → 展示 reference 影响  
3. 说「鼓再轻、稍快点」→ 展示 intent/query/列表变化  

总时长 2～3 分钟；话术重点：**「不是替你打开 YouTube，而是把歌手话翻译成伴奏检索策略。」**

---

## 12. 风险

| 风险 | 对策 |
|------|------|
| 配额（多 query） | 限制 3 query × 5～8 results；缓存同 session 相同 query |
| 模型不遵守 query 规范 | 编排层校验失败则改用规则 `planQueries` |
| 过滤过猛空列表 | 放宽阈值并 degraded 提示；回退未过滤 top |
| UI 信息过载 | 策略默认折叠 |
| 与裸搜差异仍弱 | DoD 抽检不达标不宣称 v0.2 完成 |

---

## 13. 文档关系

| 文档 | 关系 |
|------|------|
| [search-strategy.md](./search-strategy.md) | 机制原理与差异论述；本 spec 是可验收子集 |
| [spec-v0.1.md](./spec-v0.1.md) | 已交付基线；不删除 |
| [ideas-backlog.md](./ideas-backlog.md) | P0/P1 升格为本 spec |
| 以后 `spec-v0.3` | explore 打分、多源等 |

---

## 14. 开工口令

实现顺序建议：**§8 切片 1→5（搜索契约）→ 6→7（UI）→ 8→9（验收）**。  
未完成 P0 字段前，不要只做视觉改版（否则仍难证明「不是套壳」）。
