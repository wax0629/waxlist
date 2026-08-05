# Waxlist

**Waxlist**：听专、荐专与口碑（主入口：**优质发行**；一期偏网易云外链）。  
站内找伴奏模块 **Beat Hunter**（Beta，不抢主线）。

生产：**https://waxlist.cn** · 版本 **v0.1.0** · **内测**

## 交接与文档

| 文档 | 说明 |
|------|------|
| **[HANDOFF.md](./HANDOFF.md)** | **项目交接总览（先看这个）** |
| [使用与运维](./docs/user/README.md) | 启动、环境变量、部署、数据库 |
| [内测计划](./docs/user/beta-and-dev.md) | 发版节奏与邀请清单 |
| [docs/archive/](./docs/archive/) | 旧构思归档（非现行） |

## 本地运行

```bash
npm install
cp .env.example .env.local   # AUTH_SECRET；DATABASE_URL 用本地 Docker
npm run db:up
npm run db:push
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。  
数据库：[docs/user/database-workflow.md](./docs/user/database-workflow.md)。

## 功能概览

| 模块 | 路径 | 说明 |
|------|------|------|
| 优质发行 | `/explore` | 列表、搜索、筛选、排序、列表评分/红心 |
| 专辑盲盒 | `/explore/today` | 加权随机开盒 |
| 推荐专辑 | `/explore/submit` | 登录后提交 |
| 我的红心 | `/explore?filter=heart` | 同页筛选 |
| 后台 | `/admin` | 概览（站主/管理） |
| 账号角色 | `/admin/users` | 站主分配管理 |
| 审核 | `/moderation` | 内容管理 |
| Beat Hunter | `/chat` | 找伴奏（Beta） |
| 关于 / 反馈 | `/about` | 版本信息 + 邮件反馈表单 |

## 发版（生产）

```bash
git push origin main
./scripts/deploy-prod.sh
```

服务器：`ubuntu@43.161.255.64` → `/var/www/waxlist`（pm2）。  
rsync **不覆盖** 服务器 `.env`。

## 合规

外链仅供试听与发现。详见 [关于](https://waxlist.cn/about)。
