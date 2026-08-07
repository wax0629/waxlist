# Waxlist 日常发版

本文是当前生产环境的日常发版手册。首次安装或迁移服务器见
[deploy-aliyun-hk.md](./deploy-aliyun-hk.md)。

## 唯一事实来源

- GitHub `wax0629/waxlist` 的 `main` 分支是代码与文档的唯一事实来源。
- 生产环境只允许部署已经推送到 `origin/main` 的干净提交。
- 服务器 `/var/www/waxlist/DEPLOYED_COMMIT` 记录当前部署的 Git commit。
- 服务器 `.env`、平台密钥和账号权限不进入 Git；变量清单见
  [environment.md](./environment.md)。

不要直接在服务器修改业务代码。紧急修复也应先进入 GitHub，再部署。

## 标准流程

### 1. 本地验证

```bash
npm ci
npm test
npx eslint path/to/changed-file.tsx
npm run build
bash -n scripts/deploy-prod.sh
git diff --check
```

本次改动文件的定向 ESLint 与 production build 必须通过。全量 `npm run lint`
当前仍会命中旧页面的 React 19 严格规则，清单见 `HANDOFF.md`；清零前不能把
“全量 lint 通过”写进发版结果。

### 2. GitHub 留痕

```bash
git switch main
git add <本次文件>
git commit -m "<说明改动>"
git push origin main
```

这是个人项目，日常小版本可以直接提交到 `main`；重要的是让代码、文档与部署
提交保持一致。需要多人评审时再使用 PR，不作为部署脚本的强制前置条件。

### 3. 部署生产

```bash
./scripts/deploy-prod.sh
```

脚本会检查当前分支、工作区和 `origin/main`，随后执行 rsync、`npm ci`、
Prisma Client/schema 同步、production build、pm2 重启和健康检查。它不会覆盖
服务器 `.env`。

如需连接新的生产主机，可显式设置：

```bash
DEPLOY_HOST=ubuntu@主机 DEPLOY_APP_DIR=/var/www/waxlist ./scripts/deploy-prod.sh
```

## 上线验收

```bash
curl -fsS https://waxlist.cn/health
ssh ubuntu@43.161.255.64 'cat /var/www/waxlist/DEPLOYED_COMMIT'
git rev-parse origin/main
```

后两个 commit 应一致。随后人工检查：

1. `/explore` 可打开，封面与 favicon 正常。
2. `/explore/today` 可开盒；桌面端为等宽书页布局，移动端上下排列。
3. 盲盒显示发行日期、公开评分和红心；只有站主或互动内测账号可发布评分。
4. `/login` 可登录，刷新后会话仍在。
5. `/about` 可提交反馈。
6. 普通账号能查看均分与评论但不能发布；站主可在 `/admin/users` 开关“互动内测”，目标账号重新登录后获得发布能力。
7. `/explore?filter=udg` 只显示带 `UDG` 标签的专辑；普通账号荐专时也能选择该风格。

## 回滚

优先在 GitHub 对问题提交执行 `git revert`，合并回 `main` 后重新运行部署脚本。
不要在生产机手改文件，也不要把旧目录覆盖回去；这样 GitHub、生产与交接文档
始终保持同一条可审计历史。

部署失败时，脚本会在 pm2 重启前退出；查看：

```bash
ssh ubuntu@43.161.255.64
cd /var/www/waxlist
pm2 status
pm2 logs waxlist --lines 100
```
