// Builds assets/about.svg: the animated "focus areas" table in the About Me section.
// Edit the rows below, then run:  node scripts/build-about.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

// 24×24 line icons
const ICONS = {
  spark: "M12 3l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8z",
  cloud: "M7 18h10a4 4 0 0 0 .4-7.98A6 6 0 0 0 6 9.3 4.4 4.4 0 0 0 7 18z",
  layers: "M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5",
  loop: "M8 8.5C6 8.5 4.5 10 4.5 12S6 15.5 8 15.5c3 0 5-7 8-7 2 0 3.5 1.5 3.5 3.5S18 15.5 16 15.5c-3 0-5-7-8-7z",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
};

const rows = [
  { icon: "spark", title: "AI Engineering", tags: ["LLM Apps", "RAG Pipelines", "AI Agents", "Model Integration"] },
  { icon: "cloud", title: "Cloud Solutions", tags: ["AWS", "Azure", "GCP", "Scalable & Secure"] },
  { icon: "layers", title: "Full Stack", tags: ["Clean APIs", "Modern Frontends", "Data Layers"] },
  { icon: "loop", title: "DevOps", tags: ["Containers", "CI/CD", "Infrastructure as Code"] },
  { icon: "bolt", title: "Mindset", tags: ["Automate", "Simplify", "Ship"] },
];

const SENTENCE = "I build AI-powered products and the cloud infrastructure that runs them, from idea to production.";

const W = 1000;
const ROW_H = 60;
const TOP = 100; // rows start below the typed sentence
const H = TOP + rows.length * ROW_H + 32;

const C = {
  surface: "#0B1220",
  border: "#1E293B",
  grid: "#1E293B",
  ink: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#475569",
  accent: "#22D3EE",
};
const FONT = `'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif`;
const MONO = `'Cascadia Code', 'SF Mono', Consolas, monospace`;

const INTRO = 0.25;   // delay between rows appearing
const STEP = 1.6;     // how long the highlight stays on each row
const CYCLE = STEP * rows.length;
const HL_START = INTRO * rows.length + 0.8;
const on = ((STEP / CYCLE) * 100).toFixed(1);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// Seeded random so rebuilding gives the same file
let seed = 518;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

// ── typed sentence: types in, holds, erases, repeats ──
// Monospace + a fixed width per character keeps the cursor exactly on the text in every font.
const TX = 72;            // text start (after the prompt)
const TY = 60;
const CW = 9;             // px per character (15px monospace)
const TYPE = 0.045;       // s per character typed
const ERASE = 0.012;      // s per character erased
const T0 = 0.5;           // first character
const HOLD = 3.5;
const N = SENTENCE.length;
const ERASE_START = T0 + N * TYPE + HOLD;
const TYPE_LOOP = ERASE_START + N * ERASE + 0.8;
const tpct = (t) => `${((t / TYPE_LOOP) * 100).toFixed(2)}%`;

const typedChars = [...SENTENCE].map((ch, i) =>
  `<tspan style="animation-name:k${i}">${ch === " " ? "&#160;" : esc(ch)}</tspan>`).join("");
const typeKeyframes = [...SENTENCE].map((_, i) => {
  const shown = T0 + (i + 1) * TYPE;
  const hidden = ERASE_START + (N - 1 - i) * ERASE;
  return `@keyframes k${i} { 0% { fill-opacity: 0 } ${tpct(shown)} { fill-opacity: 1 } ${tpct(hidden)} { fill-opacity: 0 } }`;
}).join("\n    ");
const cursorKeyframes = `@keyframes caret {
      0%, ${tpct(T0)} { transform: translateX(0); animation-timing-function: steps(${N}, end) }
      ${tpct(T0 + N * TYPE)}, ${tpct(ERASE_START)} { transform: translateX(${N * CW}px); animation-timing-function: steps(${N}, end) }
      ${tpct(ERASE_START + N * ERASE)}, 100% { transform: translateX(0) }
    }`;

// Rough pill width for a 14px system font; pills are decorative, a few px off is fine
const pillW = (t) => Math.round(t.length * 7.6 + 28);

