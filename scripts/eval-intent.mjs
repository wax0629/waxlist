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
