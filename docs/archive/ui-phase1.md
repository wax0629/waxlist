# Phase 1 UI 结构说明

> 目标：完整产品口径的体验骨架，不只是换色。  
> **Agent 视觉主参考：** [design-refs-agent.md](./design-refs-agent.md)  
>  （Dribbble AI Travel Assistant Dashboard）

## 1. 首屏 / 空状态

- **组件：** `ChatHero`
- **何时：** 无会话轮次且未加载
- **内容：** 价值主张 + 三步说明 + 大触控建议 chip
- **不再：** 把欢迎词塞成一条助手气泡冒充对话

## 2. 结果卡片信息架构（定稿）

自上而下固定：

1. 封面（16:10）  
2. 来源角标（左上）  
3. 标题（最多 2 行）  
4. 频道（1 行）  
5. 理由 reason（最多 2 行）  
6. CTA「在源站打开」

卡片最小高度与 line-clamp 保证网格节奏一致。

## 3. 全状态

| 状态 | 表现 |
|------|------|
| 首屏 | ChatHero |
| 加载 | ResultSkeleton（阶段文案 + 卡片骨架） |
| 有结果 | SearchMeta + BeatCard 网格 |
| 无结果 | EmptyResults（再试 / 清空） |
| 错误 | 错误面板 + 重试上一条 |
| 恢复会话 | 「恢复会话…」 |

## 4. 移动端

- `min-h-dvh` + `safe-area-inset-bottom`
- 输入 `text-[16px]` 降低 iOS 聚焦放大
- 建议 chip / 发送钮 `min-h-10~11` 拇指热区
- 状态栏文案缩短；快捷键说明仅桌面显示
- 卡片单列 → sm 双列

## 5. 与「换皮」的区别

本轮补齐的是 **结构与状态机**，不是只加阴影。后续仍可：对比 Suno 关键帧微调间距、补 favicon/OG。
