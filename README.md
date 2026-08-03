# Waxlist

**Waxlist** 是面向听专、荐专与口碑沉淀的音乐社区（一期偏中文地下发行 / 网易云外链）。  
站内找伴奏 Agent 仍叫 **Beat Hunter**：自然语言或参考曲 → 可试听 type beat 短名单。

## 使用文档

- [快速开始与用法](./docs/user/README.md)
- [环境变量](./docs/user/environment.md)
- [YouTube API 配置](./docs/user/youtube-api.md)

## 本地运行

```bash
npm install
cp .env.example .env.local
# AUTH_SECRET、DATABASE_URL、可选 YouTube / LLM 密钥

npm run db:up    # 本机 Postgres
npm run db:push
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 功能概览

| 模块 | 路径 | 说明 |
|------|------|------|
| 地下精选 | `/explore` | 专辑列表、红心、站主爱听标签 |
| 我的红心 | `/favorites` | 个人收藏 |
| Beat Hunter | `/chat` | 找伴奏 Agent |
| 登录 / 注册 | `/login` `/register` | 社区写操作需要 |

## 合规

结果与外链仅供试听与发现，商用请遵循源站与版权方要求。详见站内 [关于](/about)。

## 开发

功能规划与缺陷跟踪使用 **GitHub Issues**。  
内部产品/技术设计文档仅维护在本地工作区，不推远程。
