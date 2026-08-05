# 搜索排名逻辑（当前实现）

> 状态：与代码同步说明（Phase 1）  
> 代码：`src/lib/agent/pipeline.ts` · `plan-queries.ts` · `score.ts` · `producers.ts` · `rank-llm.ts`  
> 配置：`data/style-producers.json`

---

## 1. 总流程（不是「搜完按 YouTube 默认序」）

```text
用户消息
  → mergeIntent（规则理解）
  → planQueries（2～4 条多角度英文 query）
  → 对每条 query 调 YouTube search.list（各最多 6 条）
  → videoId 去重合并
  → filterAndScore（规则打分，降序）
  → 取 Top 5
  →（可选）LLM 只改 reason 文案，不改排序/id
  → 返回 shortlist + intent_summary + queries_used
```

**排名只发生在 `filterAndScore` 之后。**  
YouTube 返回顺序仅影响「同分时谁先出现」的次要因素（去重时保留首次命中）。

---

## 2. 检索词怎么来（影响召回池，间接影响能排到谁）

`planQueries(intent)` 生成 **2～4** 条，原则：

| 角度 | 内容示例 |
|------|----------|
| 主风格 + 约束 | `slow rnb female vocal soft drums type beat` |
| 情绪 / instrumental | `late night rnb soft drums instrumental` |
| 自由关键词 / 参考 | `udg type beat free` |
| 制作人先验（软） | `rnb type beat chris miles`（来自风格表，最多占槽） |

- 强制伴奏域后缀：`type beat` / `instrumental` / `beat`  
- **禁止**默认整轮变成 r&b（无风格时用 free 关键词或泛 hip hop）  
- 风格制作人：见 `data/style-producers.json`，每风格取前 1～2 人生成 query  

---

## 3. 打分公式（`filterAndScore`）

对每条 hit 从 **0** 起加减分，最后 **按 score 降序**。

### 3.1 加分（伴奏向 + 匹配）

| 条件 | 分值 | 说明 |
|------|------|------|
| 标题强匹配 `type beat` / `instrumental` | **+5** | 最强伴奏信号 |
| 标题含 beat / prod by / free for profit 等 | **+3** | |
| 仅描述/频道含上述信号 | **+1** | |
| 风格词命中标题/频道/描述 | **+1.5** / 风格 | 如 r&b、drill、underground |
| tempo=slow 且标题含 slow/chill/soft/night/lofi… | **+1.5** | |
| tempo=fast 且 fast/uptempo/energy/rage/drill… | **+1.5** | |
| vocal=female 且 female/girl/rnb… | **+1** | |
| mood=dark 且 dark/sad/moody… | **+1** | |
| avoid 含 heavy drums 且标题 soft/light drums | **+1.5** | |
| 参考曲标题 token 重叠 ≥2 | **+1** | |
| **制作人先验** 标题/频道命中别名 | **+boost**（配置，常 1.5～2） | 软加权 |

### 3.2 减分 / 丢弃

| 条件 | 分值 | 说明 |
|------|------|------|
| 教程/合集/mix/live/reaction 等，且**无**强 beat 信号 | **-5** | |
| 同上噪音 **且有** type beat 信号 | **-1.5** | 轻降权，不完全杀 |
| avoid heavy drums 且 hard/heavy drums | **-2** | |
| 最终 score ≤ -3 且标题无 beat 信号 | **直接丢弃** | 不进排序池 |

噪音关键词示例：`tutorial` `how to` `reaction` `full album` `live concert` `lyrics video` `karaoke` `mix 202x` `hours of` `compilation` `best of` …

### 3.3 排序与截断

1. 存活 hit 按 `score` **降序**  
2. 取 **Top 5** 作为 shortlist  
3. 若过滤后为空但召回非空 → **放宽**：全部 score=0 按原合并序截断（并 warning）

---

## 4. LLM 在排名里做什么 / 不做什么

| 做 | 不做 |
|----|------|
| 有 API key 时，为 Top5 **重写中文 reason** | **不改** video id、不改顺序、不引入未召回结果 |
| 失败则保留规则模板 reason | 不单独再搜一轮 |

---

## 5. 和「用户自己搜 YouTube」的差别（排名视角）

| YouTube 默认 | Beat Hunter |
|--------------|-------------|
| 单 query + 平台相关度 | 多 query 池 + **自有打分** |
| 教程/合集常混进 Top | 规则降权 / 丢弃 |
| 无风格制作人 know-how | 配置表 query + boost |
| 无「鼓要轻」约束 | avoid / tempo 进入加减分 |

---

## 6. 已知局限（待办可跟）

- 打分主要看**标题/频道字符串**，无音频分析、无播放量  
- 制作人名录小、需人工维护  
- 合集类 type beat mix 仍可能进榜（仅轻降权）  
- 同分时顺序依赖召回先后，未做二级排序（如时长、频道权威）  

后续可增强：时长特征、二级 sort key、eval 回归排名质量、制作人表扩充。

---

## 7. 相关文档

| 文档 | 关系 |
|------|------|
| [search-strategy.md](./search-strategy.md) | 产品策略与差异论述 |
| [spec-v0.2.md](./spec-v0.2.md) | 可验收条款 |
| [eval-phase1.md](./eval-phase1.md) | 回归 case |
| [ideas-backlog.md](./ideas-backlog.md) | 后续增强入口 |
