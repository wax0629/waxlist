# YouTube Data API 配置（自托管）

**Beat Hunter**（找伴奏）真检索依赖 [YouTube Data API v3](https://developers.google.com/youtube/v3)。

## 步骤概要

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建或选择项目  
3. 启用 **YouTube Data API v3**  
4. 创建凭据 → API 密钥  
5. （建议）限制密钥仅用于 YouTube Data API，并限制来源 IP / 应用  
6. 将密钥写入 `.env.local`：

```bash
YOUTUBE_API_KEY=你的密钥
```

7. 重启 `npm run dev` 或生产进程  

## 配额说明

- Search 等接口有每日配额，频繁 refine 会消耗较快  
- 应用侧对相同 query 有短时缓存，但仍建议监控 Cloud Console 用量  
- 配额用尽时接口会失败，产品会降级提示  

## 安全

- 不要把 Key 提交到公开仓库  
- 不要在客户端 JavaScript 中硬编码 Key  
