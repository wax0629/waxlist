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
| `OWNER_EMAILS` | 可选 | 站主邮箱列表（逗号分隔）；库为空时**第一个注册用户**也会成为站主 |

密钥只放在服务端环境（`.env.local` / 托管平台 Secret），**不要**提交到 Git，也不要写进前端代码。

### 本地数据目录（已 gitignore）

| 路径 | 用途 |
|------|------|
| `.data/sessions/` | 找伴奏聊天会话 |
| `.data/auth/users.json` | 注册用户（含角色） |
| `.data/releases/releases.json` | 精选发行库（首次可从 `data/releases.seed.json` 种子） |

### 角色说明

| 角色 | 含义 |
|------|------|
| `owner` | 站主：爱听库、最高权限 |
| `admin` | 管理：审核、运营工具 |
| `user` | 普通用户：推荐、打分 |

登录 / 注册页：`/login`、`/register`。精选：`/explore`。
