# 如何获取 YouTube Data API Key

Beat Hunter v0.1 用 **YouTube Data API v3** 做唯一真实检索源。  
密钥只放服务端：项目根目录 `.env.local` 的 `YOUTUBE_API_KEY`（不要提交到 Git）。

官方入门：https://developers.google.com/youtube/v3/getting-started

---

## 步骤（约 5～10 分钟）

### 1. 打开 Google Cloud

1. 登录 Google 账号  
2. 打开 [Google Cloud Console](https://console.cloud.google.com/)  
3. 顶部选择或 **新建项目**（例如 `beat-hunter`）

### 2. 启用 YouTube Data API v3

任选其一：

- 直接打开：  
  https://console.cloud.google.com/marketplace/product/google/youtube.googleapis.com  
  选中你的项目 → **Enable / 启用**

- 或：菜单 **APIs & Services → Library** → 搜索 `YouTube Data API v3` → **Enable**

### 3. 创建 API Key

1. **APIs & Services → Credentials**  
   https://console.cloud.google.com/apis/credentials  
2. **+ Create Credentials → API key**  
3. 复制生成的密钥  

### 4. （强烈建议）限制密钥

在密钥详情里 **Restrict key**：

| 限制 | 建议 |
|------|------|
| API restrictions | 只勾选 **YouTube Data API v3** |
| Application restrictions | 开发阶段可先 **None**；上线后改为 IP 限制（服务器 IP） |

> 注意：浏览器前端**不要**放这个 key。我们只在 Next 服务端 `search` / `videos` 调用。

### 5. 写入本地环境

在项目根目录：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```bash
YOUTUBE_API_KEY=你的密钥粘贴在这里
```

重启开发服务：

```bash
npm run dev
```

聊天里再发一句「女声慢热 R&B type beat」，卡片 `source` 应为 **youtube**，链接为真实 `watch?v=`。

未配置 key 时会自动 **mock 降级**，产品仍可演示。

---

## 配额说明

- 默认每日配额约 **10,000 units**（以 Google 控制台为准）  
- `search.list` 一次大约 **100 units**  
- 本项目每轮最多约 2～3 次 search，开发够用；耗尽后 API 会报错，我们会降级 mock  

查看用量：Cloud Console → APIs & Services → YouTube Data API v3 → **Quotas / Metrics**

---

## 常见问题

| 现象 | 处理 |
|------|------|
| 仍显示 mock | 确认 `.env.local` 文件名、变量名、已重启 `npm run dev` |
| 403 / API not enabled | 项目未启用 YouTube Data API v3 |
| 400 API key not valid | 密钥复制不完整，或限制过严 |
| 配额超限 | 控制台看用量；次日重置或申请提高配额 |

---

## 安全

- 不要把 key 发到聊天、截图、公开仓库  
- `.gitignore` 已忽略 `.env.local`  
- 若 key 泄露：Credentials 页 **Regenerate / Delete** 旧 key  
