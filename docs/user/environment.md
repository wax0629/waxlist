# 环境变量

复制模板：

```bash
cp .env.example .env.local
```

| 变量 | 是否必须 | 说明 |
|------|----------|------|
| `YOUTUBE_API_KEY` | 真检索需要 | 未配置时使用 mock 短名单降级 |
| `OPENAI_API_KEY` 或兼容 key | 可选 | LLM 润色推荐理由等（OpenAI 兼容接口） |
| `LLM_BASE_URL` | 可选 | 自定义兼容网关，如阿里云 DashScope 等 |
| `LLM_MODEL` | 可选 | 模型名 |
| `RATE_LIMIT_PER_MIN` | 可选 | 每 IP 每分钟请求上限，默认约 20 |
| `AUTH_SECRET` | 登录需要 | Auth.js 会话加密密钥，可用 `openssl rand -base64 32` 生成 |
| `AUTH_OTP_DEV` | 可选 OTP | 仅 `1` 时 OTP 接口返回 `dev_code`；**生产勿开** |
| `RESEND_API_KEY` | 发邮件二选一 | [Resend](https://resend.com) API Key；用于反馈邮件和可选 OTP |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | 发邮件二选一 | SMTP 发信（163/QQ 等）；用于反馈邮件和可选 OTP |
| `SMTP_PORT` / `SMTP_SECURE` | 可选 | 默认 465 / 按端口推断 secure |
| `EMAIL_FROM` | 推荐 | 发件人展示名，如 `Waxlist <you@domain.com>` |
| `FEEDBACK_TO` | 可选 | 关于页反馈表单收件邮箱；默认 `OWNER_EMAILS` 首个或站主公开邮箱 |
| `SMS_WEBHOOK_URL` | 可选 OTP | 短信 Webhook；当前页面未提供手机号登录 |
| `OWNER_EMAILS` | 可选 | 站主邮箱列表（逗号分隔）；注册或登录成功时同步角色，空库首个用户也是站主 |
| `OWNER_PHONES` | 可选 OTP | 站主手机号列表；仅保留的手机号 / OTP 流程使用 |
| `DATABASE_URL` | 社区功能需要 | 本机 Docker 串；**生产 Neon 只放服务器 .env** |

密钥只放在服务端环境（`.env.local` / 托管平台 Secret），**不要**提交到 Git，也不要写进前端代码。

### 数据库规范（必读）

真实用户与上传在 **Neon 生产库**。本地默认 Docker，需要时再从 Neon 拉快照。

完整流程：**[database-workflow.md](./database-workflow.md)**

```bash
npm run db:up          # 本地 Postgres
npm run db:push        # schema → 当前 DATABASE_URL（本地）
npm run db:pull-prod   # Neon 快照 → 覆盖本地（需 DATABASE_URL_PROD）
npm run db:push-schema-prod  # 仅结构 → Neon（需 DATABASE_URL_PROD）
```

| 变量 / 文件 | 用途 |
|-------------|------|
| `DATABASE_URL` | 当前进程连哪库（dev = localhost） |
| `DATABASE_URL_PROD` 或 `.env.neon.local` | 仅脚本拉快照 / 推结构，**勿提交** |

不用库时：`npm run db:down`。Docker Desktop 资源建议 CPU 2～4、Memory 2～4 GB。

### 角色说明

| 角色 | 含义 |
|------|------|
| `owner` | 站主：爱听库、最高权限 |
| `admin` | 管理：浏览近期荐专、事后下架、运营工具 |
| `user` | 普通用户：查看评分评论、推荐、红心；发布评分/评论由站主按账号开放内测 |

登录页：`/login`（邮箱 + 密码）。注册页：`/register`（邮箱 + 密码）。精选：`/explore`。

当前登录使用邮箱 + 密码。可选 OTP 与反馈邮件配置见 [`email-auth.md`](./email-auth.md)。
