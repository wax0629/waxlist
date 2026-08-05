# 香港轻量服务器部署参考（阿里云 / 腾讯云）

适用：**用户几乎全在国内**，Vercel / `*.vercel.app` 完全打不开时。阿里云和腾讯云香港机的 Node.js、Nginx、pm2 部署方式相同。

> 当前生产是腾讯云香港 `43.161.255.64`。本文前半部分保留“新购阿里云机器”的初始化示例；已有生产环境的日常发版统一使用仓库根目录 `./scripts/deploy-prod.sh`。

## 为什么是香港（先定死）

| 选项 | 大陆访问 | 要 ICP 备案吗 | Beat Hunter（YouTube API） |
|------|----------|---------------|----------------------------|
| **香港轻量 / 香港 ECS** | 多数可打开 | **一般不要**（机器不在大陆） | 通常可用 |
| 大陆（华东/华北等） | 最好 | **要备案** | 服务端调 YouTube 常失败 |
| 继续 Vercel 美区 | 你已完全打不开 | 否 | 能调 API 但用户进不来 |

**结论：初期就买阿里云「中国香港」区域，不要买华东/华北「图便宜」。**  
以后用户量大、要全国更稳，再单独做备案 + 大陆节点（找伴奏可能要拆到港区）。

数据库短期可继续用现有 **Neon**（App 在香港访问 Neon 一般可通）。

---

## 总流程

```text
1. 阿里云账号实名
2. 买域名（万网）并完成域名实名
3. 买「轻量应用服务器 · 中国香港」
4. 安全组放行 80 / 443（和 SSH）
5. 域名解析 A 记录 → 服务器公网 IP
6. 机器上装 Node、拉代码、配环境变量、build、用 pm2 常驻
7. Nginx + HTTPS
8. 国内手机流量打开验收
```

---

## 1. 账号与实名

