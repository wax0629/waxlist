<p align="center">
  <img src="./public/waxlist-mark.png" width="88" alt="Waxlist 标志" />
</p>

<h1 align="center">Waxlist</h1>

<p align="center">
  发现、推荐与收藏值得完整听完的专辑。<br />
  从中文独立发行出发，把散落的好作品重新递到听众面前。
</p>

<p align="center">
  <a href="https://waxlist-nu.vercel.app"><strong>在线体验</strong></a>
  ·
  <a href="https://waxlist-nu.vercel.app/explore/today">开一张专辑盲盒</a>
  ·
  <a href="https://waxlist-nu.vercel.app/explore/submit">推荐一张专辑</a>
</p>

<p align="center">
  <a href="https://github.com/wax0629/waxlist/stargazers"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/wax0629/waxlist?style=flat&color=ff6b9e" /></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-111111?style=flat&logo=nextdotjs" />
  <img alt="内测" src="https://img.shields.io/badge/status-内测-9b51e0?style=flat" />
  <img alt="MIT" src="https://img.shields.io/badge/license-MIT-111111?style=flat" />
</p>

![Waxlist 优质发行页面](./docs/assets/waxlist-preview.jpg)

> 如果 Waxlist 帮你遇见了一张好专，欢迎点一个 **Star**。这会帮助更多独立音乐听众发现它。

## 为什么做 Waxlist

流媒体很擅长继续播放，却不总擅长把一张值得完整听完的发行认真递给你。Waxlist 想补上这块：

- **有人推荐**：听众与创作者都可以提交作品，不只依赖算法曝光。
- **有迹可循**：红心、评分、评论、站主爱听与友情标记，让推荐不是一次性信息流。
- **能继续发现**：搜索、地区 / 年代 / 风格筛选、专辑盲盒与 UDG 专区，把歌荒变成探索。
- **保持克制**：链接回官方试听平台，不提供未授权下载。

## 已有功能

| 功能 | 入口 | 说明 |
| --- | --- | --- |
| 优质发行 | [`/explore`](https://waxlist-nu.vercel.app/explore) | 浏览、搜索、筛选、排序、评分与红心 |
| UDG 专区 | [`?filter=udg`](https://waxlist-nu.vercel.app/explore?filter=udg) | 集中发现地下与独立发行 |
| 专辑盲盒 | [`/explore/today`](https://waxlist-nu.vercel.app/explore/today) | 加权随机开一张今天的专辑 |
| 推荐专辑 | [`/explore/submit`](https://waxlist-nu.vercel.app/explore/submit) | 登录后提交网易云专辑链接 |
| 我的红心 | [`?filter=heart`](https://waxlist-nu.vercel.app/explore?filter=heart) | 回看自己收藏的发行 |
| Beat Hunter | [`/chat`](https://waxlist-nu.vercel.app/chat) | 用自然语言找可试听伴奏（Beta） |

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Tailwind CSS 4、Framer Motion
- PostgreSQL、Prisma
- NextAuth、Vitest

## 本地运行

需要 Node.js、npm 与 Docker。

```bash
git clone git@github.com:wax0629/waxlist.git
cd waxlist
npm install
cp .env.example .env.local
npm run db:up
npm run db:push
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。环境变量与数据库说明见[使用与运维文档](./docs/user/README.md)。

## 检查

```bash
npm test
npm run lint
npm run build
```

## 项目状态

Waxlist 当前为 `v0.1.0` 内测版，接口与数据结构仍可能调整。生产现在跑在 Vercel，可打开 [https://waxlist-nu.vercel.app](https://waxlist-nu.vercel.app)。`waxlist.cn` 正在从过期香港机切回 Vercel。近期重点是：

- 让真实听众和独立音乐人把专推上来
- 提高荐专、评分与评论体验
- 完善地区、年代、风格分类和索引
- 继续打磨 Beat Hunter 的检索质量

发现问题或有产品建议，可以[提交 Issue](https://github.com/wax0629/waxlist/issues/new)。想参与开发，欢迎先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 与 [HANDOFF.md](./HANDOFF.md)。

## 文档

| 文档 | 说明 |
| --- | --- |
| [HANDOFF.md](./HANDOFF.md) | 项目结构、现状与交接入口 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 如何试用、报缺陷与提交代码 |
| [使用与运维](./docs/user/README.md) | 环境变量、数据库、部署与运维 |
| [增长计划](./docs/ops/growth-plan.md) | 100 Star 与真实用户 |
| [日常发版](./docs/user/release.md) | 发版、验收与回滚 |
| [内测计划](./docs/user/beta-and-dev.md) | 当前阶段与邀请计划 |
| [历史设计归档](./docs/archive/) | 旧构思与决策记录 |

---

<p align="center">
  认真听完一张专，也认真把它推荐给下一个人。<br />
  <a href="https://github.com/wax0629/waxlist">觉得这个方向值得继续，就给 Waxlist 一个 Star。</a>
</p>
