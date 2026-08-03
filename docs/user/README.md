# Beat Hunter 使用说明

Beat Hunter 帮助**歌手 / 说唱人**用自然语言或参考曲链接，快速拿到可试听的伴奏短名单（YouTube type beat / instrumental 向）。

## 能做什么

- 描述风格、情绪、人声向、速度（例：地下一点、慢热、鼓别太抢）
- 提到国内说唱歌手气质（例：法老那种感觉）→ 系统转成伴奏域检索词
- 粘贴 YouTube 参考链接
- 点选「修正 · 再搜」chips 收窄结果
- 右侧短名单点开试听（授权与商用以源站为准）

## 快速开始（开发者自托管）

```bash
npm install
cp .env.example .env.local
# 编辑 .env.local，填入密钥
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)（默认进入 `/chat`）。

详细环境变量与 YouTube 密钥说明见：

- [环境变量](./environment.md)
- [YouTube API 配置](./youtube-api.md)

## 怎么用聊天页

1. 在输入框描述需求，或粘贴 YouTube 链接  
2. 查看「我的理解」与（可选）展开的「本轮检索词」  
3. 在右侧 Discover 点开卡片试听  
4. 用 chips 或继续打字 refine（如「再暗一点」「换一批」）  
5. 「+ 新会话」清空当前对话  

### 示例说法

- `适合女声的慢热 R&B，鼓别太抢`
- `udg type beat，偏暗一点`
- `想要法老那种感觉的伴奏`
- `像刘聪，慢一点`
- 粘贴：`https://www.youtube.com/watch?v=...`

深链参考曲：`/chat?ref_url=https://www.youtube.com/watch?v=VIDEO_ID`

## 页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 找伴奏 | `/chat` | 主功能 |
| 关于 | `/about` | 产品与合规说明 |
| 地下精选 | 暂未开放 | 后续模块 |

## 合规提示

- 结果仅供**试听与发现**，商用授权以 YouTube / 原作者 / 发行方为准  
- 本产品不提供未授权下载或绕过平台限制  
- API 配额（YouTube、大模型）由部署者自行配置与承担  

## 需要帮助？

仓库 Issues 用于功能规划与缺陷；使用问题可在 Issue 中描述复现步骤与环境。
