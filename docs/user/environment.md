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

密钥只放在服务端环境（`.env.local` / 托管平台 Secret），**不要**提交到 Git，也不要写进前端代码。

会话数据默认写在服务器本地 `.data/sessions/`（已 gitignore），刷新页面可恢复同一 `session_id`。
