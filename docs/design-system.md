# Beat Hunter 设计系统（色板 · 字体）

> Agent 页主参考：  
> https://dribbble.com/shots/27052075-AI-Travel-Assistant-UI-Trip-Planning-Destination-Discovery  
> （Dribbble 不提供色板导出；本文件按该作 **未来感旅行 AI Dashboard** 常见配色抄写，可再按滴管微调）

---

## 色板（抄 Travel AI Dashboard 方向）

气质：**深海军底 + 电光蓝强调 + 冷白字**（不是暖金、也不是通用紫 AI）。

| Token | Hex / 值 | 用途 |
|-------|----------|------|
| `--ink` | `#0A0F1E` | 页面底 |
| `--ink-2` | `#0D1426` | 次级底 |
| `--ink-elevated` | `#151D33` | 卡片 / 面板 |
| `--cream` | `#F2F6FF` | 主文字（冷白） |
| `--cream-soft` | `#D7E0F2` | 次强调字 |
| `--cream-muted` | `#8B9BB8` | 次级说明 |
| `--cream-faint` | `#5A6A88` | 更弱说明 |
| `--line` | `rgba(120,150,220,0.12)` | 描边 |
| `--line-strong` | `rgba(120,150,220,0.22)` | 强描边 |
| `--gold` | `#3B82F6` | **主强调蓝**（兼容旧 token 名） |
| `--gold-soft` | `#60A5FA` | 浅蓝高光 / 渐变上沿 |
| `--gold-dim` | `rgba(59,130,246,0.16)` | 选中底、弱高亮 |
| `--cyan` | `#22D3EE` | 辅强调（点缀、状态点） |
| `--ember` | `#38BDF8` | 次强调 |
| `--ok` | `#34D399` | 成功 |
| `--warn` | `#FBBF24` | 降级 |
| `--danger` | `#FB7185` | 错误 |

背景光晕：左上/右上 **蓝青径向光**，不用暖金/品红主光。

> 若你从 Dribbble 截图滴管得到精确 hex，发我 4～6 个主色，可再对齐一版。

---

## 字体（保持）

| 用途 | 字体 |
|------|------|
| 品牌 / 大标题 | **Syne** → `--font-display` |
| 正文 / 中文 | **Noto Sans SC** → `--font-sans` |
| 检索词 / 数据 | **JetBrains Mono** → `--font-mono` |

---

## 与参考的映射

| Travel UI | 我们 |
|-----------|------|
| 深色 dashboard 底 | `--ink` / `--ink-elevated` |
| 主 CTA / 选中 | `--gold` 蓝 |
| 点缀 / 发光 | `--cyan` / `--gold-soft` |
| 主字 | `--cream` 冷白 |

代码入口：`src/app/globals.css` 的 `:root`。
