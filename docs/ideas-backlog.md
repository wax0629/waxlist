# 想法与后续 backlog

> **用途：** 随手记录产品/技术/体验想法。  
> **规则：** 写在这里 **不等于** 要做；进开发前须升格到 `spec-v0.x` 并有 DoD。  
> **状态：** `inbox` 随手记 → `candidate` 下版想评估 → `planned` 已进某版规格 → `done` / `dropped`

---

## 怎么记一条（复制模板）

```markdown
### [短标题]
- **状态：** inbox
- **大概版本：** v0.2 / 远期 / 未知
- **一句话：** 
- **为什么（用户/作品集/自己）：** 
- **备注 / 风险：** 
- **日期：** YYYY-MM-DD
```

---

## 下一版优先（你已点名）

| 优先级 | 想法 | 为什么现在做 | 设计笔记 / 规格 |
|--------|------|--------------|-----------------|
| **P0** | **搜索机制强化**（需求 → Intent → query 族 → 过滤重排 → 短名单） | 否则与用户自己搜 YouTube 差异弱 | [search-strategy.md](./search-strategy.md) |
| **P1** | **优化 UI**（更接近 Suno 气质、策略/理解可视化、卡片与对话层级） | 可演示性与信任感；展示搜索策略依赖 P0 字段 | 待 `spec-v0.2` |

### 1. 搜索机制强化

- **状态：** candidate（优先）  
- **大概版本：** v0.2  
- **一句话：** 把用户口语/参考曲稳定翻译成「伴奏域」多路检索策略，再过滤重排成短名单，而不是单次裸搜。  
- **为什么：**  
  - 用户自己搜要会英文化、会试词、会筛噪音  
  - 产品价值应在：**领域先验（type beat）+ 多 query + 筛排 + 可解释 + 多轮约束**  
  - 说不清「需求→关键词」映射，就只是 YouTube 套壳  
- **备注 / 风险：**  
  - 详见 [search-strategy.md](./search-strategy.md)  
  - 需避免 LLM 编造非召回结果；query 与 reason 可观测  
  - 可与 UI 展示「本轮检索词 / 我的理解」一起做  
- **日期：** 2026-08-03  

### 2. 优化 UI

- **状态：** candidate  
- **大概版本：** v0.2  
- **一句话：** 在现有暗色对话 + 卡片基础上，提升质感、信息层级，并可视化 Agent 理解与搜索策略。  
- **为什么：** 视觉参考 Suno 仍有差距；搜索机制升级后需要 UI 承载「理解 / 检索词 / 短名单」否则用户感知不到差异。  
- **备注 / 风险：**  
  - 不像素抄 Suno  
  - 建议与搜索机制同一版：至少展示 Intent 复述 + queries_used  
  - 可含：加载态、卡片排版、空状态、动效节奏  
- **日期：** 2026-08-03  

---

## Inbox（随手记）

> 把后续想法直接贴在下面，不必排好序。

<!-- 在此追加 -->

---

## 已从构思落入文档、但未进实现

| 想法 | 出处 | 建议版本 | 状态 |
|------|------|----------|------|
| `/explore` 地下精选只读列表 | product / underground | v0.2+ | candidate |
| 用户打分 + 登录 | underground | v0.3 | candidate |
| 发行详情 → `/chat?ref=` 弱连接 | IA | v0.3 | candidate |
| Agent 荐专附加能力 | product §8.4 | 远期 | candidate |
| BeatStars / B 站等多源 | product 内容源 | v0.2+ | candidate |
| 会话 shortlist 收藏抽屉 | product | v0.2 | candidate |
| 跨会话偏好 | product 以后 | 远期 | candidate |
| 参考音频文件上传 | product 以后 | 远期 | candidate |
| 流式对话输出 | 体验 | v0.2 | candidate |
| 部署公开 Demo（Vercel 等） | 工程 | v0.2 | candidate |
| 轻量 eval / 日志可观测 | 与搜索机制强相关 | v0.2 | candidate |
| LangGraph 等重编排 | tech-decisions | 仅当图复杂 | dropped-unless-needed |

---

## 已完成（归档）

| 想法 | 完成于 | 说明 |
|------|--------|------|
| v0.1 找 beat 最小闭环 | 2026-08 | `/chat` + 会话 + YT + Agent tools |
| 技术选型 A–F | 2026-08 | 见 tech-decisions |
| 产品一站两页边界 | 2026-08 | 见 product-concept |
| 想法池 + 协作流程文档 | 2026-08 | process / ideas-backlog |

---

## 明确不记成「马上做」的坑

- 编曲 / 混音主流程  
- 灰产下载  
- 单对话里荐专 + 找 beat 双主路径  
- 像素级抄 Suno  

（原则见 product-concept / thinking-map。）
