/**
 * Offline intent + query plan checks (no YouTube).
 * Run: node scripts/eval-intent.mjs
 * Requires: npx tsx (invoked via npm run eval:intent)
 */
import { createRequire } from "module";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const runner = `
import { mergeIntent } from './src/lib/agent/intent.ts';
import { planQueries } from './src/lib/agent/plan-queries.ts';
import {
  hardConstraintTokens,
  injectHardConstraints,
  shouldUseLlmQueryPlan,
} from './src/lib/agent/plan-queries-llm.ts';

const cases = [
  {
    id: 'E1',
    input: '适合女声的慢热 R&B，鼓不要太抢',
    expectStyle: 'r&b',
    queryAny: ['rnb', 'type beat'],
    forbidAllRnbDefault: false,
  },
  {
    id: 'E2',
    input: 'udg',
    expectStyle: 'underground',
    queryAny: ['udg', 'underground'],
    forbidQuery: ['rnb'],
  },
  {
    id: 'E3',
    input: '偏暗 trap soul',
    expectStyle: 'trap soul',
    queryAny: ['trap', 'type beat'],
  },
  {
    id: 'E5',
    input: 'drill type beat',
    expectStyle: 'drill',
    queryAny: ['drill'],
  },
  {
    id: 'E6',
    input: '想要法老那种感觉的伴奏',
    expectArtist: '法老',
    expectStyleAny: ['underground', 'boom bap', 'trap'],
    queryAny: ['type beat'],
    forbidQuery: ['法老'],
  },
  {
    id: 'E7',
    input: '像刘聪 慢一点',
    expectArtist: '刘聪',
    expectStyleAny: ['trap'],
    queryAny: ['trap', 'type beat'],
  },
];

let failed = 0;
for (const c of cases) {
  const intent = mergeIntent({}, c.input);
  const qs = planQueries(intent).map((q) => q.toLowerCase());
  const styles = intent.style || [];
  const okStyle = c.expectStyle
    ? styles.includes(c.expectStyle)
    : c.expectStyleAny
      ? c.expectStyleAny.some((s) => styles.includes(s))
      : true;
  const okArtist = c.expectArtist
    ? (intent.artist_refs || []).some(
        (a) => a.name_zh === c.expectArtist || a.name_en === c.expectArtist,
      )
    : true;
  const okQuery = (c.queryAny || []).every((tok) =>
    qs.some((q) => q.includes(tok)),
  );
  const bad =
    c.forbidQuery &&
    c.forbidQuery.some((tok) => qs.some((q) => q.includes(tok)));
  // E2: no query should be pure rnb spam — at least one non-rnb core
  const e2Bad =
    c.id === 'E2' && qs.every((q) => q.includes('rnb') && !q.includes('underground') && !q.includes('udg'));

  const pass = okStyle && okArtist && okQuery && !bad && !e2Bad;
  if (!pass) failed++;
  console.log(
    (pass ? 'PASS' : 'FAIL'),
    c.id,
    'styles=',
    styles,
    'artists=',
    (intent.artist_refs || []).map((a) => a.name_zh),
    'queries=',
    qs,
  );
}

// E4 refine
const prev = mergeIntent({}, '适合女声的慢热 R&B，鼓不要太抢');
const refined = mergeIntent(prev, '再快一点');
const e4 =
  refined.style?.includes('r&b') && refined.tempo === 'fast';
console.log(e4 ? 'PASS' : 'FAIL', 'E4 refine', refined.style, refined.tempo);
if (!e4) failed++;

// E8: open Chinese vibe would want LLM path when key exists — without key, false
const vibe = mergeIntent({}, '想要凌晨在天桥上那种孤独感的伴奏');
const e8want = shouldUseLlmQueryPlan(vibe) === false || shouldUseLlmQueryPlan(vibe) === true;
// structure: Chinese text should be candidate for LLM (true if key, false if no key)
const e8 =
  /[\u4e00-\u9fff]/.test(vibe.free_text || '') &&
  (process.env.OPENAI_API_KEY || process.env.XAI_API_KEY
    ? shouldUseLlmQueryPlan(vibe) === true
    : shouldUseLlmQueryPlan(vibe) === false);
console.log(e8 ? 'PASS' : 'FAIL', 'E8 shouldUseLlmQueryPlan', shouldUseLlmQueryPlan(vibe));
if (!e8) failed++;

// E9 hard constraints injection
const hardIntent = mergeIntent({}, '适合女声的慢热 R&B，鼓不要太抢');
const injected = injectHardConstraints('melodic type beat', hardIntent, {
  aggressive: true,
});
const e9 =
  injected.includes('type beat') &&
  (injected.includes('female') || injected.includes('slow') || injected.includes('soft')) &&
  hardConstraintTokens(hardIntent).length > 0;
console.log(e9 ? 'PASS' : 'FAIL', 'E9 injectHardConstraints', injected);
if (!e9) failed++;

console.log(failed ? \`FAILED \${failed}\` : 'ALL PASS');
process.exit(failed ? 1 : 0);

if (!e4) failed++;

process.exit(failed ? 1 : 0);
`;

const r = spawnSync(
  "npx",
  ["--yes", "tsx", "-e", runner],
  { cwd: root, encoding: "utf8", shell: process.platform === "win32" },
);
process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");
process.exit(r.status ?? 1);
