# Phase 1 Eval 集（Intent + Query 回归）

> 跑法：`npm run eval:intent`（不调 YouTube，只测理解与 query 规划）  
> 人工抽检检索质量：真搜后记在下方「人工记录」

## 自动 case（意图/检索词）

| ID | 输入 | 期望 style 含 | 期望 query 信号 | 禁止 |
|----|------|---------------|-----------------|------|
| E1 | 适合女声的慢热 R&B，鼓不要太抢 | r&b | rnb + type beat + soft/light | 仅中文原文 |
| E2 | udg | underground | udg 或 underground | 默认全是 rnb |
| E3 | 偏暗 trap soul | trap soul | trap soul / type beat | |
| E4 | （先 E1 再）再快一点 | r&b（继承） | 有 uptempo/fast 向 | 丢掉 r&b |
| E5 | drill type beat | drill | drill | 强制 rnb |

## 人工记录（真检索后填写）

| ID | 日期 | shortlist 伴奏向比例 | 备注 |
|----|------|----------------------|------|
| E1 | | | |
| E2 | | | |
| E3 | | | |
