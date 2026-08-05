# 备选试用部署：Zeabur

适合：**不想先买香港轻量**，用 Git 部署试水；**必须用国内手机 4G（关代理）验收**。

> 这不是 Waxlist 当前生产方案。当前生产与发版方式见 [HANDOFF.md](../../HANDOFF.md)。

> 不保证大陆一定能开。测不通就停，再改香港 VPS。  
> 正式长期主站仍更推荐：[阿里云/腾讯云香港](./deploy-aliyun-hk.md)。

---

## 0. 开始前

1. 代码已在 **GitHub**（`main` 最新）  
2. 已有 **Neon** 的 `DATABASE_URL`（可复用现有生产库，省事）  
3. 准备好：`AUTH_SECRET`、`YOUTUBE_API_KEY`、`OWNER_EMAILS` 等（与 Vercel 那套相同）

本机生成密钥（若还没有）：

```bash
openssl rand -base64 32
```

---

## 1. 注册并连接 GitHub

1. 打开 [https://zeabur.com](https://zeabur.com)  
2. 用 **GitHub** 登录  
3. 授权 Zeabur 读取你的仓库（至少要有 `waxlist` / `beat-hunter` 那个）

---

## 2. 新建项目并部署

1. Dashboard → **Create Project** / 新建项目  
2. **Add Service** → **Git** → 选中本仓库  
3. 分支选 **main**  
4. 根目录一般是仓库根（有 `package.json` 的那层）  
5. 等待自动识别 **Next.js** 并开始 Build  

构建会跑 `npm install`（含 `postinstall: prisma generate`）和 `npm run build`。

若 Build 失败：打开 **Runtime / Build Logs**，把报错贴出来排查。

---

## 3. 环境变量（必做）

服务打开后 → **Variables** / 变量，添加：

| 变量 | 必填 | 示例 / 说明 |
|------|------|-------------|
| `DATABASE_URL` | ✅ | Neon 连接串（与现在 Vercel 相同即可） |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_URL` | ✅ | 部署成功后的 HTTPS 地址，见下 |
| `AUTH_TRUST_HOST` | 建议 | `true` |
| `OWNER_EMAILS` | 建议 | 你的站主邮箱 |
| `YOUTUBE_API_KEY` | 找伴奏要 | 已有 key |
| 其它 | 可选 | 见 [environment.md](./environment.md) |

### `AUTH_URL` 怎么填

1. 先部署一次，在 Zeabur 拿到默认域名（形如 `https://xxx.zeabur.app` 或控制台显示的 Domain）  
2. 把 `AUTH_URL` 设为 **完整 https 地址**（不要漏 `https://`）  
3. **Redeploy / 重启** 一次，登录才稳  

若你之后绑定 `waxlist.cn`，再把 `AUTH_URL` 改成 `https://waxlist.cn` 并重新部署。

### 数据库

- **推荐前期：** 继续用 **Neon**，变量里贴现有 `DATABASE_URL`  
- 若表是空的：本机执行一次  

```bash
DATABASE_URL='你的连接串' npx prisma db push
```

- 也可在 Zeabur 市场加 PostgreSQL，再把 `DATABASE_URL` 指过去（数据与 Vercel/Neon 不共用）

---

## 4. 域名（可选）

| 阶段 | 做法 |
|------|------|
| 先测通 | 用 Zeabur 自带域名即可 |
| 要用 `waxlist.cn` | Zeabur → Domains 绑定；阿里云解析按提示加 **CNAME**（不是指香港 IP 的 A 记录） |
| 绑定后 | 改 `AUTH_URL=https://waxlist.cn` → 重新部署 |

域名实名未过时，可先只用 `*.zeabur.app` 测。

---

## 5. 验收（关键）

### A. 你自己（可先任意网络）

1. 打开 Zeabur 给的 URL → `/explore`  
2. 注册 / 登录  
3. 荐专、红心  
4. `/chat`（有 YouTube key）

### B. 国内可达性（必须做）

用 **手机 4G，关闭 VPN/代理**：

1. 能否打开首页  
2. 是否极慢或超时  
3. 换 Wi‑Fi / 另一家运营商再试一次更准  

| 结果 | 下一步 |
|------|--------|
| 能开、可接受 | 前期可先用 Zeabur，再考虑绑 `waxlist.cn` |
| 打不开 / 经常挂 | **停用当主站**，改香港轻量 |
| 时好时坏 | 只给内测，不正式传播 |

---

## 6. 和 Vercel 的关系

| | Vercel | Zeabur |
|--|--------|--------|
| 部署方式 | Git push | Git push（类似） |
| 你的现状 | 国内打不开 | **未知，靠实测** |
| 数据库 | Neon | 可同一 Neon |

两套可以同时存在；**对外只发测通的那个链接**。  
测通 Zeabur 后，可把 Vercel 当备份或关掉，避免搞混。

---

## 7. 常见问题

| 现象 | 处理 |
|------|------|
| Build 失败 Prisma | 确认有 `DATABASE_URL`；`postinstall` 已含 `prisma generate` |
| 登录掉线 | `AUTH_URL` 是否等于浏览器地址栏域名；`AUTH_SECRET` 是否固定 |
| 500 数据库 | Neon 是否允许连接；连接串 `sslmode=require` |
| 免费额度不够 | 升配或换香港 VPS |
| 大陆打不开 | 正常风险，换 [香港部署](./deploy-aliyun-hk.md) |

---

## 8. 你需要回传的信息（方便继续帮）

测完后发我这几样即可（**不要发密码和完整 DATABASE_URL**）：

1. Zeabur 默认域名（可打码中间）  
2. Build 是否成功  
3. **国内 4G** 打开：能 / 不能 / 很慢  
4. 若失败：Build 或 Runtime 日志里关键几行报错  

---

## 官方文档

- [Zeabur 文档](https://zeabur.com/docs)  
- [Next.js on Zeabur](https://zeabur.com/docs/en-US/guides/nodejs/nextjs)  
