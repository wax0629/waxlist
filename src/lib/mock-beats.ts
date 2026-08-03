import type { BeatCandidate } from "./types";

/** UI 联调用假数据；接上 YouTube 后由 API 返回真实 candidates。 */
export const MOCK_BEATS: BeatCandidate[] = [
  {
    id: "mock:1",
    title: "Late Night R&B Type Beat — Soft Drums",
    source: "mock",
    url: "https://www.youtube.com/results?search_query=rnb+type+beat+soft+drums",
    reason: "慢热氛围，鼓点靠后，适合女声试唱铺底。",
    license_hint: "演示数据；商用请以源站授权为准",
    tags: ["r&b", "slow"],
  },
  {
    id: "mock:2",
    title: "Melodic Chill Beat — Female Vocal Friendly",
    source: "mock",
    url: "https://www.youtube.com/results?search_query=chill+melodic+type+beat",
    reason: "旋律靠前、空间感强，方便跟唱找感觉。",
    license_hint: "演示数据；商用请以源站授权为准",
    tags: ["melodic", "chill"],
  },
  {
    id: "mock:3",
    title: "Smooth Trap Soul Instrumental",
    source: "mock",
    url: "https://www.youtube.com/results?search_query=trap+soul+instrumental",
    reason: "节奏略推但不炸，适合边听边填词。",
    license_hint: "演示数据；商用请以源站授权为准",
    tags: ["trap soul"],
  },
];
