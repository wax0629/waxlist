# Waxlist 项目交接

> 最后更新：2026-08-06 · 版本 **v0.1.0** · 阶段 **内测**
> 生产：**https://waxlist.cn**

---

## 1. 项目是做什么的

**Waxlist** 是一个 **听专 / 荐专 / 口碑** 社区（偏网易云外链），解决「歌荒时不知道下一张听什么」：

| 能力 | 说明 |
|------|------|
| **优质发行** `/explore` | 专辑列表、分类筛选、排序、搜索、列表内评分与红心 |
| **详情** `/explore/[id]` | 封面、推荐理由、曲目、评分评论、跳转网易云 |
| **荐专** `/explore/submit` | 登录后贴网易云链接提交；可选填写地区，默认上架，可后审下架 |
| **专辑盲盒** `/explore/today` | 加权随机开一盒（非死规则队列） |
| **后台** `/admin` | 概览、分类维护、用户角色（站主分配管理） |
| **内容管理** `/moderation` | 浏览近期荐专、事后下架、清理遗留待审 |
| **关于** `/about` | 故事、版本、**反馈表单**（邮件） |
| **Beat Hunter** `/chat` | 找伴奏 Agent（**Beta，不抢主线**） |

**不做（当前）**：站内播放网易云正版流、大规模投放、完整分类体系。

品牌话术：**find · rec · heart**（发现 / 推出去 / 放进心里），避免「挖」类旧文案。

---

## 2. 技术栈与架构

```
用户浏览器
    ↓ HTTPS
腾讯云香港 43.161.255.64
    Nginx (443) → Next.js 16 (pm2: waxlist) :3000
                      ↓
              Neon Postgres（新加坡 ap-southeast-1）
              pm2: waxlist-db-keepalive（防 Neon 休眠）
```

| 层 | 选型 |
|----|------|
| 框架 | Next.js 16 App Router · React 19 · TypeScript |
| 鉴权 | Auth.js (NextAuth v5) JWT · 当前入口为邮箱密码；OTP 后端能力保留、未接入当前登录页 |
| 数据库 | Prisma 6 + Postgres（本地 Docker / 生产 Neon） |
| 邮件 | Resend（生产已配）；可选 SMTP |
| 部署 | `scripts/deploy-prod.sh` → rsync + `npm ci` + `prisma db push` + build + pm2 |
| 仓库 | `github.com:wax0629/waxlist.git` |

**路径约定**

- 应用代码：`src/`
- Schema：`prisma/schema.prisma`
- 运维文档：**只维护 `docs/user/`**；当前生产口径以本文件和 `docs/user/README.md` 为准
- 早期构思草稿：`docs/archive/`（历史参考，勿当现行规格）

---

## 3. 现在进行到哪

### 已完成（内测可用）

- [x] 优质发行主路径：列表 / 详情 / 红心 / 评分 / 荐专  
- [x] 列表内点星评分、搜索栏、顶栏账号在搜索旁  
- [x] 移动端底部 Tab（发行 / 盲盒 / 找伴奏 / 关于）  
- [x] 专辑盲盒（加权随机 + 本轮去重 + 开盒后评分 / 发行日期）
- [x] 盲盒桌面端 880px 等宽书页布局；长信息在右页独立滚动，移动端上下排列；未开封黑胶居中
- [x] Waxlist 标签页图标（浅色 / 深色浏览器背景均可辨识）
- [x] 发行年代筛选、地区字段与后台批量补录；地区覆盖率达到 90% 后自动开放前台入口
- [x] 荐专表单可选填写地区；空值进入后台待分类，不用不可靠的文本猜测强行归类
- [x] 桌面侧栏与移动端底部筛选面板；风格入口保留“整理中”状态
- [x] 后台两期雏形 + 待审角标  
- [x] 推荐默认上架、可下架（事后审核）  
- [x] Neon 从 US 迁到 **新加坡**；香港机保活进程  
- [x] HTTPS + `/health`  
- [x] 关于页版本信息 + 反馈邮件 API  
- [x] 反馈收件：`FEEDBACK_TO=xux9278@gmail.com`（见下限制）
- [x] Vitest 基线：网易云解析、认证规则、角色权限、友情标签、荐专发布、日期格式与分类规则（26 条）

### 已知限制 / 坑

1. **Resend 测试模式**：未验证域名时 **只能发到注册邮箱** `xux9278@gmail.com`。  
   要同时收 `3106731940@qq.com`：验证域名并改 `EMAIL_FROM`，或改 SMTP。  
2. **Explore SSR 仍偏慢**（约 1s 级）：Neon 冷启动 + 多查询；保活已缓解冷启动。  
3. **无站内播放**：只外链网易云。  
4. **Beat Hunter** 依赖 YouTube API / LLM，配额与延迟需单独看。  
5. 内容量仍少，内测靠站主铺专 + 熟人推。
6. **Lint 尚未清零**：React 19 effect/state 新规则等历史问题现有 15 个错误、4 个警告；本次分类相关文件已单独通过，production build 不受影响。
7. **依赖审计待升级**：`npm audit --omit=dev` 当前报告 Next.js/PostCSS/Sharp 与 Auth.js/Nodemailer 链上的 6 个 high，自动修复会跨当前版本范围，需单独升级验证。

