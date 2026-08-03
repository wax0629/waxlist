# Agent `/chat` — 视觉参考

> 状态：**主方向已定，布局按此迭代**  
> 记录日期：2026-08-03  
> 范围：仅找伴奏 Agent 页，不含 `/explore`

---

## 1. 主参考

| 项 | 内容 |
|----|------|
| **链接** | https://dribbble.com/shots/27052075-AI-Travel-Assistant-UI-Trip-Planning-Destination-Discovery |
| **标题** | AI Travel Assistant UI — Trip Planning & Destination Discovery |
| **平台** | Dribbble |
| **摘要**（公开文案） | Futuristic AI travel assistant **dashboard**：智能规划 + 目的地发现 |
| **用户意图** | **Agent 页希望做成这种感觉** |

> Dribbble **通常只提供截图/录屏，不附带实现代码**。落地需反推布局与交互。

---

## 2. 从「旅行助理 Dashboard」映射到 Beat Hunter

| 旅行 UI 常见块 | Beat Hunter 对应 |
|----------------|------------------|
| 左侧窄导航 / 会话列表 | 左栏：品牌 + 导航 + 会话操作 |
| 中间 AI 对话 | 中栏：消息流 + 输入 |
| 右侧/主区「目的地发现」卡片网格 | 右栏：**伴奏短名单 / 发现** 大图卡片 |
| 建议 chip / 快捷意图 | 建议问题 chip |
| 行程摘要条 | 「我的理解」+ 检索策略折叠 |
| 地图（可选） | **不做地图**；用封面网格占发现区 |

气质目标：**产品级 Dashboard**，不是居中一条聊天气泡栏。

---

## 3. 实现原则

- 学 **信息架构与层次**，不像素抄 Dribbble 作品  
- **配色：** 已按该作「未来感旅行 Dashboard」方向抄写为 **深海军 + 电光蓝/青**（见 [design-system.md](./design-system.md)）。Dribbble 不提供色板文件，环境也无法滴管原图；若有精确 hex 可再校准。  
- 移动端：发现区收到对话下方，桌面保持轨 + 对话 + 发现  
- 与 [design-refs-explore.md](./design-refs-explore.md) 分离：explore 另有参考  

---

## 4. 相关

| 文档 | 关系 |
|------|------|
| [design-system.md](./design-system.md) | Token |
| [ui-phase1.md](./ui-phase1.md) | 状态机与卡片 IA |
| [spec-phase1-agent-beta.md](./spec-phase1-agent-beta.md) | 功能范围 |
