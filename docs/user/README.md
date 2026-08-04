# Waxlist 使用说明

**Waxlist**：听专、荐专、红心与口碑（主入口：**优质发行**；一期：网易云外链）。  
**Beat Hunter**（站内模块）：帮歌手用自然语言或参考曲链接，拿到可试听的伴奏短名单。

## 能做什么

### 优质发行（Waxlist）
- 浏览专辑封面列表；筛选（红心 / 站主爱听 / 友情）与排序
- 登录后点红心收藏；「我的红心」在 explore 内筛选
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
- [**试用：Zeabur**](./deploy-zeabur.md)（类 Vercel，先测国内能否打开）
- [**内测计划与开发模式**](./beta-and-dev.md)
- [**国内部署：阿里云域名 + 香港轻量**](./deploy-aliyun-hk.md)（生产可参考；现网为腾讯云香港）
- [海外试用：Vercel + Neon](./deploy.md)

## 页面

| 页面 | 路径 |
|------|------|
| 优质发行 | `/explore` |
| 推荐专辑 | `/explore/submit`（登录后） |
| 我的红心 | `/explore?filter=heart` |
| 审核队列 | `/moderation`（站主 / 管理；侧栏盾牌图标） |
| 找伴奏 Beat Hunter | `/chat` |
| 登录 / 注册 | `/login` `/register` |
| 关于 | `/about` |

**推荐流程**：人人走同一推荐表单。普通用户推的新专进审核；**站主**推荐直接上架，不经审核。已上架专辑的再推（所有人）立即展示。

**账号**：邮箱注册并设置密码；之后登录只需邮箱 + 密码（无验证码）。用户库为空时第一个账号为**站主**；也可设 `OWNER_EMAILS`。

## 合规

试听与发现参考，商用授权以源站为准。不提供未授权下载。
