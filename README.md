# Waxlist

**Waxlist**：听专、荐专与口碑（主入口：**优质发行**；一期偏网易云外链）。  
站内找伴奏模块仍叫 **Beat Hunter**（Beta）。

生产：**https://waxlist.cn**

## 文档

- [使用说明](./docs/user/README.md)
- [**内测计划与开发模式**](./docs/user/beta-and-dev.md)（发版节奏、内测清单）
- [环境变量](./docs/user/environment.md)
- [香港机部署](./docs/user/deploy-aliyun-hk.md)
- [YouTube API](./docs/user/youtube-api.md)

## 本地运行

```bash
npm install
cp .env.example .env.local   # 配置 AUTH_SECRET；DATABASE_URL 用本地 Docker
npm run db:up
npm run db:push
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。  
数据库规范（Neon 生产 × 本地）：[docs/user/database-workflow.md](./docs/user/database-workflow.md)。

## 功能概览

| 模块 | 路径 | 说明 |
|------|------|------|
| 优质发行 | `/explore` | 列表、筛选、排序、详情 |
| 推荐专辑 | `/explore/submit` | 登录后提交 |
| 我的红心 | `/explore?filter=heart` | 同页筛选（旧 `/favorites` 会跳转） |
| 后台 | `/admin` | 概览 + 待审提示（站主 / 管理） |
| 账号角色 | `/admin/users` | 站主分配管理 |
| 审核 | `/moderation` | 站主 / 管理 |
| Beat Hunter | `/chat` | 找伴奏（Beta） |
| 关于 | `/about` | 故事与联系 |

## 发版（生产）

日常在本地开发；版本成熟后：

```bash
git push origin main
./scripts/deploy-prod.sh
```

详见 [内测计划与开发模式](./docs/user/beta-and-dev.md)。

## 合规

结果与外链仅供试听与发现。详见站内 [关于](https://waxlist.cn/about)。

## 开发

功能与缺陷用 **GitHub Issues** 跟踪。  
产品/设计草稿可只放本地 `docs/` 工作区，按需提交。
