# Beat Hunter 设计系统（色板 · 字体 · 玻璃）

> 当前视觉方向：**柔和极光渐变 + 透明玻璃卡片**  
> 结构参考：AI Travel Dashboard（对话 + 发现区）  
> https://dribbble.com/shots/27052075-AI-Travel-Assistant-UI-Trip-Planning-Destination-Discovery

---

## 气质

**深夜极光 · 磨砂玻璃 · 柔光不刺眼**

- 背景：多层柔和径向极光（青 / 靛 / 紫 / 薄荷绿），慢漂移  
- 表面：半透明白 + `backdrop-filter: blur` + 内描边高光  
- 文字：冷白；主按钮：近白玻璃高亮，不用硬霓虹  

---

## 色板 Token

| Token | 值 | 用途 |
|-------|-----|------|
| `--ink` | `#070b14` | 夜空底 |
| `--glass` | `rgba(255,255,255,0.055)` | 轻玻璃 |
| `--glass-strong` | `rgba(255,255,255,0.09)` | 输入区等 |
| `--glass-border` | `rgba(255,255,255,0.14)` | 玻璃边 |
| `--aurora-*` | cyan / indigo / fuchsia / mint | 极光光斑 |
| `--cream` | `#f4f7ff` | 主字 |
| `--gold` / `--gold-soft` | 天蓝 / 浅紫 | 兼容旧名的柔和强调 |

### 工具类

| Class | 作用 |
|-------|------|
| `.glass` | 轻磨砂面板 |
| `.glass-strong` | 更不透明一点 |
| `.glass-panel` | 渐变玻璃 + 强 blur |
| `.gold-gradient-text` | 极光渐变字 |

代码：`src/app/globals.css`

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
