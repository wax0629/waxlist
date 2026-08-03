# Waxlist 使用说明

**Waxlist**：听专、荐专、红心与口碑（一期：网易云外链精选）。  
**Beat Hunter**（站内模块）：帮歌手用自然语言或参考曲链接，拿到可试听的伴奏短名单。

## 能做什么

### 精选社区（Waxlist）
- 浏览专辑封面列表
- 登录后点红心 → 进入「我的红心」
- 站主点过红心的专会显示 **站主爱听** 标签

### 找伴奏（Beat Hunter）
- 描述风格、情绪、人声向、速度
- 提到国内说唱歌手气质（如法老）
- 粘贴 YouTube 参考链接
- 点选修正 chips 再搜

## 快速开始（自托管）

```bash
npm install
cp .env.example .env.local
# 编辑密钥与 DATABASE_URL

npm run db:up
npm run db:push
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

- [环境变量](./environment.md)
- [YouTube API](./youtube-api.md)

## 页面

| 页面 | 路径 |
|------|------|
| 精选 | `/explore` |
| 我的红心 | `/favorites` |
| 找伴奏 Beat Hunter | `/chat` |
| 登录 / 注册 | `/login` `/register` |
| 关于 | `/about` |
| 站主添加专辑 | `/owner/releases`（仅站主） |

注册：用户库为空时第一个账号为**站主**；也可设 `OWNER_EMAILS`。

## 合规

试听与发现参考，商用授权以源站为准。不提供未授权下载。
