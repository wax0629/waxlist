# Waxlist 使用与运维

**Waxlist**：听专、荐专、红心与口碑（主入口：**优质发行**）。  
**Beat Hunter**：找伴奏（Beta）。

更完整的交接说明见仓库根目录 **[HANDOFF.md](../../HANDOFF.md)**。

## 能做什么

### 优质发行
- 列表：搜索、筛选（红心 / 站主爱听 / 友情）、排序
- 卡片上直接评分、红心
- 详情：推荐理由、曲目、评论；外链网易云
- 专辑盲盒：`/explore/today`
- 荐专：登录后提交；默认上架，可后审

### 关于
- 版本（内测 · v0.x）
- 反馈表单 → 邮件到 `FEEDBACK_TO`

### 找伴奏
- 自然语言 / 参考链接 → 可试听短名单（依赖 YouTube API + LLM）

## 本地启动

```bash
npm install
cp .env.example .env.local
npm run db:up && npm run db:push
npm run dev
```

## 文档索引

| 文档 | 内容 |
|------|------|
| [environment.md](./environment.md) | 环境变量 |
| [database-workflow.md](./database-workflow.md) | Neon × 本地、迁区、保活 |
| [email-auth.md](./email-auth.md) | 邮件 / OTP / Resend |
| [beta-and-dev.md](./beta-and-dev.md) | 内测节奏 |
| [admin-accounts.md](./admin-accounts.md) | 角色分发 |
| [deploy-aliyun-hk.md](./deploy-aliyun-hk.md) | 香港机部署参考 |
| [deploy-zeabur.md](./deploy-zeabur.md) | Zeabur 试用 |
| [deploy.md](./deploy.md) | Vercel + Neon 海外试用 |
| [youtube-api.md](./youtube-api.md) | YouTube API |

## 生产

- 域名：https://waxlist.cn  
- 发版：`./scripts/deploy-prod.sh`  
- 健康：`/health`  

## 合规

试听与发现参考，商用授权以源站为准。
