// Builds profile-stats.svg: profile views + followers with a 30-day trend line each.
// Run daily by .github/workflows/profile-stats.yml, which keeps the output on the `stats` branch.
//   node scripts/build-stats.mjs <out-dir>                 fetch today's numbers, update history, render
//   node scripts/build-stats.mjs <out-dir> --render-only   re-render from the existing history.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const USER = process.env.PROFILE_USER || process.env.GITHUB_REPOSITORY_OWNER || "Kant518";
const DAYS = 30;

const outDir = process.argv[2] || ".";
const renderOnly = process.argv.includes("--render-only");
const historyFile = path.join(outDir, "history.json");

const history = existsSync(historyFile)
  ? JSON.parse(readFileSync(historyFile, "utf8"))
  : { selfHits: 0, days: [] };

async function fetchToday() {
  const headers = { "User-Agent": `${USER}-profile-stats` };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const user = await (await fetch(`https://api.github.com/users/${USER}`, { headers })).json();
  if (typeof user.followers !== "number") throw new Error(`GitHub API: ${JSON.stringify(user)}`);

  // The view counter only exposes its number as a badge, and every request counts as a view,
  // so remember how many times this script asked and subtract those.
  const badge = await (await fetch(`https://komarev.com/ghpvc/?username=${USER}`)).text();
  const counts = [...badge.matchAll(/>([\d,]+)</g)].map((m) => Number(m[1].replace(/,/g, "")));
  if (!counts.length) throw new Error("Could not read the profile view counter");
  history.selfHits += 1;

  const date = new Date().toISOString().slice(0, 10);
  const today = { date, views: Math.max(0, counts.at(-1) - history.selfHits), followers: user.followers };
  history.days = [...history.days.filter((d) => d.date !== date), today].slice(-DAYS);
}

// ── rendering ──────────────────────────────────────────────────────────────

const W = 1000;
const H = 200;
const C = {
  surface: "#0B1220",
  border: "#1E293B",
  grid: "#1E293B",
  ink: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#64748B",
  series: "#0E9FBF", // validated against the dark surface (dataviz validator)
};
const FONT = `'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif`;

