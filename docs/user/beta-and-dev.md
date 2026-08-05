# 内测计划与后续开发模式

> 生产：`https://waxlist.cn`（腾讯云香港 + Nginx + pm2 + Neon）  
> 日常开发：本机 `localhost:3000` + 本地 Postgres  
> 原则：**先内测攒真反馈，正式上线后功能在本地做，版本成熟再推生产**

---

## 一、当前状态（内测前基线）

已具备：

| 能力 | 说明 |
|------|------|
| 优质发行 | 列表 / 详情 / 筛选（红心·站主爱听·友情）/ 排序（推荐先后·发行时间·评分） |
| 荐专与内容管理 | 所有登录用户提交后默认上架；管理浏览近期内容并事后下架；旧版待审记录仍可清理 |
| 互动 | 红心、评分、评论、曲目推荐、友情标签（站主） |
| 账号 | 邮箱密码登录；首号/OWNER_EMAILS 为站主 |
| 找伴奏 | Beat Hunter（Beta，不抢主线） |
| 部署 | 域名 HTTPS、健康检查 `/health` |

数据库：**Neon 为线上权威库**；本地可按需从线上 dump 对齐。

---

## 二、内测计划

### 1. 目标

- 验证主路径：**逛专 → 点红心 → 荐专 → 登录/评分**
- 收集真实专辑与推荐理由，不追求量
- 发现卡点（登录、网易云链接、内容管理、代理访问等）

### 2. 范围（做 / 不做）

**做**

- 邀请熟人 / UDG 圈小范围试用
- 站主先铺一批评过的专（有理由更好）
- 微信备注「Waxlist」收集反馈（见关于页）

**不做（内测期）**

- 不大规模投放、不承诺完整分类体系
- 不把 Beat Hunter 当主推卖点
- 不为单次小反馈热更生产（记 issue，攒版本）

### 3. 邀请话术（可改）

> 做了个听专/荐专的小站 Waxlist，内测中。  
> 地址：https://waxlist.cn  
> 可以逛专辑、点红心、推一张你觉得值得听的。  
> 有问题或想加微信反馈：Wackox（备注 Waxlist）

### 4. 验收清单（发邀请前）

- [ ] 手机流量 / 常见网络能打开 `https://waxlist.cn`
- [ ] `/health` 返回 `ok waxlist hk-1`
- [ ] 注册/登录正常
- [ ] explore 列表与详情正常
- [ ] 普通用户荐专后立即出现在列表
- [ ] 管理可在 `/moderation` 查看近期内容并下架问题条目
- [ ] 红心、评分可用
- [ ] 关于页联系方式正确

### 5. 反馈收集

| 渠道 | 用途 |
|------|------|
| 微信 Wackox | 主反馈 |
| GitHub Issues | 可复现的缺陷与排期功能 |
| 站内表现 | 近期荐专、遗留待审数量、评分分布 |

### 6. 内测 → 公开

当出现以下情况可考虑「宣布上线」：

- 主路径连续稳定、无明显 5xx
- 有一批可看的内容与真实推荐
- 已知问题有 issue 跟踪

---

## 三、后续开发模式

### 节奏

```text
日常：本地开发 + 本地库验证
     ↓
凑够一个可讲的版本（或修严重线上问题）
     ↓
打 tag / 写简短说明 → 推 GitHub main → 本机 deploy-prod rsync / build / 重启
```

| | 日常 | 发版 |
|--|------|------|
| 代码 | feature 在本地叠 | `main` 可部署 |
| 数据 | 本地 Docker Postgres | Neon 生产库 |
| 环境 | `.env` / `.env.local` | 服务器 `/var/www/waxlist/.env` |
| 频率 | 任意 | **版本成熟再推**，避免随手热更 |

### 分支建议

- `main`：与线上一致或即将上线
- 大改可开分支，合并前本地自测

### 发版步骤（香港机）

生产目录当前用 **rsync 同步代码**（保留服务器上的 `.env` 与 `ecosystem.config.cjs`），不是服务器上 `git pull`。

```bash
# 1. 代码进 GitHub
git push origin main

# 2. 本机一键部署（需 SSH → ubuntu@43.161.255.64）
./scripts/deploy-prod.sh

# 3. 验收
curl -sS https://waxlist.cn/health
```

### 数据库同步

完整规范：**[database-workflow.md](./database-workflow.md)**

- **权威库**：Neon（真实注册 / 上传）
- **日常 dev**：本地 Docker，`DATABASE_URL=localhost`
- **要对齐内容**：`npm run db:pull-prod`（Neon → 本地，单向）
- **改表结构上生产**：发版时 `prisma db push` 或 `npm run db:push-schema-prod`
- **禁止**：本地 dump 覆盖 Neon

### Issue 约定

- 新功能 / bug 开 Issue，做完关闭并附 PR 或 commit
- 内测反馈可先记 Issue 再排期，不强制当场上线

---

## 四、环境速查

| 项 | 值 |
|----|-----|
| 生产 URL | https://waxlist.cn |
| 健康检查 | https://waxlist.cn/health |
| 服务器 | 腾讯云香港 `43.161.255.64` |
| 进程 | pm2 `waxlist` |
| 反代 | Nginx 80/443 |
| 数据库 | Neon Postgres |
| 本地 | `npm run dev` → http://localhost:3000 |

Clash 等代理访问本站时，建议将 `waxlist.cn` 设为 **DIRECT**（系统代理绕过）。

---

## 五、相关文档

- [环境变量](./environment.md)
- [香港部署说明](./deploy-aliyun-hk.md)（含腾讯云同类操作）
- [使用说明](./README.md)
