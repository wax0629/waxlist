# Waxlist

**Waxlist**：听专、荐专与红心（主入口：**优质发行**；一期偏网易云外链）。
站内找伴奏模块 **Beat Hunter**（Beta，不抢主线）。

生产：**https://waxlist.cn** · 版本 **v0.1.0** · **内测**

## 交接与文档

| 文档                                    | 说明                         |
| --------------------------------------- | ---------------------------- |
| **[HANDOFF.md](./HANDOFF.md)**          | **项目交接总览（先看这个）** |
| [使用与运维](./docs/user/README.md)     | 启动、环境变量、部署、数据库 |
| [日常发版](./docs/user/release.md)      | GitHub → 生产、验收与回滚    |
| [内测计划](./docs/user/beta-and-dev.md) | 发版节奏与邀请清单           |
| [docs/archive/](./docs/archive/)        | 旧构思归档（非现行）         |

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

| 模块        | 路径                    | 说明                                                      |
| ----------- | ----------------------- | --------------------------------------------------------- |
| 优质发行    | `/explore`              | 列表、搜索、筛选、排序、评分展示与红心                    |
| UDG 专区    | `/explore?filter=udg`   | 展示带 `UDG` 风格标签的已上架专辑；所有用户荐专时均可选择 |
| 专辑盲盒    | `/explore/today`        | 加权随机开盒、发行日期、评分展示与红心                    |
| 推荐专辑    | `/explore/submit`       | 登录后提交；推荐理由可留空                                |
| 我的红心    | `/explore?filter=heart` | 同页筛选                                                  |
| 后台        | `/admin`                | 概览（站主/管理）                                         |
| 账号角色    | `/admin/users`          | 站主分配管理及评分/评论内测权限                           |
| 内容管理    | `/moderation`           | 浏览近期荐专、事后下架、清理遗留待审                      |
| Beat Hunter | `/chat`                 | 找伴奏（Beta）                                            |
| 关于 / 反馈 | `/about`                | 版本信息 + 邮件反馈表单                                   |

## 发版（生产）

合并并同步 GitHub `main` 后运行：

```bash
git switch main
git pull --ff-only origin main
./scripts/deploy-prod.sh
```

服务器：`ubuntu@43.161.255.64` → `/var/www/waxlist`（pm2）。  
rsync **不覆盖**服务器 `.env`。完整流程见
[日常发版](./docs/user/release.md)。

## 检查

```bash
npm test        # Vitest 单元测试
npm run lint    # ESLint
npm run build   # Prisma generate + production build + TypeScript
```

## 合规

外链仅供试听与发现。详见 [关于](https://waxlist.cn/about)。
