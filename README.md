# Beat Hunter

面向歌手的**伴奏发现** Web 产品，并规划同站的中文地下发行精选模块。

## 一句话

- **找伴奏（主线）：** 自然语言 + 参考曲链接 → 多平台可试听短名单（对话 Agent）  
- **地下精选（二期）：** 中文地下优质发行整理 + 用户打分（独立页面）  

## 本地开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)（会跳到 `/chat`）。

复制环境变量模板（接 API 时再填）：

```bash
cp .env.example .env.local
```

当前阶段（**v0.2 搜索机制**）：

- Intent 理解 → 多角度伴奏域 query → YouTube 多路召回 → 过滤打分 → 短名单  
- UI 展示「我的理解」+ 可展开「本轮检索词」  
- 无 YouTube Key 时 mock 降级；会话 `session_id` 在 `localStorage`

### 环境变量

```bash
cp .env.example .env.local
```

| 变量 | 用途 |
|------|------|
| `YOUTUBE_API_KEY` | 真检索（[获取说明](./docs/youtube-api-setup.md)） |
| `XAI_API_KEY` | LLM tool calling（OpenAI 兼容，默认 xAI） |
| `LLM_BASE_URL` | 默认 `https://api.x.ai/v1` |
| `LLM_MODEL` | 模型 ID（如控制台里的 grok 模型名） |

```bash
npm run dev
```

### 演示三条路径（v0.2）

1. **描述：** `适合女声的慢热 R&B，鼓别太抢` → 看 **我的理解** + 展开 **检索词** → 点开卡片  
2. **参考：** 粘贴 YouTube 链接，或 `/chat?ref_url=https://www.youtube.com/watch?v=VIDEO_ID`  
3. **Refine：** `再快一点` / `鼓再轻一点` → 理解与检索词/列表变化  

快捷建议 chip 可一点发送。

## 站点结构

| 页面 | 路径 | 说明 |
|------|------|------|
| 找伴奏 | `/chat` | 主产品，v0.1 |
| 地下精选 | `/explore` | 二期；导航暂「即将推出」 |

## 文档

| 文档 | 说明 |
|------|------|
| [完整产品成熟度](./docs/product-maturity.md) | **正式产品路线**（非玩具）：阶段与出口标准 |
| [大功能与主流程](./docs/product-flows.md) | **整站地图 + 四条主流程**（先对齐大块） |
| [功能清单](./docs/feature-inventory.md) | 细项清单（大块对齐后再拆） |
| [协作流程](./docs/process.md) | 文档分层、何时写 spec、想法如何进开发 |
| [想法 backlog](./docs/ideas-backlog.md) | **后续想法记这里**（不等于要做） |
| [搜索机制笔记](./docs/search-strategy.md) | 需求→检索词→短名单，与裸搜 YouTube 的差异 |
| [搜索排名逻辑](./docs/ranking-logic.md) | **当前加减分、制作人先验、LLM 边界** |
| [设计系统](./docs/design-system.md) | 色板（暖墨+金）· 字体（Syne / Noto SC / JetBrains） |
| [思路整理图](./docs/thinking-map.md) | 已定结论、v0.1 切口 |
| [技术与实现决策](./docs/tech-decisions.md) | 前端/Agent/数据源选型 |
| [v0.1 可开发规格](./docs/spec-v0.1.md) | 已交付基线 |
| [v0.2 可开发规格](./docs/spec-v0.2.md) | **当前：** 搜索机制 + UI（理解/检索词） |
| [产品构思与方向](./docs/product-concept.md) | 全站定位与路线 |
| [信息架构](./docs/information-architecture.md) | 路由、导航 |
| [地下精选模块](./docs/underground-catalog.md) | 发行库 + 打分（二期） |

## 技术栈（v0.1）

- Next.js (App Router) + TypeScript + Tailwind  
- 视觉参考 [Suno](https://suno.com/)（暗色、结果卡）  
- Agent：自建薄编排；真源：YouTube Data API  

## 明确不做（v0.1）

- 编曲 / 混音主流程  
- 灰产下载  
- Agent 推荐专辑（后期附加）  

## 建议下一步

目标是**完整正式产品**。当前阶段：**Phase 1 只做 Agent 找伴奏**（地下精选后置认真做）。

1. 按 [Phase 1 Agent Beta 规格](./docs/spec-phase1-agent-beta.md) 实现  
2. 地图见 [product-flows](./docs/product-flows.md) · [product-maturity](./docs/product-maturity.md)  
3. 之后：Phase 2 账号/资产 → Phase 3 **地下精选（重点模块）**  
