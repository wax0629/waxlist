# Waxlist 日常发版

本文是当前生产环境的日常发版手册。平台说明见
[deploy.md](./deploy.md)。

## 唯一事实来源

- GitHub `wax0629/waxlist` 的 `main` 分支是代码与文档的唯一事实来源。
- 生产环境只允许部署已经推送到 `origin/main` 的干净提交。
- Vercel Production Deployment 记录当前部署的 Git commit。
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
git push origin main
```

Vercel 会构建 Production。紧急时也可在已链接目录执行 `vercel deploy --prod`。
环境变量在 Vercel 项目设置中维护，不要提交 `.env`。

## 上线验收

```bash
curl -fsS https://waxlist-nu.vercel.app/health
```

随后人工检查：

1. `/explore` 可打开，封面与 favicon 正常。
2. `/explore/today` 可开盒；桌面端为等宽书页布局，移动端上下排列。
3. 盲盒显示发行日期、公开评分和红心；只有站主或互动内测账号可发布评分。
4. `/login` 可登录，刷新后会话仍在。
5. `/about` 可提交反馈。
6. 普通账号能查看均分与评论但不能发布；站主可在 `/admin/users` 开关“互动内测”，目标账号重新登录后获得发布能力。
7. `/explore?filter=udg` 只显示带 `UDG` 标签的专辑；普通账号荐专时也能选择该风格。

## 回滚

优先在 GitHub 对问题提交执行 `git revert`，合并回 `main` 后等待 Vercel 自动部署。
不要在平台上直接改业务代码。构建失败时查看 Vercel Deployment 日志。
