# Beat Hunter 设计系统

## 当前基准：Touri AI Travel

本地参考（用户提供）：

- `~/Downloads/touri_design_styleguide-v2.html`
- `~/Downloads/touri_design_clone.html`

Phase 1 UI **以这两份 HTML 为准**，不再用晚霞琥珀 / 冷海军蓝作主调。

---

## 色板

| Token | 值 | 用途 |
|-------|-----|------|
| App bg | `#050505` | 全站底色 |
| Aurora Orange | `#A94F28` | 左上 blob，blur 120px |
| Aurora Magenta | `#9E3166` | 中部 blob |
| Aurora Purple | `#3B1C63` | 右下 blob |
| Primary gradient | `#FF6B9E → #9B51E0` | 主按钮、pill active、发送钮、用户气泡 |
| Glass fill | `rgba(20,20,20,0.35–0.45)` | 面板 |
| Glass border | `rgba(255,255,255,0.08)` | 边框 |
| Surface soft | `rgba(255,255,255,0.03)` | 轻表面 / feature card |
| Input inner | `#121212` | 渐变描边输入壳内层 |

### 斜向高亮极光（产品图复刻）

不是圆 blob，而是 **宽×薄的色带**，旋转约 `-18°～-38°`：

| 层 | 色 | 角度 | 作用 |
|----|----|------|------|
| atmosphere | 暖橙 / 紫径向 | — | 大范围底气 |
| ribbon-1 + core | `#A94F28` 铜橙 + 更亮 core | −28° | 主高亮斜带 |
| ribbon-2 + core | 品红 / 粉 | −32° | 中段交织 |
| ribbon-3 | `#3B1C63` 深紫 | −22° | 右下锚点 |
| ribbon-4 / 5 | 次铜斜带 / 冷紫 | −38° / −18° | 层次 |
| vignette | 暗角 | — | 边缘收进黑底 |

实现：`layout.tsx` 结构 + `globals.css` `.aurora-ribbon`  
关键：`linear-gradient(90deg, transparent → color → transparent)` + 大 `blur` + 更薄、更亮的 core 层。

---

## 玻璃公式（Touri section）

```css
background: rgba(20, 20, 20, 0.35);
border: 1px solid rgba(255, 255, 255, 0.08);
backdrop-filter: blur(24px);
box-shadow:
  0 20px 40px rgba(0, 0, 0, 0.4),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

实现类：`.glass` / `.glass-strong` / `.glass-panel`（`src/app/globals.css`）

---

## 组件原语

| 原语 | 类名 | 说明 |
|------|------|------|
| 输入壳 | `.touri-input-shell` + `.touri-input-inner` | 粉紫渐变 2px 描边 + `#121212` 内层 |
| 发送钮 | `.touri-send` | 圆形 36px，粉紫渐变 |
| 用户气泡 | `.touri-user-bubble` | 粉紫渐变，白字 |
| Nav pill | `.touri-pills` / `.touri-pill-active` | active = 主渐变 |
| Hero 球 | `.touri-sphere` | `#ff9a9e → #fecfef → #a18cd1 → #4facfe` + float |
| 主渐变 | `.touri-grad` | 按钮 / CTA |

---

## 字体

- **UI**：Inter（latin）+ Noto Sans SC（中文）
- **等宽**：JetBrains Mono（query / mono 标签）
- 标题 letter-spacing 略紧（−0.03em）

---

## 次要参考（灵感，非当前实现）

| 源 | 学什么 | 当前是否采用 |
|----|--------|--------------|
| aurora-mood-dashboard | 双层渐变描边玻璃 | 早期实验；现以 Touri 简化玻璃为准 |
| auraglass | Liquid Glass 组件库 | 不整库接入 |
| CollectUI / Dribbble travel | 布局：rail + chat + discovery | 布局保留，色板用 Touri |

---

## 文件落点

- Tokens + aurora + glass + input shell：`src/app/globals.css`
- 背景 blobs：`src/app/layout.tsx`
- 主聊天壳：`src/app/chat/chat-client.tsx`
- Hero：`src/components/chat-hero.tsx`
- Rail logo 渐变：`src/components/app-rail.tsx`
- 结果卡：`src/components/beat-card.tsx`
