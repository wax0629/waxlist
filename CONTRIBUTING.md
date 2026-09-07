# 参与 Waxlist

感谢你愿意一起把好专辑递到更多人面前。

## 现在最需要什么

1. **真实荐专**：登录后在 [`/explore/submit`](https://waxlist-nu.vercel.app/explore/submit) 贴一张网易云专辑链接。
2. **可复现的缺陷**：开 [Issue](https://github.com/wax0629/waxlist/issues/new)，写清页面、设备和复现步骤。
3. **小范围代码**：先看打开的 Issue，避免重复做大功能。

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run db:up
npm run db:push
npm run dev
```

生产数据在 Neon，不要把本地库覆盖上去。需要对照线上内容时，按 `docs/user/database-workflow.md` 单向拉取快照。

## 提交约定

- 一次提交只做一件事。
- 改动文件跑 `npx eslint <files>`、`npm test`，必要时 `npm run build`。
- 不要提交 `.env`、密钥或生产连接串。
- 不提供未授权下载；外链回网易云或其他官方试听源。

## 行为边界

Waxlist 是听专 / 荐专 / 红心社区，不是排行榜，也不是 Beat Hunter 的附属产品。找伴奏保持 Beta，不抢主线。