const fmt = (n) => n.toLocaleString("en-US");
const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function sparkline(values, x, y, w, h) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const flat = max === min;
  const px = (i) => x + (values.length === 1 ? w : (i / (values.length - 1)) * w);
  const py = (v) => (flat ? y + h * 0.6 : y + h - ((v - min) / (max - min)) * h);
  const pts = values.map((v, i) => [px(i), py(v)]);
  if (pts.length === 1) pts.unshift([x, pts[0][1]]);

  const line = pts.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)} ${b.toFixed(1)}`).join(" ");
  const area = `${line} L${(x + w).toFixed(1)} ${y + h} L${x} ${y + h} Z`;
  const [ex, ey] = pts.at(-1);
  return `
    <line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="${C.grid}" stroke-width="1"/>
    <path class="area" d="${area}" fill="url(#fade)"/>
    ${values.length === 1
      ? `<path class="pending" d="${line}" fill="none" stroke="${C.series}" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 6"/>`
      : `<path class="line" d="${line}" pathLength="1" fill="none" stroke="${C.series}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`}
    <g class="dot">
      <circle class="pulse" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="4" fill="${C.series}"/>
      <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="4" fill="${C.series}" stroke="${C.surface}" stroke-width="2"/>
    </g>`;
}

// Animated number: SVG text can't change through CSS, so stack one <text> per
// count-up step and show each in turn (keyframes f0..fN in render()).
const LOOP = 8;          // seconds; the number and the trend line replay on this cycle
const COUNT_TIME = 1.6;  // count-up duration, matches the line drawing in
const COUNT_STEPS = 24;
const easeOut = (p) => 1 - (1 - p) ** 3;

function counter(x, y, value) {
  return Array.from({ length: COUNT_STEPS + 1 }, (_, k) =>
    `<text x="${x}" y="${y}" class="value n${k === COUNT_STEPS ? " final" : ""}" style="animation-name:f${k}">${fmt(Math.round(value * easeOut(k / COUNT_STEPS)))}</text>`,
  ).join("\n    ");
}

function counterKeyframes() {
  const pct = (t) => `${((t / LOOP) * 100).toFixed(2)}%`;
  return Array.from({ length: COUNT_STEPS + 1 }, (_, k) => {
    const on = (COUNT_TIME * k) / COUNT_STEPS;
    const off = k < COUNT_STEPS ? (COUNT_TIME * (k + 1)) / COUNT_STEPS : null;
    return `@keyframes f${k} { 0% { opacity: ${k ? 0 : 1} } ${k ? `${pct(on)} { opacity: 1 }` : ""} ${off ? `${pct(off)} { opacity: 0 }` : ""} }`;
  }).join("\n    ");
}

function tile(ox, label, key) {
  const days = history.days;
  const values = days.map((d) => d[key]);
  const now = values.at(-1) ?? 0;
  const delta = now - (values[0] ?? 0);
  const note = days.length < 2
    ? `Tracking daily since ${fmtDate(days[0]?.date ?? new Date().toISOString().slice(0, 10))}`
    : `${delta >= 0 ? "+" : "−"}${fmt(Math.abs(delta))} since ${fmtDate(days[0].date)}`;

  const sx = ox + 260;
  const sw = 200;
  return `
  <g class="tile">
    <text x="${ox + 40}" y="58" class="label">${label}</text>
    ${counter(ox + 40, 122, now)}
    <text x="${ox + 40}" y="154" class="note">${note}</text>
    ${sparkline(values.length ? values : [0], sx, 56, sw, 84)}
    <text x="${sx}" y="166" class="axis">${days.length ? fmtDate(days[0].date) : ""}</text>
    <text x="${sx + sw}" y="166" class="axis" text-anchor="end">Today</text>
  </g>`;
}

function render() {
  const last = history.days.at(-1) ?? { views: 0, followers: 0 };
  const summary = `Profile views: ${fmt(last.views)}. Followers: ${fmt(last.followers)}.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${summary}">
  <title>${summary}</title>
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.series}" stop-opacity=".28"/>
      <stop offset="1" stop-color="${C.series}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <style>
    .label { font: 600 13px ${FONT}; letter-spacing: 1.6px; fill: ${C.muted}; }
    .value { font: 700 52px ${FONT}; fill: ${C.ink}; }
    .note  { font: 400 14px ${FONT}; fill: ${C.muted}; }
    .axis  { font: 400 12px ${FONT}; fill: ${C.faint}; }

    .tile  { animation: rise .7s cubic-bezier(.2,.7,.2,1) both; }
    .tile + .tile { animation-delay: .15s; }
    @keyframes rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

    /* number counts up from 0, holds, then replays every ${LOOP}s */
    .n { opacity: 0; animation-duration: ${LOOP}s; animation-timing-function: step-end; animation-iteration-count: infinite; }
    ${counterKeyframes()}

    /* trend line draws in alongside the count, holds, fades, replays */
    .line    { stroke-dasharray: 1; animation: draw ${LOOP}s infinite; }
    .area    { animation: area ${LOOP}s ease infinite; }
    .dot     { animation: dot ${LOOP}s ease infinite; }
    .pulse   { transform-box: fill-box; transform-origin: center; animation: pulse 2s ease-out infinite; }
    .pending { animation: flow 1.2s linear infinite; }
    @keyframes draw  { 0% { stroke-dashoffset: 1; opacity: 1; animation-timing-function: cubic-bezier(.4,0,.2,1) }
                       ${((COUNT_TIME / LOOP) * 100).toFixed(1)}% { stroke-dashoffset: 0; opacity: 1 }
                       94% { opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
    @keyframes area  { 0%, 10% { opacity: 0 } 28%, 94% { opacity: 1 } 100% { opacity: 0 } }
    @keyframes dot   { 0%, 18% { opacity: 0 } 22%, 94% { opacity: 1 } 100% { opacity: 0 } }
    @keyframes pulse { from { opacity: .6; transform: scale(1) } to { opacity: 0; transform: scale(3.5) } }
    @keyframes flow  { to { stroke-dashoffset: -10 } }

    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
      .final { opacity: 1; } .pulse { display: none; }
    }
  </style>

  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="${C.surface}" stroke="${C.border}"/>
  <line x1="${W / 2}" y1="36" x2="${W / 2}" y2="${H - 36}" stroke="${C.border}"/>
  ${tile(0, "PROFILE VIEWS", "views")}
  ${tile(W / 2, "FOLLOWERS", "followers")}
</svg>
`;
}

if (!renderOnly) await fetchToday();
mkdirSync(outDir, { recursive: true });
writeFileSync(historyFile, JSON.stringify(history, null, 2) + "\n");
writeFileSync(path.join(outDir, "profile-stats.svg"), render());
console.log(`profile-stats.svg written (${history.days.length} day(s) of history)`);
