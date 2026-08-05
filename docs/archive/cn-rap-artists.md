# 国内说唱歌手映射（检索桥）

> 目标用户前期：说唱歌手找 type beat。  
> 数据：`data/cn-rap-artists.json`  
> 代码：`src/lib/agent/artists.ts`

## 原则

1. **识别**用户中文/英文艺名（别名表）
2. **不把中文艺人名当 YouTube 主 query**（易出翻唱/官方向）
3. **转化**为 `styles` + 英文 `style_en` + 预写 `queries`（type beat 域）
4. 表只覆盖 **高频国内说唱**，长尾以后可 LLM 补

## 链路

```text
用户：「想要法老那种感觉」
  → match 法老
  → style += underground / boom bap / trap
  → artist_refs += { queries: ["chinese underground type beat dark", ...] }
  → planQueries 优先混入 artist queries
  → 理解文案：参考气质「法老」→ chinese underground / boom bap / ...
```

## 维护

- 加歌手：在 JSON `artists` 数组追加，填 `aliases` / `styles` / `queries`
- `queries` 必须是英文伴奏向，且含 type beat / instrumental 语义
- 改完跑：`npm run eval:intent`（含 E6/E7）

## 当前规模

约 30+ 名：法老、刘聪、马思唯、那吾克热、GAI、艾热、Jony J、Tizzy T、万妮达、VaVa、王齐铭、功夫胖、谢帝、Higher Brothers、杨和苏、布瑞吉、乃万、瘦子、热狗、顽童…  
