# Beat Hunter 设计系统

## 参考仓库怎么做的

### 1. [nodelabstudio/aurora-mood-dashboard](https://github.com/nodelabstudio/aurora-mood-dashboard)

**玻璃面板（`styles/glass.css`）核心公式：**

```css
background:
  linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08)) padding-box,
  linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05)) border-box;
border: 1px solid transparent;
backdrop-filter: blur(24px) saturate(160%);
box-shadow:
  0 24px 64px -16px rgba(0,0,0,0.5),
  inset 0 1px 0 rgba(255,255,255,0.06);
```

要点：

| 技巧 | 作用 |
|------|------|
| **双层 background + transparent border** | 做出 135° **渐变描边**（上亮下淡） |
| **blur(24px) + saturate(160%)** | 磨砂玻璃 + 略提饱和，透出背景色 |
| **inset 高光 + 大外阴影** | 浮起感 |
| **::before 顶部白雾** | 上沿更「液态」 |
| **文字在子层 z-index:1** | 不直接糊在 blur 上（可读性） |
| **场景底图 + grain + scrim** | 背景用图/渐变，前景玻璃 |

晚霞底色他们 dusk/clear 用：

`#ee9a6e → #c2748a → #693d70 → #2d2351`（橙 → 粉 → 紫 → 夜）

### 2. [auraoneai/auraglass](https://github.com/auraoneai/auraglass)（注意拼写是 **auraglass**）

- **Liquid Glass** 组件库（React/Next）
- 分层：Layer / Material / Backdrop sampler 等
- 适合整库接入；我们 Phase 1 **先抄 CSS 原语**，不整库依赖

### 3. 我们当前落地

- 玻璃：对齐 aurora-mood 的 **padding-box + border-box 渐变边 + blur/saturate**
- 背景：**晚霞暖极光**（红 / 粉 / 黄 / 橙），不用冷蓝主调
- 不装 auraglass 整包，避免体积与 API 耦合

---

## 晚霞色板（当前）

| Token | 值 | 用途 |
|-------|-----|------|
| `--ink` | `#1a1020` | 深紫夜底 |
| `--dusk-amber` | `#f0b27a` | 晚霞黄/琥珀 |
| `--dusk-coral` | `#ee9a6e` | 珊瑚橙 |
| `--dusk-rose` | `#e07a8a` / `#c2748a` | 粉 |
| `--dusk-mauve` | `#8b4d6b` | 暮紫 |
| `--dusk-night` | `#2d2351` | 夜紫 |
| 玻璃 | 白 8% 填充 + 渐变描边 | 面板/输入/卡片框 |

字体：Syne + Noto Sans SC + JetBrains Mono（不变）