### 当前业务口径（交接时不要混用旧流程）

- 登录 / 注册：当前页面使用**邮箱 + 密码**；OTP API 与邮件发送代码仍保留，但不是当前用户入口。
- 荐专：普通用户和员工提交后均**默认上架**；`/moderation` 用于浏览近期内容、事后下架，以及清理旧版遗留待审记录。
- 发版：GitHub `main` 是唯一事实来源；当前生产机使用 `scripts/deploy-prod.sh` 从本机 **rsync**，不是在服务器执行 `git pull`。
- 部署文档：香港机是当前生产方案；Vercel、Zeabur 文档仅供备选或历史参考。

### 建议下一步（产品）

1. 小范围内测邀请（话术见 `docs/user/beta-and-dev.md`）  
2. 收集反馈（站内表单 / 微信 Wackox）  
3. 性能：列表缓存、减串行查库  
4. 在 `/admin/categories` 补录存量地区；覆盖率达到 90% 后前台自动开放
5. Resend 域名或 SMTP，反馈可抄送 QQ  

---

## 4. 关键环境速查

| 项 | 值 |
|----|-----|
| 生产域名 | https://waxlist.cn |
| SSH | `ubuntu@43.161.255.64` |
| 应用目录 | `/var/www/waxlist` |
| 进程 | `pm2 list` → `waxlist` + `waxlist-db-keepalive` |
| 数据库 | Neon Singapore pooler（连接串在服务器 `.env`，**勿提交 Git**） |
| 发版 | `./scripts/deploy-prod.sh`（rsync **排除** `.env`） |

### 常用命令

```bash
# 本地
npm run db:up && npm run db:push && npm run dev

# 生产发版（先在 GitHub 合并 PR）
git switch main && git pull --ff-only origin main
./scripts/deploy-prod.sh

# 服务器
ssh ubuntu@43.161.255.64
cd /var/www/waxlist && pm2 logs waxlist --lines 50
curl -sS https://waxlist.cn/health
```

### 环境变量（生产必有）

见 `docs/user/environment.md` 与 `.env.example`。关键：

- `DATABASE_URL` — Neon  
- `AUTH_SECRET` / `AUTH_URL=https://waxlist.cn`  
- `RESEND_API_KEY` / `EMAIL_FROM`  
- `FEEDBACK_TO` — 反馈收件  
- `OWNER_EMAILS` — 站主邮箱  
- Beat Hunter：`YOUTUBE_API_KEY`、`XAI_API_KEY` 等（可选）  

本地密钥：`.env` / `.env.local` / `.env.neon.local`（均 gitignore）。

---

## 5. 角色

| 角色 | 能力 |
|------|------|
| owner 站主 | 后台、用户角色、内容管理、友情标签、站主爱听 |
| admin 管理 | 内容管理、事后下架与发行地区补录（由站主分配） |
| user | 荐专、红心、评分、评论 |

详见 `docs/user/admin-accounts.md`。

---

## 6. 文档地图（清理后）

| 文档 | 用途 |
|------|------|
| **本文件 `HANDOFF.md`** | 交接总览 |
| `docs/user/README.md` | 使用与本地启动 |
| `docs/user/beta-and-dev.md` | 内测节奏 |
| `docs/user/database-workflow.md` | Neon × 本地、迁区 |
| `docs/user/release.md` | **日常发版、线上验收与回滚** |
| `docs/user/deploy-aliyun-hk.md` | 香港机部署参考（当前生产类型） |
| `docs/user/deploy-zeabur.md` | Zeabur 备选试用 |
| `docs/user/deploy.md` | Vercel 历史 / 海外备选 |
| `docs/user/email-auth.md` | 可选 OTP / 邮件发送（当前登录页不用 OTP） |
| `docs/user/environment.md` | 环境变量表 |
| `docs/user/admin-accounts.md` | 角色分发 |
| `docs/user/catalog-filter-design.md` | 分类规则、补录与筛选交互 |
| `docs/archive/` | 旧构思 / 旧规格（**非现行**） |

---

## 7. 目录结构（精简）

```
waxlist/
├── HANDOFF.md              ← 你在这里
├── README.md
├── package.json            # version 0.1.0
├── prisma/schema.prisma
├── scripts/                # deploy / db / neon-keepalive
├── docs/user/              # 现行运维文档
├── docs/archive/           # 历史草稿
├── src/app/                # 页面与 API
├── src/components/
├── src/lib/                # auth / releases / agent / mail…
└── public/waxlist-mark.png
```

---

## 8. 联系

- 站主微信：**Wackox**（备注 Waxlist）  
- 邮箱：**xux9278@gmail.com**  
- 站内：关于页反馈表单  

交接时请确认：服务器 SSH 权限、Neon 控制台、Resend、GitHub 仓库权限、域名 DNS。
