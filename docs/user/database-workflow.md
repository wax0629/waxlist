# 数据库规范：Neon 生产 × 本地开发

> **原则：真实用户与真实内容只活在 Neon 生产库。**  
> 本地默认用 Docker Postgres 做功能开发；需要对照线上数据时，**只允许 Neon → 本地** 单向拉一份快照，禁止把本地库整包推回 Neon。

---

## 1. 两套库分别干什么

| | **Neon 生产** | **本地 Docker Postgres** |
|--|----------------|---------------------------|
| 用途 | 线上 `waxlist.cn` 真实注册、荐专、红心 | 日常开发、改功能、跑坏实验 |
| 连接串位置 | 服务器 `/var/www/waxlist/.env` 的 `DATABASE_URL` | 本机 `.env` / `.env.local` |
| 默认值 | Neon 控制台复制（含 `sslmode=require`） | `postgresql://waxlist:waxlist@localhost:5432/waxlist` |
| 谁可以写 | **仅生产应用**（pm2 上的 Next） | 你本机 `npm run dev` |
| 数据权威 | ✅ **唯一权威** | 可随时清空 / 从 Neon 覆盖 |

```text
  ┌─────────────┐         发版只推代码 + prisma db push（改结构）
  │  你的电脑   │ ──────────────────────────────────────────► 香港机 Next
  │  Docker DB  │                                              │
  └──────▲──────┘                                              │ 读写
         │ 可选：快照拉下来                                     ▼
         └──────────────────── Neon 生产库 ◄──────────────────┘
              （pg_dump → 本地 restore）
              禁止：本地 dump 覆盖 Neon
```

---

## 2. 日常开发（推荐默认）

本机 **永远** 指向 Docker，不直连 Neon 做日常 dev（避免误改真实用户、也避免本地连 US Neon 卡顿）。

```bash
# 1. 开 Docker Desktop，再起库
npm run db:up

# 2. .env / .env.local 保持本地串（见 .env.example）
# DATABASE_URL=postgresql://waxlist:waxlist@localhost:5432/waxlist

# 3. 结构对齐当前 prisma/schema.prisma
npm run db:push

# 4. 开发
npm run dev
```

| 命令 | 作用 |
|------|------|
| `npm run db:up` | 启动本地 Postgres 容器 |
| `npm run db:down` | 关掉容器 |
| `npm run db:push` | 把 schema 推到**当前** `DATABASE_URL` 指向的库 |
| `npm run db:studio` | Prisma Studio 看当前库 |
| `npm run db:pull-prod` | 从 Neon **拉快照覆盖本地**（见下） |
| `npm run db:push-schema-prod` | **只改结构**推到 Neon（需显式 env，见下） |

本地空库时：自己注册测试号即可；需要真实专辑列表时再 `db:pull-prod`。

---

## 3. 从 Neon 拉数据到本地（只读副本）

适用：复现线上数据问题、用真实专辑测 UI、内测前对齐内容。

### 准备

1. 从 Neon 控制台或生产服务器 `.env` 取出连接串（**不要提交 Git**）。  
2. 本机放在 **shell 环境变量** 或 **本机未入库文件** `.env.neon.local`（已在 `.gitignore` 建议忽略）：

```bash
# .env.neon.local（示例，勿提交）
# 优先用「直连」主机（去掉 -pooler），pg_dump 更稳
DATABASE_URL_PROD="postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

Pooler 地址（带 `-pooler`）可能不支持 `pg_dump`：把主机名里的 `-pooler` 去掉，并去掉 `pgbouncer=true` 参数。

### 执行

```bash
# 确保本地 Docker 已 up
npm run db:up

# 拉取并覆盖本地 waxlist 库
npm run db:pull-prod
```

脚本会：

1. 用 `DATABASE_URL_PROD` / `NEON_DATABASE_URL` 对 Neon 做 `pg_dump`  
2. 清掉不兼容的 dump 指令后，restore 到本地 `DATABASE_URL`  
3. **不会**回写 Neon  

拉完后本地 `.env` 仍指向 localhost，用的是**副本**。

### 注意

- 快照会含真实用户邮箱等，**勿分享、勿提交**  
- 在本地副本上随便测、乱点红心可以；**改完 schema 要用 `db:push` 推结构到 Neon，不要 dump 回去**  
- 拉快照会**覆盖**本地库全部表数据  

---

## 4. 改表结构怎么上生产

真实流程：

```text
1. 改 prisma/schema.prisma
2. 本地 npm run db:push 验证
3. 代码发版（deploy-prod.sh 里会再执行 prisma db push）
4. 生产 DATABASE_URL 仍是 Neon → 只升级结构，保留数据
```

手动只推结构到 Neon（不发整站时）：

```bash
# 临时注入生产串（当前 shell，勿 echo 进日志仓库）
export DATABASE_URL_PROD='postgresql://...neon.../neondb?sslmode=require'
npm run db:push-schema-prod
```

`db:push-schema-prod` **强制**要求 `DATABASE_URL_PROD`，避免误把本地串推到「以为是生产」的地方。

---

## 5. 绝对禁止

| 行为 | 原因 |
|------|------|
| 本地 `DATABASE_URL` 长期指向 Neon 做日常 dev | 误删用户/专辑；延迟高 |
| `pg_dump` 本地 → restore 覆盖 Neon | 覆盖真实注册与上传 |
| 把完整 `DATABASE_URL` 写进 Git / Issue / 聊天截图 | 泄密 |
| 生产开 `AUTH_OTP_DEV=1` | 验证码泄露 |

---

## 6. 发版与数据库检查清单

发版前：

- [ ] schema 已在本地 `db:push` 通过  
- [ ] 无「清库 / seed 覆盖生产」类脚本会在 deploy 里执行  
- [ ] 生产 `.env` 的 `DATABASE_URL` 仍是 Neon（deploy rsync **排除** `.env`）  

发版后：

- [ ] `https://waxlist.cn/health`  
- [ ] 登录 + explore 列表有数据  
- [ ] 若有新字段，详情/列表显示正常  

