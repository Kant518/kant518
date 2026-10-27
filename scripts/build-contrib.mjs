// Builds contributions.svg: the last year of GitHub contributions as a cyan calendar.
// Run daily by .github/workflows/profile-stats.yml (output goes to the `stats` branch).
//   node scripts/build-contrib.mjs <out-dir>                 fetch the calendar (needs GITHUB_TOKEN), render
//   node scripts/build-contrib.mjs <out-dir> --render-only   re-render from the existing contributions.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const USER = process.env.PROFILE_USER || process.env.GITHUB_REPOSITORY_OWNER || "Kant518";
const outDir = process.argv[2] || ".";
const renderOnly = process.argv.includes("--render-only");
const dataFile = path.join(outDir, "contributions.json");

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

async function fetchCalendar() {
  const query = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
    totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json", "User-Agent": `${USER}-profile` },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  const json = await res.json();
  const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error(`GitHub GraphQL: ${JSON.stringify(json.errors ?? json)}`);
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 }))),
  };
}

// ── rendering ──────────────────────────────────────────────────────────────

const C = {
  surface: "#0B1220",
  border: "#1E293B",
  ink: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#64748B",
  accent: "#22D3EE",
  // sequential cyan: empty → most active, dark → bright on the dark surface
  levels: ["#111C2E", "#0B3A4A", "#0E6378", "#0E9FBF", "#67E8F9"],
};
const FONT = `'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif`;

const W = 1000;
const CELL = 13;
const STEP = 16;
const GX = 76;   // grid left (room for weekday labels)
const GY = 112;  // grid top (room for header + month labels)
const H = GY + 7 * STEP + 58;

const LOOP = 10;        // seconds per reveal cycle
const SWEEP = 2.6;      // time for the scan to cross the grid
const fmt = (n) => n.toLocaleString("en-US");
const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

let seed = 518;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

function summary(weeks) {
  const days = weeks.flat();
  const today = new Date().toISOString().slice(0, 10);
  const past = days.filter((d) => d.date <= today);
  let i = past.length - 1;
  if (i >= 0 && past[i].count === 0) i--; // today may not have activity yet
  let streak = 0;
  while (i >= 0 && past[i].count > 0) { streak++; i--; }
  const best = past.reduce((a, d) => (d.count > a.count ? d : a), { count: 0, date: null });
  return { streak, best };
}

