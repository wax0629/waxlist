# Beat Hunter

面向**歌手 / 说唱人**的伴奏发现 Web 应用：用自然语言或参考曲链接，拿到可试听的 type beat / instrumental 短名单。

## 使用文档

完整说明见 **[docs/user/](./docs/user/README.md)**：

- [快速开始与用法](./docs/user/README.md)
- [环境变量](./docs/user/environment.md)
- [YouTube API 配置](./docs/user/youtube-api.md)

## 本地运行

```bash
npm install
cp .env.example .env.local   # 填入密钥，见 docs/user/environment.md
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) → `/chat`。

## 功能概览

| 能力 | 说明 |
|------|------|
| 对话找伴奏 | 描述风格 / 情绪 / 人声向 |
| 参考歌手气质 | 支持部分国内说唱歌手名 → 伴奏域检索 |
| 参考链接 | YouTube URL 或 `?ref_url=` |
| 点选 refine | 「再慢一点」「换一批」等 |
| 短名单 | 右侧卡片试听（授权以源站为准） |

## 合规

结果仅供试听与发现，商用请遵循源站与版权方要求。详见站内 [关于](/about)。

## 开发与贡献

功能规划与缺陷跟踪使用 **GitHub Issues**。  
内部产品/技术设计文档不放在本仓库远程，仅维护在本地工作区。