1. 打开 [https://www.aliyun.com](https://www.aliyun.com) 注册  
2. 控制台完成 **个人实名认证**（域名、部分产品会要求）

---

## 2. 买域名

1. 控制台搜索 **域名**，或打开 [万网](https://wanwang.aliyun.com)  
2. 搜索心仪名字，优先 **`.com`**  
3. 加入购物车结算（先 **1 年** 即可）  
4. 购买后在 **域名控制台** 完成 **域名实名**（审核可能要几小时到 1～2 天）  
5. 实名通过前，解析有时不生效——等通过再指服务器

记下域名，例如：`example.com`。

---

## 3. 买香港服务器（关键）

推荐产品：**轻量应用服务器**（比自己配 ECS 简单）。

1. 控制台搜索 **轻量应用服务器**  
2. **立即购买** / 创建实例  
3. **地域务必选：中国香港**（不要选北京/杭州/上海等）  
4. 套餐建议（Beta 够用）：  
   - **2 核 2G** 或 **2 核 4G**  
   - 系统盘 40GB+  
   - 流量包按提示选月流量够用的档  
5. 镜像：  
   - **Ubuntu 22.04** 或 **24.04**（纯净系统）  
   - 不要选「WordPress 应用镜像」（我们要自己跑 Next）  
6. 设置 **root 密码** 或绑定 SSH 密钥（务必保存好）  
7. 下单并等待「运行中」  
8. 在实例详情复制 **公网 IP**

### 防火墙 / 防火墙规则

在轻量实例里打开 **防火墙**，放行：

| 端口 | 用途 |
|------|------|
| 22 | SSH（可限制只你的 IP，更安全） |
| 80 | HTTP（申请证书、跳转 HTTPS） |
| 443 | HTTPS 网站 |

应用内 Next 听 **3000** 即可，不必对公网开放 3000（由 Nginx 反代）。

---

## 4. 域名解析

1. 域名控制台 → 你的域名 → **解析**  
2. 添加记录：

| 主机记录 | 类型 | 记录值 |
|----------|------|--------|
| `@` | A | 香港服务器公网 IP |
| `www` | A | 同上（可选）或 CNAME 到 `@` |

3. TTL 默认即可；生效一般几分钟，最长可到数小时  

之后网站地址是：`https://你的域名`（先配完 SSL 再强调 https）。

---

## 5. 登录服务器

本机终端：

```bash
ssh root@你的公网IP
# 或：ssh ubuntu@你的公网IP   （视镜像默认用户而定）
```

首次建议更新：

```bash
apt update && apt upgrade -y
```

---

## 6. 安装 Node.js 20+

用 NodeSource 或 nvm 均可，示例（Node 20）：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx
node -v   # 应 ≥ 20
npm -v
```

全局装进程守护：

```bash
npm install -g pm2
```

---

## 7. 拉代码并配置

把 GitHub 仓库换成你的地址：

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/你的用户名/你的仓库.git waxlist
cd waxlist
npm ci
```

生产环境文件（**不要提交到 Git**）：

```bash
nano /var/www/waxlist/.env
```

最少需要：

```bash
DATABASE_URL="postgresql://...neon.../neondb?sslmode=require"
AUTH_SECRET="用 openssl rand -base64 32 生成"
AUTH_URL="https://你的域名"
AUTH_TRUST_HOST="true"
OWNER_EMAILS="你的邮箱@example.com"
YOUTUBE_API_KEY="你的 key"
# 若有 LLM / 邮件等，按 docs/user/environment.md 继续加
```

注意：

- `AUTH_URL` 必须是 **https://你的域名**，不要再写 vercel.app  
- 若仍用 Neon：在本地或服务器执行一次 schema 同步（库是空的才需要）：

```bash
cd /var/www/waxlist
export $(grep -v '^#' .env | xargs)
npx prisma db push
```

构建并启动：

```bash
npm run build
pm2 start npm --name waxlist -- start
pm2 save
pm2 startup
# 按屏幕提示再执行它给出的那行 command
```

应用默认 `http://127.0.0.1:3000`。

---

## 8. Nginx + HTTPS

### 8.1 先 HTTP 反代

```bash
nano /etc/nginx/sites-available/waxlist
```

内容示例（先把 `你的域名` 换掉）：

```nginx
server {
    listen 80;
    server_name 你的域名 www.你的域名;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用：

```bash
ln -sf /etc/nginx/sites-available/waxlist /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

浏览器访问 `http://你的域名`，应能打开站点（可先不强制 https）。

### 8.2 免费证书（Let’s Encrypt）

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名 -d www.你的域名
```

按提示选跳转 HTTPS。证书会自动续期。

确认 `.env` 里 `AUTH_URL=https://你的域名` 后若改过 env：

```bash
cd /var/www/waxlist
pm2 restart waxlist
```

---

## 9. 上线后怎么更新代码

当前 Waxlist 生产环境从 GitHub `main` 的干净提交发版：

```bash
git switch main
git pull --ff-only origin main
./scripts/deploy-prod.sh
```

脚本会拒绝非 `main`、脏工作区或尚未推到 `origin/main` 的提交；通过 rsync 同步代码，保留服务器 `.env` 与 `ecosystem.config.cjs`，随后在服务器执行安装、Prisma schema 同步、构建和 pm2 重启，并把 commit 写入 `DEPLOYED_COMMIT`。生产目录不要求是 Git 仓库，也不要再把服务器 `git pull` 当作当前发版方式。

日常检查、验收与回滚以 [release.md](./release.md) 为准。

---

## 10. 验收清单（务必用国内网络）

用 **手机 4G（不要开代理）**：

1. `https://你的域名/explore` 能打开  
2. 注册 / 登录  
3. 荐专、红心、评分  
4. `/chat` 找伴奏（有 `YOUTUBE_API_KEY` 时）  
5. 登录态刷新后还在（检查 `AUTH_URL` / `AUTH_SECRET`）

---

## 11. 费用量级（大约，以控制台为准）

| 项目 | 粗算 |
|------|------|
| 域名 `.com` | 约几十～百元 / 年 |
| 香港轻量 2C2G | 常见约几十～百+ 元 / 月（看活动） |
| Neon 免费档 | 小流量可先用 |
| 证书 | Let’s Encrypt 免费 |

---

## 12. 常见问题

| 现象 | 处理 |
|------|------|
| 解析不通 | 域名实名是否通过；A 记录 IP 是否最新；等 TTL |
| 502 Bad Gateway | `pm2 status` 看 waxlist 是否 online；`curl localhost:3000` |
| 登录循环 / 掉线 | `AUTH_URL` 是否 https 且与浏览器域名一致 |
| 构建内存不够 | 升到 2C4G，或加 swap |
| 国内仍偶发慢 | 港区正常现象；比完全打不开已是质变；再优化靠备案大陆 |
| 邮件收不到 | Resend 等海外邮件可能进垃圾箱；可换企业邮 / 国内 SMTP |

---

## 和旧 Vercel 方案的关系

| | Vercel（备选/历史） | 香港轻量（当前生产类型） |
|--|--------------|----------------------|
| 国内打开 | 你已失败 | 目标方案 |
| 部署方式 | push 自动 | 本机 `deploy-prod.sh` → rsync + build + pm2 |
| 域名 | `*.vercel.app` 或自定义指 Vercel | 自定义域名 A 记录指香港 IP |

详细环境变量说明见 [environment.md](./environment.md)。  
仅海外试用时的旧文档见 [deploy.md](./deploy.md)（Vercel + Neon）。
