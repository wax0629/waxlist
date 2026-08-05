# 可选邮件验证码与邮件发送

> 当前 `/login` 与 `/register` 使用**邮箱 + 密码**，不依赖验证码。OTP API 与邮件发送能力仍保留，供以后重新接入验证码登录；关于页反馈邮件也复用同一套 Resend / SMTP 配置。

只有调用 OTP 发信接口时才必须配置发信服务；未配置时接口会直接报错（不会静默打日志冒充已发送）。关于页要发送反馈邮件也需要配置 Resend 或 SMTP。

二选一：

## 方案 A：Resend（推荐，几分钟可测）

1. 注册 [resend.com](https://resend.com)，创建 API Key  
2. 写入 `.env.local`：

```bash
RESEND_API_KEY=re_xxxxxxxx
# 未验证域名时可用 Resend 测试发件人：
EMAIL_FROM=Waxlist <onboarding@resend.dev>
```

3. **测试限制**：未绑定自己的域名时，Resend 通常**只能发到你注册 Resend 的那个邮箱**。  
   任意收件人：在 Resend 控制台验证域名后，把 `EMAIL_FROM` 改成你的域名，例如：

```bash
EMAIL_FROM=Waxlist <noreply@yourdomain.com>
```

4. 重启 `npm run dev`。当前登录页没有验证码入口；需要通过 OTP API 或未来重新接入的界面测试发信。

## 方案 B：SMTP（163 / QQ / 企业邮 / Gmail 等）

```bash
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=you@163.com
SMTP_PASS=授权码不是登录密码
EMAIL_FROM=Waxlist <you@163.com>
```

| 常见服务 | HOST | PORT |
|----------|------|------|
| 网易 163 | `smtp.163.com` | 465 |
| QQ 邮箱 | `smtp.qq.com` | 465 |
| Gmail | `smtp.gmail.com` | 465 |

注意：多数邮箱要开 **SMTP / 客户端授权码**，不能填网页登录密码。

若用 587 + STARTTLS：

```bash
SMTP_PORT=587
SMTP_SECURE=false
```

优先级：已配置 `RESEND_API_KEY` 时走 Resend，否则走 SMTP。

## 调试

- 默认**不会**在页面或接口里返回验证码明文。  
- 仅当显式设置 `AUTH_OTP_DEV=1` 时，接口带 `dev_code`（生产勿开）。  
- 服务端日志成功时类似：`[auth-otp:email] sent via Resend to=...`

## 与当前密码登录的关系

- 当前注册会保存密码哈希，登录使用邮箱 + 密码。
- `AUTH_SECRET` 是当前登录会话必需配置。
- `AUTH_OTP_DEV`、邮件和短信变量仅影响可选 OTP 流程，不影响当前密码登录。

## 与手机短信

OTP 手机通道仍依赖 `SMS_WEBHOOK_URL`。当前页面未提供手机号登录入口。
