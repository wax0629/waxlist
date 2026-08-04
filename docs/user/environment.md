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
| `AUTH_OTP_DEV` | 可选 | 仅 `1` 时接口返回 `dev_code`；**生产勿开** |
| `RESEND_API_KEY` | 邮箱登录二选一 | [Resend](https://resend.com) API Key，真发邮件 |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | 邮箱登录二选一 | SMTP 发信（163/QQ 等）；见 `docs/user/email-auth.md` |
| `SMTP_PORT` / `SMTP_SECURE` | 可选 | 默认 465 / 按端口推断 secure |
| `EMAIL_FROM` | 推荐 | 发件人展示名，如 `Waxlist <you@domain.com>` |
| `SMS_WEBHOOK_URL` | 手机登录需要 | 短信 Webhook；未配置时请用邮箱 |
| `OWNER_EMAILS` | 可选 | 站主邮箱列表（逗号分隔）。**每次用该邮箱验证码登录时**会升为站主；库为空时第一个用户也是站主 |
| `OWNER_PHONES` | 可选 | 站主手机号列表；登录时同样会同步为站主 |
| `DATABASE_URL` | 社区功能需要 | Postgres 连接串；本机见下方 Docker |

密钥只放在服务端环境（`.env.local` / 托管平台 Secret），**不要**提交到 Git，也不要写进前端代码。

### 本机数据库

```bash
# 启动轻量 Postgres（容器上限约 1 CPU / 512MB）
npm run db:up

# .env.local / .env：
# DATABASE_URL=postgresql://waxlist:waxlist@localhost:5432/waxlist

npm run db:push
```

不用库时关掉容器更省内存：

```bash
npm run db:down
```

**Docker Desktop 整机配额**（和容器限制不同）：  
Settings → Resources → 建议 **CPU 2～4、Memory 2～4 GB**。  
默认常给虚拟机很多核/约 8GB，开发机会明显卡；改完 Apply & Restart。

| 路径 | 用途 |
|------|------|
| `.data/sessions/` | 找伴奏聊天会话（仍为 JSON） |
| Postgres `users` / `releases` / `favorites` | 账号与精选 |

### 角色说明

| 角色 | 含义 |
|------|------|
| `owner` | 站主：爱听库、最高权限 |
| `admin` | 管理：审核、运营工具 |
| `user` | 普通用户：推荐、打分 |

登录页：`/login`（邮箱 + 密码）。注册页：`/register`（邮箱 + 密码）。精选：`/explore`。

邮件相关（可选，当前登录不依赖验证码）：[`email-auth.md`](./email-auth.md)
