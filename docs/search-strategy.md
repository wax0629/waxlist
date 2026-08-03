# 搜索机制：用户需求 → 检索词 → 短名单

> 状态：设计笔记；**可验收条款见 [spec-v0.2.md](./spec-v0.2.md)**  
> 核心问题：若只是「中文需求 → 拼几个英文词 → YouTube search」，和用户自己搜有何区别？

---

## 1. 问题陈述

用户说：

> 「适合女声的慢热 R&B，鼓不要太抢」

自己去 YouTube 往往要：

1. 猜英文检索词（`female rnb type beat soft drums`）  
2. 多试几种拼法  
3. 在噪音结果里自己筛（成品歌、直播、教程、合集）  
4. 听完不对再改词  

**v0.1 现状**已能搜，但差异化仍偏弱：模型/规则生成 query → 搜 → 写 reason。  
若 query 质量一般、排序随意，用户会感觉「套了个壳的 YouTube」。

产品要赢的不是「会调用 YouTube API」，而是：

> **把歌手口语 / 参考曲，稳定翻译成「伴奏域检索策略」，再收成可决策的短名单，并支持多轮收窄。**

---

## 2. 和「用户直接搜 YouTube」的差异（目标）

| 维度 | 用户自己搜 | Beat Hunter 应做到 |
|------|------------|-------------------|
| 语言 | 自己英文化 | 中文口语 → 伴奏域 query 族 |
| 领域先验 | 不一定知道 `type beat` / `instrumental` | **默认偏向伴奏结果**（词缀 + 过滤/重排） |
| 多试几次 | 手动改词 | 一轮内多 query 并行/串行，去重合并 |
| 参考曲 | 自己听完再想搜什么 | `parse_reference` → 风格 hints → query |
| 筛选 | 肉眼扫列表 | 排序：像伴奏、匹配约束、降权合集/教程 |
| 可解释 | 无 | 每条 `reason`：为何像你的需求 |
| 收窄 | 新开搜索 | 会话约束累积 + refine 改 query 再搜 |
| 输出形态 | 无限信息流 | **3～5 条短名单** 利于试唱决策 |

没有这些，「套壳 YouTube」批评成立。

---

## 3. 推荐流水线（规范目标形态）

```text
用户话语 / 参考 URL
        │
        ▼
┌───────────────────┐
│ 1. 理解 Intent      │  结构化：风格、情绪、人声向、速度、避开项、用途
│    + Reference      │  （可规则 + LLM；可展示给用户确认）
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 2. Query Plan       │  生成 2～4 条「不同角度」的检索词（不是同一句复制）
│    （伴奏域模板）   │  例：主风格 beat / 参考像 / 约束强调 / 备选同义
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 3. 召回 multi-query │  search_youtube × N，合并去重
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 4. 过滤 + 重排      │  伴奏向启发式 +（可选）LLM 精排写 reason
└─────────┬─────────┘
          ▼
     Shortlist 3～5
          │
          ▼
     用户 refine → 更新 Intent → 回到 2
```

### 3.1 Intent（需求结构化）示例

```ts
{
  style: ["r&b"],
  mood: ["melancholy", "warm"],
  vocal: "female",
  tempo: "slow",
  avoid: ["heavy drums", "aggressive 808"],
  purpose: "practice_singing",  // 试唱 / 填词 / 翻唱探索
  reference?: { title, hints[] }
}
```

用户可见的一句话复述（增强信任）：

> 我理解：女声向、慢热 R&B、鼓点靠后。将按 type beat / instrumental 检索。

### 3.2 Query 族（不要只生成 1 条）

同一 Intent 应拆成**角度不同**的 query，例如：

| 角度 | 示例 query |
|------|------------|
| 主风格 + 伴奏后缀 | `slow rnb type beat soft drums female` |
| 约束强调 | `chill r&b instrumental light drums` |
| 同义/邻域 | `late night rnb beat no hard 808` |
| 参考驱动 | `{ref_title 关键词} type beat`（去掉歌手名噪音时需清洗） |

**禁止：** 把用户中文原文整段塞进 YouTube（召回极差）。  
**禁止：** 三条 query 几乎相同只改一个词。

### 3.3 伴奏域过滤 / 重排信号（可规则先做）

**加分：**

- 标题含 `type beat` / `instrumental` / `beat` / `prod` / `free for profit` 等  
- 时长在合理区间（过长播客/合集降权）  
- 与 Intent 关键词重叠  

**减分 / 过滤：**

- `full album` / `live` / `tutorial` / `reaction` / `lyrics` 强成品向且无 beat 信号  
- 与「避开项」明显冲突（如用户要 soft drums，标题 `hard 808 drill`）  

LLM 精排：在规则筛后的 Top15 里选 5 条并写中文 reason（**video_id 必须来自召回**）。

### 3.4 对用户透明（差异感关键）

UI 建议展示（v0.2）：

1. **理解复述**（Intent 人话）  
2. **本轮用过的检索词**（可折叠「搜索策略」）  
3. **短名单 + reason**  
4. refine 时显示「已更新约束：…」  

用户看到「系统帮我英文化 + 多路试 + 筛过」，就不是裸搜。

---

## 4. 与 v0.1 实现的差距

| 环节 | v0.1 | 目标 |
|------|------|------|
| Intent | 弱规则 `mergeConstraints` | 稳定结构 + 可展示复述 |
| Query | 规则拼接 / 模型自由发挥 | **强制多角度 query 族 + 伴奏后缀规范** |
| 召回 | 多 query 有，但策略松 | 去重、配额可控、日志 |
| 过滤重排 | 弱 / 主要靠模型 finalize | **规则预筛 + 模型精排** 双层 |
| 透明 | 几乎不展示 query | 展示策略与理解 |
| Refine | 靠会话文本 | 约束累积可视化 |

---

## 5. 成功标准（以后写进 spec 时可用）

- 同一中文需求，系统 query **不是**用户原文直译单条  
- 短名单中 ≥N 条标题/形态偏伴奏（人工抽检）  
- reason 能点名用户约束（女声/慢/鼓轻等）至少一点  
- 用户完成 1 次 refine 后，query 或排序有可见变化  
- 盲测：比「只搜一句 `xxx type beat`」的默认 Top 结果更贴（小样本即可）

---

## 6. 建议落地顺序

1. **可观测：** 每轮 log / 返回 `queries_used` + `intent`（先不暴露复杂 UI）  
2. **Query 规范：** system prompt + 可选 `plan_queries` 工具强制输出 JSON 数组  
3. **规则重排：** 伴奏向打分，再交给 finalize  
4. **UI：** 展示「我的理解」+「检索词」  
5. **eval 小集：** 10 条固定中文 case，回归 query 质量  

对应 backlog：**搜索机制强化**；与 **优化 UI** 可并行（UI 展示策略依赖 1～4）。