---

## 7. 三种工作模式速查

| 模式 | DATABASE_URL | 何时用 |
|------|----------------|--------|
| **A. 纯本地** | localhost Docker | 默认开发、改功能、瞎测 |
| **B. 本地副本** | localhost，但数据来自 `db:pull-prod` | 对照真实内容 / 复现线上 bug |
| **C. 生产** | Neon（仅服务器） | 真实用户；本机不要用 C 做 dev |

---

## 8. 把 Neon 迁到更近的区域（香港 / 国内）

Neon **不能改**已有 project 的 region。当前生产若在 US（如 `us-east-2`），要迁到离香港更近处：

| 目标 | Neon region id | 说明 |
|------|----------------|------|
| **推荐** | `aws-ap-southeast-1` **Singapore** | Neon 亚洲可选区域里离香港机最近 |
| 备选 | `aws-ap-southeast-2` Sydney | 更远，一般不选 |

### 步骤

1. 打开 [Neon Console](https://console.neon.tech) → **New Project**  
   - **Region：AWS Asia Pacific (Singapore)**  
   - 项目名例如 `waxlist-sg`  
2. 复制连接串（建议先用**直连**主机，不含 `-pooler`；切流量后应用可用 pooler）  
3. 本机 `.env.neon.local`（勿提交）：

```bash
DATABASE_URL_PROD="postgresql://...@旧.us-east-2.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_NEW="postgresql://...@新.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

4. 迁移数据（旧库只读 dump，新库被覆盖写入）：

```bash
npm run db:migrate-neon-region
```

5. 切生产流量（改香港机 `.env` 的 `DATABASE_URL` + `pm2 restart`）：

```bash
npm run db:cutover-neon-prod
```

6. 打开 `https://waxlist.cn/explore` 确认登录与列表；无误后把 `DATABASE_URL_PROD` 改成新串。  
7. 旧 US 项目观察 1–3 天再删。

也可在 Neon 控制台用 **Import Data Assistant** 建新区域项目并导入（适合 <10GB）；小库用本仓库脚本更可控。

---

## 9. Neon 常开 / 去掉冷启动

Neon 默认 **空闲 5 分钟后 scale-to-zero**，下次请求会冷启动（约 0.5–2s）。

| 方案 | 谁可用 | 做法 |
|------|--------|------|
| **关 Scale to zero**（官方） | **Launch / Scale 付费档** | Console → Branches → Computes → **Edit** → 关闭 Scale to zero |
| **保活进程**（本站默认） | Free 也行 | 香港机 `pm2` 跑 `scripts/neon-keepalive.mjs`，约每 3 分钟 `SELECT 1` |

### 控制台正式常开（推荐长期）

1. 确认账号是 **Launch 或 Scale**（Free **不能**关 scale-to-zero）  
2. [console.neon.tech](https://console.neon.tech) → 选 **新加坡生产项目**  
3. **Branches** → 默认 branch → **Computes** → **Edit**  
4. 关闭 **Scale to zero** → Save  

注意：常开后按 CU 计费（最小约 0.25 CU × 24h）。  
付费档关掉休眠后，可停掉保活：`pm2 delete waxlist-db-keepalive`。

### 服务器保活（已部署时）

```bash
# 在生产机
cd /var/www/waxlist
pm2 start scripts/neon-keepalive.mjs --name waxlist-db-keepalive
pm2 save
pm2 logs waxlist-db-keepalive --lines 20
```

`ms` 经常 >400 说明仍在冷启动；稳定在几十毫秒说明保持热。

Free 月度 CU 有限：保活 ≈ 算力几乎不睡，可能顶满免费额度，届时需升级 Launch 或迁回自建 Postgres。

---

## 10. 相关

- 环境变量总表：[`environment.md`](./environment.md)  
- 发版与内测节奏：[`beta-and-dev.md`](./beta-and-dev.md)  
- 管理角色：[`admin-accounts.md`](./admin-accounts.md)  
