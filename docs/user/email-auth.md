# 邮件验证码（真实发信）

登录走邮箱验证码时，**必须**配置发信服务，否则接口会直接报错（不会再静默打日志冒充已发送）。

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

4. 重启 `npm run dev`，打开 `/login` → 邮箱 → 获取验证码 → 查邮件。

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

## 与手机短信

手机通道仍依赖 `SMS_WEBHOOK_URL`。未配置短信时，请用邮箱登录。
