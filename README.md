<p align="center">
  <img src="./public/waxlist-mark.png" width="88" alt="Waxlist 标志" />
</p>

<h1 align="center">Waxlist</h1>

<p align="center">
  发现、推荐与收藏值得完整听完的专辑。<br />
  从中文独立发行出发，把散落的好作品重新递到听众面前。
</p>

<p align="center">
  <a href="https://waxlist.cn"><strong>打开站点</strong></a>
  ·
  <a href="https://waxlist.cn/explore/today">开一张专辑盲盒</a>
  ·
  <a href="https://waxlist.cn/explore/submit">推荐一张专辑</a>
</p>

<p align="center">
  <img alt="内测" src="https://img.shields.io/badge/status-内测-9b51e0?style=flat" />
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-111111?style=flat&logo=nextdotjs" />
  <img alt="MIT" src="https://img.shields.io/badge/license-MIT-111111?style=flat" />
</p>

![Waxlist 优质发行页面](./docs/assets/waxlist-preview.jpg)

## 这是什么

流媒体很会继续播放，却不总把一张值得完整听完的发行认真递给你。Waxlist 补这块：

- **有人推**：听众和创作者都可以提交网易云专辑，写下为什么值得听。
- **能留下**：红心、评分、评论、站主爱听，推荐不是刷过去就没了。
- **还能逛**：搜索、筛选、UDG 专区、专辑盲盒。歌荒时随手开一张。
- **不越界**：只链回官方试听，不提供未授权下载。

现在是内测。站点：[https://waxlist.cn](https://waxlist.cn)

## 先这样用

1. 打开 [优质发行](https://waxlist.cn/explore)，找一张想听完的。
2. 点进封面，去网易云把整张听完。
3. 觉得值，就 [登录后推上来](https://waxlist.cn/explore/submit)，或先点红心。
4. 没目标时，去 [开一张盲盒](https://waxlist.cn/explore/today)。

独立音乐人可以把作品递上来，让更多人听到、留下一句认真的话。

| 你想做什么 | 去哪 |
| --- | --- |
| 逛专辑 | [https://waxlist.cn/explore](https://waxlist.cn/explore) |
| 地下 / 独立发行 | [UDG 专区](https://waxlist.cn/explore?filter=udg) |
| 随便开一张 | [专辑盲盒](https://waxlist.cn/explore/today) |
| 推荐自己听过的 | [荐专](https://waxlist.cn/explore/submit) |
| 说说这个站 | [关于与反馈](https://waxlist.cn/about) |

找伴奏 [Beat Hunter](https://waxlist.cn/chat) 仍是 Beta，和听专分开，不抢主线。

## 反馈

内测阶段功能会改，欢迎直接说哪里卡住、想听什么。

- 站内：关于页的反馈表单
- 微信：**Wackox**（备注 Waxlist）
- 邮箱：xux9278@gmail.com
- 可复现的缺陷：[GitHub Issues](https://github.com/wax0629/waxlist/issues/new)

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

打开 [http://localhost:3000](http://localhost:3000)。环境变量与数据库见 [使用与运维](./docs/user/README.md)。

```bash
npm test
npm run lint
npm run build
```

技术栈：Next.js 16、React 19、PostgreSQL、Prisma、NextAuth。参与开发见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 文档

| 文档 | 说明 |
| --- | --- |
| [HANDOFF.md](./HANDOFF.md) | 项目结构与现状 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 试用、报缺陷、提交代码 |
| [使用与运维](./docs/user/README.md) | 环境变量、数据库、部署 |
| [日常发版](./docs/user/release.md) | 发版、验收与回滚 |
| [内测计划](./docs/user/beta-and-dev.md) | 当前阶段 |
| [增长计划](./docs/ops/growth-plan.md) | 用户积累（内部） |

---

<p align="center">
  认真听完一张专，也认真把它推荐给下一个人。
</p>
