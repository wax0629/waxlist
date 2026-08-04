# Waxlist 上线部署（推荐：Vercel + Neon）

适合小流量内测。全程约 30–60 分钟。

## 0. 本地准备

```bash
# 确认能构建
npm install
npm run build
```

生成生产密钥：

```bash
openssl rand -base64 32
```

记下输出，后面填 `AUTH_SECRET`。

把当前代码提交并推到 GitHub（部署平台会从仓库拉代码）：

```bash
git status
git add -A
git commit -m "Prepare Waxlist for production deploy"
git push origin main
```

---

## 1. 生产数据库（Neon，免费档够用）

1. 打开 [https://neon.tech](https://neon.tech) 注册 / 登录  
2. **Create project** → 名字随意，区域选离你近的  
3. 复制 **Connection string**（Postgres URL），形如：

```text
postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

4. 本地用这个 URL 同步表结构（**只做一次**）：

```bash
# 临时用生产库推 schema（不要提交到 git）
DATABASE_URL='你的Neon连接串' npx prisma db push
```

成功后 Neon 里应有 `users` / `releases` / `ratings` 等表。

---

## 2. 部署前端（Vercel）

1. 打开 [https://vercel.com](https://vercel.com)，用 GitHub 登录  
2. **Add New Project** → 导入 `waxlist` / `beat-hunter` 仓库  
3. Framework 选 **Next.js**（一般自动识别）  
4. **Environment Variables** 添加：

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | Neon 连接串 |
| `AUTH_SECRET` | ✅ | 上面 `openssl` 生成的值 |
| `AUTH_URL` | ✅ | 部署后的站点 URL，如 `https://xxx.vercel.app` |
| `AUTH_TRUST_HOST` | 建议 | 填 `true` |
| `OWNER_EMAILS` | 建议 | 你的站主邮箱，如 `xux9278@gmail.com` |
| `YOUTUBE_API_KEY` | 可选 | 找伴奏真检索 |
| `OPENAI_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | 可选 | 找伴奏中文意图 |

5. **Deploy**  
6. 部署完成后，若默认域名是 `https://your-app.vercel.app`，确认 `AUTH_URL` 与它一致；不一致就改 env 后 **Redeploy**。

---

## 3. 上线后验收清单

在浏览器打开生产域名：

1. 打开 `/explore`  
2. `/register` 注册（或登录）  
3. 确认账号旁是 **站主**（`OWNER_EMAILS` 或首个用户）  
4. `/explore/submit` 推一张专  
5. `/moderation` 审核通过  
6. 详情页：评分、红心、曲目点赞  
7. `/chat` 找伴奏（有 YouTube key 时）

---

## 4. 自定义域名（可选）

Vercel 项目 → **Settings → Domains** 绑定域名，DNS 按提示加记录。  
绑定后把 `AUTH_URL` 改成新域名并重新部署。

---

## 5. 常见问题

| 现象 | 处理 |
|------|------|
| 登录后马上掉线 | 检查 `AUTH_SECRET`、`AUTH_URL` 是否与当前域名一致 |
| 数据库报错 | 确认 `DATABASE_URL` 含 `sslmode=require`，且已 `db push` |
| Prisma 构建失败 | Vercel Build 命令保持默认；`package.json` 里已有 `prisma generate` |
| 网易云曲目为空 | 生产服务器访问 163 可能被墙/风控，可本机解析后入库，或以后换源 |

---

## 备选：自己的 VPS

若不用 Vercel：

1. 机器上装 Node 20+、Postgres  
2. `git clone` → `npm ci` → 配 `.env`  
3. `npx prisma db push`  
4. `npm run build && npm run start`（或用 pm2 / systemd）  
5. 前面加 Nginx / Caddy 做 HTTPS  

---

## 不要做的事

- 不要把 `.env.local` 提交进 Git  
- 不要用本机 Docker 的 `waxlist:waxlist@localhost` 当生产库  
- 生产不要开 `AUTH_OTP_DEV=1`  