const rowEls = rows.map((r, i) => {
  const y = TOP + i * ROW_H;
  const cy = y + ROW_H / 2;
  let px = 430;
  const pills = r.tags.map((t, j) => {
    const w = pillW(t);
    // each pill pulses dark → light on its own random rhythm
    const dur = 3.5 + rand() * 4;
    const pulse = `--pd:${dur.toFixed(2)}s; --pdl:-${(rand() * dur).toFixed(2)}s`;
    const el = `<g class="pill" style="animation-delay:${(INTRO * i + 0.35 + j * 0.08).toFixed(2)}s; ${pulse}">
        <rect class="pr" x="${px}" y="${cy - 15}" width="${w}" height="30" rx="15"/>
        <text x="${px + w / 2}" y="${cy + 5}" text-anchor="middle" class="tag">${esc(t)}</text>
      </g>`;
    px += w + 10;
    return el;
  }).join("\n      ");

  return `<g class="row" style="animation-delay:${(INTRO * i).toFixed(2)}s; --hl:${(HL_START + STEP * i).toFixed(2)}s">
      <rect class="hl" x="1" y="${y}" width="${W - 2}" height="${ROW_H}" fill="url(#hl)"/>
      <rect class="bar" x="1" y="${y + 12}" width="3" height="${ROW_H - 24}" rx="1.5" fill="${C.accent}"/>
      ${i ? `<line x1="40" y1="${y}" x2="${W - 40}" y2="${y}" stroke="${C.grid}"/>` : ""}
      <text x="40" y="${cy + 5}" class="idx">0${i + 1}</text>
      <rect x="84" y="${cy - 18}" width="36" height="36" rx="10" fill="#0F1A2E" stroke="${C.border}"/>
      <path class="icon" d="${ICONS[r.icon]}" transform="translate(${90} ${cy - 12})" fill="none" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
      <text x="140" y="${cy + 7}" class="title">${esc(r.title)}</text>
      ${pills}
    </g>`;
}).join("\n    ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(`Focus areas: ${rows.map((r) => `${r.title} (${r.tags.join(", ")})`).join("; ")}`)}">
  <title>Focus areas</title>
  <defs>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.2" fill="#1A2538"/>
    </pattern>
    <radialGradient id="glow" cx="0.85" cy="0" r="0.7">
      <stop offset="0" stop-color="#0E7490" stop-opacity=".22"/>
      <stop offset="1" stop-color="#0E7490" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hl" x1="0" x2="1">
      <stop offset="0" stop-color="${C.accent}" stop-opacity=".10"/>
      <stop offset=".6" stop-color="${C.accent}" stop-opacity=".02"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
  </defs>
  <style>
    .idx   { font: 500 13px ${MONO}; fill: ${C.faint}; animation: idx ${CYCLE}s var(--hl) infinite; }
    .title { font: 600 20px ${FONT}; fill: #CBD5E1; animation: title ${CYCLE}s var(--hl) infinite; }
    .tag   { font: 500 14px ${FONT}; fill: ${C.muted}; animation: tagText var(--pd) ease-in-out var(--pdl) infinite; }
    .icon  { stroke: ${C.muted}; animation: icon ${CYCLE}s var(--hl) infinite; }
    .pr    { fill: ${C.surface}; stroke: ${C.border}; animation: tagBox var(--pd) ease-in-out var(--pdl) infinite; }
    @keyframes tagBox  { 0%, 55%, 100% { fill: ${C.surface}; stroke: ${C.border} } 70%, 80% { fill: #0F3446; stroke: #0E9FBF } }
    @keyframes tagText { 0%, 55%, 100% { fill: ${C.muted} } 70%, 80% { fill: #E0F2FE } }

    /* typed sentence */
    .typed  { font: 400 15px ${MONO}; fill: #CBD5E1; }
    .typed tspan { fill-opacity: 0; animation-duration: ${TYPE_LOOP.toFixed(2)}s; animation-timing-function: step-end; animation-iteration-count: infinite; }
    .prompt { font: 600 15px ${MONO}; fill: ${C.accent}; }
    .caret  { animation: caret ${TYPE_LOOP.toFixed(2)}s infinite; }
    .caret rect { animation: blink 1s step-end infinite; }
    @keyframes blink { 50% { opacity: 0 } }
    ${typeKeyframes}
    ${cursorKeyframes}

    /* intro: rows slide in one by one, pills follow */
    .row  { animation: rise .6s cubic-bezier(.2,.7,.2,1) both; }
    .pill { animation: pop .45s cubic-bezier(.2,.7,.2,1) both; }
    @keyframes rise { from { opacity: 0; transform: translateX(-12px) } to { opacity: 1; transform: none } }
    @keyframes pop  { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }

    /* loop: a highlight moves down the rows */
    .hl  { opacity: 0; animation: hl ${CYCLE}s var(--hl) infinite; }
    .bar { opacity: 0; transform-box: fill-box; transform-origin: center; animation: bar ${CYCLE}s var(--hl) infinite; }
    @keyframes hl    { 0% { opacity: 0 } 4%, ${on}% { opacity: 1 } ${(+on + 4).toFixed(1)}%, 100% { opacity: 0 } }
    @keyframes bar   { 0% { opacity: 0; transform: scaleY(0) } 5%, ${on}% { opacity: 1; transform: scaleY(1) } ${(+on + 4).toFixed(1)}%, 100% { opacity: 0; transform: scaleY(0) } }
    @keyframes idx   { 0%, ${(+on + 4).toFixed(1)}%, 100% { fill: ${C.faint} } 4%, ${on}% { fill: ${C.accent} } }
    @keyframes title { 0%, ${(+on + 4).toFixed(1)}%, 100% { fill: #CBD5E1 } 4%, ${on}% { fill: ${C.ink} } }
    @keyframes icon  { 0%, ${(+on + 4).toFixed(1)}%, 100% { stroke: ${C.muted} } 4%, ${on}% { stroke: ${C.accent} } }

    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
      .typed tspan { fill-opacity: 1; } .caret { display: none; }
    }
  </style>

  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${C.surface}"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <text x="40" y="${TY}" class="prompt">&gt;_</text>
    <text x="${TX}" y="${TY}" class="typed" textLength="${N * CW}" lengthAdjust="spacing">${typedChars}</text>
    <g class="caret"><rect x="${TX + 1}" y="${TY - 14}" width="2" height="18" fill="${C.accent}"/></g>
    <line x1="40" y1="${TOP}" x2="${W - 40}" y2="${TOP}" stroke="${C.grid}"/>
    ${rowEls}
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${C.border}"/>
</svg>
`;

writeFileSync(root + "assets/about.svg", svg);
console.log(`assets/about.svg written (${(svg.length / 1024).toFixed(0)} KB)`);
