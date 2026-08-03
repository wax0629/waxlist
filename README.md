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

当前阶段：

- `/chat` 暗色 UI + **服务端会话**（`POST /api/chat`、`GET /api/session/:id`）
- shortlist 仍为 **mock**（约束会随 refine 微调）；下一步接 YouTube + LLM

会话 `session_id` 存在浏览器 `localStorage`，开发服务器不重启时可刷新恢复。

## 站点结构

| 页面 | 路径 | 说明 |
|------|------|------|
| 找伴奏 | `/chat` | 主产品，v0.1 |
| 地下精选 | `/explore` | 二期；导航暂「即将推出」 |

## 文档

| 文档 | 说明 |
|------|------|
| [思路整理图](./docs/thinking-map.md) | 已定结论、v0.1 切口 |
| [技术与实现决策](./docs/tech-decisions.md) | 前端/Agent/数据源选型 |
| [v0.1 可开发规格](./docs/spec-v0.1.md) | 用户故事、API、验收 |
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

1. `POST /api/chat` + 服务端会话  
2. 接入 YouTube 真检索  
3. LLM tool calling 闭环（描述 / 参考 / refine）  
