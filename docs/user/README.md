# Waxlist 使用与运维

**Waxlist**：听专、荐专与红心（主入口：**优质发行**）。
**Beat Hunter**：找伴奏（Beta）。

更完整的交接说明见仓库根目录 **[HANDOFF.md](../../HANDOFF.md)**。若备选部署文档与现状不同，以 `HANDOFF.md` 和本页为准。

## 能做什么

### 优质发行

- 列表：搜索、浏览条件、年代筛选、排序；地区补录达到 90% 后自动开放
- UDG 专区：`/explore?filter=udg`，展示带 `UDG` 风格标签的已上架专辑；所有用户荐专时都可选择
- 卡片上展示评分均值，也可直接点红心
- 详情：推荐理由、曲目、评分评论与网易云外链
- 专辑盲盒：`/explore/today`；桌面端 880px 等宽书页布局，长信息在右页滚动；含发行日期、评分展示与红心
- 荐专：登录后提交；推荐理由和地区均可留空，普通用户与员工均默认上架，管理在 `/moderation` 事后下架
- 评分与评论：所有人可查看；站主默认可发布，其他账号需在 `/admin/users` 开启“互动内测”后才能发布

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

| 文档                                                   | 内容                                        |
| ------------------------------------------------------ | ------------------------------------------- |
| [environment.md](./environment.md)                     | 环境变量                                    |
| [database-workflow.md](./database-workflow.md)         | Neon × 本地、迁区、保活                     |
| [release.md](./release.md)                             | **日常发版、线上验收与回滚**                |
| [catalog-filter-design.md](./catalog-filter-design.md) | **地区 / 年代分类规则、后台补录与前台交互** |
| [email-auth.md](./email-auth.md)                       | 可选 OTP / 邮件发送（当前登录页不用 OTP）   |
| [beta-and-dev.md](./beta-and-dev.md)                   | 内测节奏                                    |
| [admin-accounts.md](./admin-accounts.md)               | 角色分发                                    |
| [deploy-aliyun-hk.md](./deploy-aliyun-hk.md)           | 香港机部署参考（当前生产类型）              |
| [deploy-zeabur.md](./deploy-zeabur.md)                 | Zeabur 备选试用                             |
| [deploy.md](./deploy.md)                               | Vercel 历史 / 海外备选                      |
| [youtube-api.md](./youtube-api.md)                     | YouTube API                                 |

## 生产

- 域名：https://waxlist.cn
- 发版：GitHub `main` → `./scripts/deploy-prod.sh`，见 [release.md](./release.md)
- 健康：`/health`
- 登录：邮箱 + 密码；OTP 暂未接入当前登录页

## 检查

```bash
npm test
npm run lint
npm run build
```

测试现状和已知依赖问题见 [HANDOFF.md](../../HANDOFF.md)。

## 合规

试听与发现参考，商用授权以源站为准。
