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

## Inbox（随手记）

> 把后续想法直接贴在下面，不必排好序。

<!-- 在此追加 -->

### （示例，可删）
- **状态：** inbox  
- **大概版本：** 远期  
- **一句话：** Agent 附加荐专（非主路径）  
- **为什么：** 听完专辑可当参考找 beat  
- **备注：** 产品原则已允许后期附加；勿与 beat 短名单混流  
- **日期：** 2026-08-03  

---

## 已从构思落入文档、但未进 v0.1 实现

| 想法 | 出处 | 建议版本 | 状态 |
|------|------|----------|------|
| `/explore` 地下精选只读列表 | product / underground | v0.2 | candidate |
| 用户打分 + 登录 | underground | v0.3 | candidate |
| 发行详情 → `/chat?ref=` 弱连接 | IA | v0.3 | candidate |
| Agent 荐专附加能力 | product §8.4 | 远期 | candidate |
| BeatStars / B 站等多源 | product 内容源 | v0.2+ | candidate |
| 会话 shortlist 收藏抽屉 | product v0.1～0.2 | v0.2 | candidate |
| 跨会话偏好 | product 以后 | 远期 | candidate |
| 参考音频文件上传 | product 以后 | 远期 | candidate |
| 流式对话输出 | 体验 | v0.2 | candidate |
| 部署公开 Demo（Vercel 等） | 工程 | v0.2 | candidate |
| 轻量 eval / 日志可观测 | product 工程向 | v0.2+ | candidate |
| LangGraph 等重编排 | tech-decisions | 仅当图复杂 | dropped-unless-needed |

---

## 下一版候选（你点名后再 lock）

把想优先做的从上面挪到这里，并补「为什么现在做」：

| 优先级 | 想法 | 为什么现在做 | 目标规格 |
|--------|------|--------------|----------|
| — | （待你填写） |  | spec-v0.2 |

---

## 已完成（归档）

| 想法 | 完成于 | 说明 |
|------|--------|------|
| v0.1 找 beat 最小闭环 | 2026-08 | `/chat` + 会话 + YT + Agent tools |
| 技术选型 A–F | 2026-08 | 见 tech-decisions |
| 产品一站两页边界 | 2026-08 | 见 product-concept |

---

## 明确不记成「马上做」的坑

- 编曲 / 混音主流程  
- 灰产下载  
- 单对话里荐专 + 找 beat 双主路径  
- 像素级抄 Suno  

（原则见 product-concept / thinking-map。）