function render({ total, weeks }) {
  const { streak, best } = summary(weeks);
  const gridW = weeks.length * STEP - (STEP - CELL);
  const sweepPct = ((SWEEP / LOOP) * 100).toFixed(1);

  // month labels where a new month starts in a week's first day
  let lastMonth = null;
  let lastLabel = -9;
  const months = weeks.map((w, i) => {
    const m = new Date(`${w[0].date}T00:00:00Z`).getUTCMonth();
    if (m === lastMonth) return "";
    lastMonth = m;
    if (i - lastLabel < 3 || i > weeks.length - 3) return "";
    lastLabel = i;
    return `<text x="${GX + i * STEP}" y="${GY - 10}" class="axis">${new Date(Date.UTC(2000, m, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>`;
  }).join("");

  const cols = weeks.map((w, i) => {
    const delay = ((SWEEP * i) / weeks.length).toFixed(2);
    const cells = w.map((d) => {
      const row = new Date(`${d.date}T00:00:00Z`).getUTCDay();
      const tw = d.level >= 2 && rand() < 0.35
        ? ` class="tw" style="--td:${(2.5 + rand() * 3).toFixed(2)}s; --tdl:-${(rand() * 5).toFixed(2)}s"`
        : "";
      return `<rect${tw} x="${GX + i * STEP}" y="${GY + row * STEP}" width="${CELL}" height="${CELL}" rx="3" fill="${C.levels[d.level]}"><title>${d.count} on ${fmtDate(d.date)}</title></rect>`;
    }).join("");
    return `<g class="col" style="animation-delay:${delay}s">${cells}</g>`;
  }).join("\n    ");

  const stat = (x, value, label) =>
    `<text x="${x}" y="58" text-anchor="end" class="num">${value}</text><text x="${x}" y="78" text-anchor="end" class="small">${label}</text>`;

  const legendX = GX + gridW - 5 * STEP - 34;
  const aria = `${fmt(total)} contributions in the last year. Current streak ${streak} days.${best.date ? ` Best day ${best.count} on ${fmtDate(best.date)}.` : ""}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${aria}">
  <title>${aria}</title>
  <defs>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="#16213A"/></pattern>
    <linearGradient id="scan" x1="0" x2="1">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0"/>
      <stop offset=".85" stop-color="${C.accent}" stop-opacity=".16"/>
      <stop offset="1" stop-color="#A5F3FC" stop-opacity=".9"/>
    </linearGradient>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
  </defs>
  <style>
    .label { font: 600 13px ${FONT}; letter-spacing: 1.6px; fill: ${C.muted}; }
    .num   { font: 700 22px ${FONT}; fill: ${C.ink}; }
    .small { font: 400 12px ${FONT}; fill: ${C.muted}; }
    .axis  { font: 400 11px ${FONT}; fill: ${C.faint}; }

    /* each week lights up as the scan passes, holds, dims, and the loop repeats */
    .col  { animation: col ${LOOP}s ease-out infinite backwards; }
    @keyframes col { 0% { opacity: .12 } 4% { opacity: 1 } 88% { opacity: 1 } 96%, 100% { opacity: .12 } }
    .scan { animation: scan ${LOOP}s linear infinite; }
    @keyframes scan { 0% { transform: translateX(0); opacity: 1 } ${sweepPct}% { transform: translateX(${gridW}px); opacity: 1 } ${(+sweepPct + 3).toFixed(1)}%, 100% { transform: translateX(${gridW}px); opacity: 0 } }
    /* busy days twinkle */
    .tw   { animation: tw var(--td) ease-in-out var(--tdl) infinite; }
    @keyframes tw { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }

    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } .scan { display: none; } }
  </style>

  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${C.surface}"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${C.border}"/>

  <text x="40" y="52" class="label">CONTRIBUTIONS</text>
  <text x="40" y="76" class="small">Last 12 months</text>
  ${stat(W - 300, fmt(total), "Total")}
  ${stat(W - 170, `${streak} ${streak === 1 ? "day" : "days"}`, "Current streak")}
  ${stat(W - 40, fmt(best.count), best.date ? `Best day · ${fmtDate(best.date)}` : "Best day")}

  ${months}
  <text x="40" y="${GY + 1 * STEP + 10}" class="axis">Mon</text>
  <text x="40" y="${GY + 3 * STEP + 10}" class="axis">Wed</text>
  <text x="40" y="${GY + 5 * STEP + 10}" class="axis">Fri</text>

  <g>
    ${cols}
  </g>
  <rect class="scan" x="${GX - 60}" y="${GY - 4}" width="60" height="${7 * STEP + 4}" fill="url(#scan)" rx="2"/>

  <text x="${legendX - 8}" y="${H - 26}" text-anchor="end" class="axis">Less</text>
  ${C.levels.map((c, i) => `<rect x="${legendX + i * STEP}" y="${H - 36}" width="${CELL}" height="${CELL}" rx="3" fill="${c}"/>`).join("")}
  <text x="${legendX + 5 * STEP + 2}" y="${H - 26}" class="axis">More</text>
</svg>
`;
}

const data = renderOnly ? JSON.parse(readFileSync(dataFile, "utf8")) : await fetchCalendar();
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(dataFile, JSON.stringify(data) + "\n");
writeFileSync(path.join(outDir, "contributions.svg"), render(data));
console.log(`contributions.svg written (${data.total} contributions, ${data.weeks.length} weeks)`);
