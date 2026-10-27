// Builds assets/stack.svg: the animated Tech Stack panels.
// Logos come from Simple Icons (pinned version) and are embedded as paths, so the
// build needs internet; the generated SVG does not. Edit the panels below, then run:
//   node scripts/build-stack.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const ICON_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons";

// [display name, simple-icons slug or null, fallback abbreviation]
const panels = [
  {
    label: "01 / INTELLIGENCE", title: "AI & ML", sub: "LLMs • Agents • Machine Learning",
    icon: "neural", status: ["MODEL SERVING", "INFERENCE ONLINE"],
    items: [
      ["Python", "python"], ["PyTorch", "pytorch"], ["TensorFlow", "tensorflow"], ["scikit-learn", "scikitlearn"], ["OpenCV", "opencv"],
      ["OpenAI", "openai"], ["Anthropic", "anthropic"], ["LangChain", "langchain"], ["Hugging Face", "huggingface"], ["Ollama", "ollama"],
    ],
  },
  {
    label: "02 / PLATFORM", title: "CLOUD & DEVOPS", sub: "Scale • Containers • Automation",
    icon: "cloud", status: ["DEPLOYMENT", "CLUSTERS OPERATIONAL"],
    items: [
      ["AWS", "amazonwebservices"], ["Azure", null, "AZ"], ["GCP", "googlecloud"], ["Cloudflare", "cloudflare"], ["Docker", "docker"],
      ["Kubernetes", "kubernetes"], ["Terraform", "terraform"], ["GH Actions", "githubactions"], ["Linux", "linux"],
    ],
  },
  {
    label: "03 / LOGIC", title: "BACKEND", sub: "APIs • Services • Runtimes",
    icon: "server", status: ["REQUEST FLOW", "SERVICES SYNCED"],
    items: [
      ["Node.js", "nodedotjs"], ["TypeScript", "typescript"], ["FastAPI", "fastapi"], ["Django", "django"],
      ["Express", "express"], ["NestJS", "nestjs"], ["Rust", "rust"],
    ],
  },
  {
    label: "04 / INTERFACE", title: "FRONTEND", sub: "Experience • Components",
    icon: "target", status: ["BUILD STATUS", "COMPONENTS ONLINE"],
    items: [["Next.js", "nextdotjs"], ["React", "react"], ["Vue.js", "vuedotjs"], ["Nuxt", "nuxtdotjs"], ["Tailwind", "tailwindcss"]],
  },
  {
    label: "05 / KNOWLEDGE", title: "DATA", sub: "Persistence • Caching • Realtime",
    icon: "db", status: ["DATA PIPELINE", "STREAMS HEALTHY"],
    items: [["PostgreSQL", "postgresql"], ["MongoDB", "mongodb"], ["Redis", "redis"], ["MySQL", "mysql"], ["Firebase", "firebase"]],
  },
];

const C = {
  bg0: "#060B16",
  bg1: "#0B1220",
  panel0: "#0F1B2D",
  panel1: "#0A1322",
  tile: "#0F1D31",
  line: "#1E293B",
  accent: "#22D3EE",
  accent2: "#67E8F9",
  ink: "#F1F5F9",
  body: "#A5B4C8",
  muted: "#64748B",
  track: "#12263A",
};
const FONT = `'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif`;
const MONO = `'Cascadia Code', 'SF Mono', Consolas, monospace`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
let seed = 518;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

async function iconPath(slug) {
  if (!slug) return null;
  const res = await fetch(`${ICON_CDN}/${slug}.svg`);
  if (!res.ok) return null;
  return (await res.text()).match(/<path d="([^"]+)"/)?.[1] ?? null;
}

// ── pieces ──────────────────────────────────────────────────────────────────

// Badge tile + name; each tile glows on its own random rhythm
function badge(cx, y, [name, , abbr], d) {
  const dur = 3 + rand() * 4;
  const glyph = d
    ? `<path d="${d}" transform="translate(${cx - 10} ${y + 10}) scale(.8333)" fill="${C.accent2}"/>`
    : `<text x="${cx}" y="${y + 25}" text-anchor="middle" class="abbr">${abbr}</text>`;
  return `<g class="badge" style="--bd:${dur.toFixed(2)}s; --bdl:-${(rand() * dur).toFixed(2)}s">
        <rect class="tileBox" x="${cx - 20}" y="${y}" width="40" height="40" rx="10"/>
        <rect x="${cx - 17}" y="${y + 3}" width="34" height="34" rx="8" fill="none" stroke="${C.accent2}" stroke-opacity=".07"/>
        ${glyph}
        <text x="${cx}" y="${y + 56}" text-anchor="middle" class="name">${esc(name)}</text>
      </g>`;
}

// Animated header icons (shapes drawn around 0,0, ~±45 units, scaled down)
const ICON = {
  neural: `
        <circle r="44" fill="none" stroke="${C.accent}" stroke-opacity=".15" stroke-dasharray="3 8"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/></circle>
        <g stroke="${C.accent}" stroke-opacity=".3"><path d="M-24-16L0-22M-24-16L0 0M-24 16L0 0M-24 16L0 22M0-22L24 0M0 0L24 0M0 22L24 0"/></g>
        ${[[-24, -16], [-24, 16], [0, -22], [0, 0], [0, 22], [24, 0]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" fill="${C.accent2}"><animate attributeName="opacity" values=".25;1;.25" dur="1.8s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join("")}`,
  cloud: `
        <path d="M-31 9C-31-10-7-17 5-6C14-23 39-12 35 5C52 6 52 29 32 31H-25C-48 31-50 8-31 9Z" fill="${C.tile}" stroke="${C.accent}" stroke-opacity=".6"/>
        <ellipse rx="57" ry="29" fill="none" stroke="${C.accent}" stroke-opacity=".18" stroke-dasharray="3 9"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="7s" repeatCount="indefinite"/></ellipse>
        <circle cy="12" r="4" fill="${C.accent2}"><animate attributeName="r" values="2;6;2" dur="1.4s" repeatCount="indefinite"/></circle>`,
  server: `
        <rect x="-36" y="-30" width="72" height="60" rx="8" fill="${C.tile}" stroke="${C.accent}" stroke-opacity=".4"/>
        ${[-15, 0, 15].map((y, i) => `<circle cx="-23" cy="${y}" r="3" fill="${C.accent2}"><animate attributeName="opacity" values="${i % 2 ? "1;.2;1" : ".2;1;.2"}" dur="${(1.1 + i * 0.2).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join("")}
        <path d="M-13-15H25M-13 0H25M-13 15H25" stroke="#1F6F86" stroke-width="2"/>
        <circle r="46" fill="none" stroke="${C.accent}" stroke-opacity=".15" stroke-dasharray="2 10"><animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="7s" repeatCount="indefinite"/></circle>`,
  target: `
        <circle r="40" fill="none" stroke="${C.accent}" stroke-opacity=".16" stroke-dasharray="3 8"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite"/></circle>
        <circle r="25" fill="none" stroke="${C.accent}" stroke-opacity=".3"><animate attributeName="r" values="21;29;21" dur="2.4s" repeatCount="indefinite"/></circle>
        <path d="M-17 0H17M0-17V17" stroke="${C.accent}" stroke-opacity=".3"/>
        <circle r="4" fill="${C.accent2}"><animate attributeName="r" values="2;6;2" dur="1.5s" repeatCount="indefinite"/></circle>`,
  db: `
        <path d="M-32-20V22C-32 34 32 34 32 22V-20" fill="${C.tile}" stroke="${C.accent}" stroke-opacity=".55"/>
        <ellipse cy="-20" rx="32" ry="10" fill="${C.tile}" stroke="${C.accent}" stroke-opacity=".7"/>
        <path d="M-32 1C-32 13 32 13 32 1" fill="none" stroke="${C.accent}" stroke-opacity=".3"><animate attributeName="stroke-opacity" values=".15;.6;.15" dur="2s" repeatCount="indefinite"/></path>
        <circle r="46" fill="none" stroke="${C.accent}" stroke-opacity=".13" stroke-dasharray="3 8"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite"/></circle>`,
};

function frame(w, h, pulse) {
  return `<rect x="0" y="0" width="${w}" height="${h}" rx="16" fill="url(#panel)" stroke="${C.accent}" stroke-opacity=".22"/>
      <rect x="16" y="1" width="${w - 32}" height="2" rx="1" fill="${C.accent}" opacity=".5"><animate attributeName="opacity" values=".2;.8;.2" dur="${pulse}s" repeatCount="indefinite"/></rect>`;
}

// The featured panel has room for a bigger icon beside the title; small panels tuck it by the label
function heading(p, iconX, small) {
  return `<text x="20" y="32" class="label">${p.label}</text>
      <text x="20" y="60" class="title${small ? " small" : ""}">${esc(p.title)}</text>
      <text x="20" y="80" class="sub">${p.sub}</text>
      <g transform="translate(${iconX} ${small ? 28 : 44}) scale(${small ? 0.36 : 0.5})">${ICON[p.icon]}</g>`;
}

function status(x, y, w, [label, text], dur) {
  const a = Math.round(w * (0.55 + rand() * 0.15));
  const b = Math.round(w * (0.88 + rand() * 0.1));
  return `<text x="${x}" y="${y}" class="slabel">${label}</text>
      <text x="${x}" y="${y + 20}" class="stext">${text}</text>
      <circle cx="${x + w - 6}" cy="${y + 15}" r="4" fill="${C.accent2}">
        <animate attributeName="r" values="2.5;5;2.5" dur="1.7s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".35;1;.35" dur="1.7s" repeatCount="indefinite"/>
      </circle>
      <rect x="${x}" y="${y + 32}" width="${w}" height="4" rx="2" fill="${C.track}"/>
      <rect x="${x}" y="${y + 32}" width="${a}" height="4" rx="2" fill="${C.accent}">
        <animate attributeName="width" values="${a};${b};${Math.round((a + b) / 2)};${b - 10};${a}" dur="${dur}s" repeatCount="indefinite"/>
      </rect>`;
}

// ── layout ──────────────────────────────────────────────────────────────────

const W = 1000;
const PAD = 40;
const GAP = 20;
const FEAT_Y = 124;
const FEAT_H = 200;
const SMALL_Y = FEAT_Y + FEAT_H + GAP;
const SMALL_W = (W - PAD * 2 - GAP * 3) / 4;
const SMALL_COLS = 3;
const ROW_H = 70;
const maxRows = Math.max(...panels.slice(1).map((p) => Math.ceil(p.items.length / SMALL_COLS)));
const SMALL_H = 104 + maxRows * ROW_H + 74;
const H = SMALL_Y + SMALL_H + 56;

async function build() {
  const paths = await Promise.all(panels.map((p) => Promise.all(p.items.map(([, slug]) => iconPath(slug)))));
  const total = panels.reduce((n, p) => n + p.items.length, 0);

  // Featured AI panel: heading + status on the left, 2 × 5 badges on the right
  const f = panels[0];
  const featW = W - PAD * 2;
  const colW = (featW - 330 - 20) / 5;
  const feat = `<g transform="translate(${PAD} ${FEAT_Y})">
      ${frame(featW, FEAT_H, 3.5)}
      ${heading(f, 270)}
      ${status(20, 120, 270, f.status, 5)}
      ${f.items.map((it, i) => badge(330 + colW * (i % 5) + colW / 2, 26 + Math.floor(i / 5) * 84, it, paths[0][i])).join("\n      ")}
    </g>`;

  const smalls = panels.slice(1).map((p, k) => {
    const x = PAD + k * (SMALL_W + GAP);
    const cw = (SMALL_W - 20) / SMALL_COLS;
    return `<g transform="translate(${x} ${SMALL_Y})">
      ${frame(SMALL_W, SMALL_H, (3.6 + k * 0.4).toFixed(1))}
      ${heading(p, SMALL_W - 32, true)}
      ${p.items.map((it, i) => badge(10 + cw * (i % SMALL_COLS) + cw / 2, 104 + Math.floor(i / SMALL_COLS) * ROW_H, it, paths[k + 1][i])).join("\n      ")}
      ${status(20, SMALL_H - 64, SMALL_W - 40, p.status, (4.2 + k * 0.4).toFixed(1))}
    </g>`;
  }).join("\n    ");

  // Flowing connectors: AI panel down to each column, and between the columns
  const flows = [
    ...[0, 1, 2, 3].map((k) => {
      const cx = PAD + k * (SMALL_W + GAP) + SMALL_W / 2;
      return `M${cx} ${FEAT_Y + FEAT_H} V${SMALL_Y}`;
    }),
    ...[1, 2, 3].map((k) => {
      const x = PAD + k * (SMALL_W + GAP);
      const y = SMALL_Y + SMALL_H / 2;
      return `M${x - GAP} ${y} H${x}`;
    }),
  ].map((d) => `<path d="${d}" stroke-dasharray="2 8"><animate attributeName="stroke-dashoffset" values="0;-40" dur="1.2s" repeatCount="indefinite"/></path>`).join("\n    ");

  const particles = [
    [`cx`, `${PAD};${W - PAD};${PAD}`, 60, H - 34, 18],
    [`cx`, `${W - PAD};${PAD};${W - PAD}`, W - PAD, FEAT_Y - 12, 14],
    [`cy`, `${FEAT_Y};${H - 40};${FEAT_Y}`, 22, FEAT_Y, 11],
    [`cy`, `${H - 40};${FEAT_Y};${H - 40}`, W - 22, H - 40, 12],
  ].map(([attr, values, cx, cy, dur]) => `<circle cx="${cx}" cy="${cy}" r="1.6"><animate attributeName="${attr}" values="${values}" dur="${dur}s" repeatCount="indefinite"/></circle>`).join("\n    ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(`Tech stack. ${panels.map((p) => `${p.title}: ${p.items.map(([n]) => n).join(", ")}`).join(". ")}`)}">
  <title>Tech Stack</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.bg0}"/>
      <stop offset="1" stop-color="${C.bg1}"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.panel0}" stop-opacity=".96"/>
      <stop offset="1" stop-color="${C.panel1}" stop-opacity=".97"/>
    </linearGradient>
    <linearGradient id="neon" x1="0" x2="1">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0"/>
      <stop offset=".5" stop-color="${C.accent2}"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="halo">
      <stop offset="0" stop-color="#0891B2" stop-opacity=".22"/>
      <stop offset="1" stop-color="#0891B2" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.1" fill="#1A2538"/>
    </pattern>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
  </defs>
  <style>
    .label  { font: 600 10px ${MONO}; letter-spacing: 2.5px; fill: ${C.accent}; }
    .title  { font: 700 22px ${FONT}; letter-spacing: .5px; fill: ${C.ink}; }
    .title.small { font-size: 19px; }
    .sub    { font: 400 11.5px ${FONT}; fill: ${C.muted}; }
    .name   { font: 500 10.5px ${FONT}; fill: ${C.body}; }
    .abbr   { font: 700 13px ${FONT}; fill: ${C.accent2}; }
    .slabel { font: 600 9px ${MONO}; letter-spacing: 2px; fill: ${C.accent}; opacity: .8; }
    .stext  { font: 600 12.5px ${FONT}; letter-spacing: .5px; fill: ${C.ink}; }
    .head   { font: 700 26px ${FONT}; letter-spacing: 8px; fill: ${C.ink}; }
    .tag    { font: 500 10px ${MONO}; letter-spacing: 4px; fill: ${C.accent}; opacity: .7; }
    .foot   { font: 500 9.5px ${MONO}; letter-spacing: 3px; fill: ${C.accent}; }

    .tileBox { fill: ${C.tile}; stroke: ${C.accent}; stroke-opacity: .25; animation: tile var(--bd) ease-in-out var(--bdl) infinite; }
    @keyframes tile { 0%, 60%, 100% { fill: ${C.tile}; stroke-opacity: .25 } 72%, 82% { fill: #123049; stroke-opacity: .8 } }

    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>

  <g clip-path="url(#card)">
    <!-- minimal background: deep navy, drifting dot grid, one breathing halo -->
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect x="-24" y="-24" width="${W + 48}" height="${H + 48}" fill="url(#dots)">
      <animateTransform attributeName="transform" type="translate" values="0 0;24 24;0 0" dur="20s" repeatCount="indefinite"/>
    </rect>
    <ellipse cx="${W / 2}" cy="90" rx="380" ry="160" fill="url(#halo)">
      <animate attributeName="rx" values="320;420;340;400;320" dur="9s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".6;1;.55;.9;.6" dur="9s" repeatCount="indefinite"/>
    </ellipse>

    <!-- heading -->
    <text x="${W / 2}" y="62" text-anchor="middle" class="head">TECH STACK<animate attributeName="opacity" values=".85;1;.85" dur="4s" repeatCount="indefinite"/></text>
    <text x="${W / 2}" y="86" text-anchor="middle" class="tag">AI / CLOUD / BACKEND / FRONTEND / DATA</text>
    <rect x="${W / 2 - 160}" y="100" width="320" height="1.5" fill="url(#neon)">
      <animate attributeName="width" values="200;380;200" dur="5s" repeatCount="indefinite"/>
      <animate attributeName="x" values="${W / 2 - 100};${W / 2 - 190};${W / 2 - 100}" dur="5s" repeatCount="indefinite"/>
    </rect>

    <!-- connectors -->
    <g fill="none" stroke="${C.accent}" stroke-width="2" stroke-linecap="round" opacity=".5">
    ${flows}
    </g>

    <!-- drifting particles + scanning light, behind the panels -->
    <g fill="${C.accent2}" filter="url(#soft)">
    ${particles}
    </g>
    <rect x="-300" y="${FEAT_Y}" width="300" height="1.5" fill="url(#neon)" opacity=".6">
      <animate attributeName="x" values="-300;${W}" dur="6s" repeatCount="indefinite"/>
      <animate attributeName="y" values="${FEAT_Y};${H - 60};${FEAT_Y}" dur="12s" repeatCount="indefinite"/>
    </rect>

    ${feat}
    ${smalls}

    <!-- footer status -->
    <text x="${W / 2}" y="${H - 22}" text-anchor="middle" class="foot">● SYSTEMS CONNECTED  //  ${panels.length} DOMAINS  //  ${total} TECHNOLOGIES  //  BUILD • SHIP • SCALE<animate attributeName="opacity" values=".35;.8;.35" dur="3.2s" repeatCount="indefinite"/></text>
  </g>

  <!-- frame + corner marks -->
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${C.line}"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="10" fill="none" stroke="${C.accent}" stroke-opacity=".12">
    <animate attributeName="stroke-opacity" values=".06;.25;.08;.2;.06" dur="6s" repeatCount="indefinite"/>
  </rect>
  <g fill="none" stroke="${C.accent}" stroke-width="2" opacity=".5">
    <path d="M22 50V22H50"/><path d="M${W - 50} 22H${W - 22}V50"/>
    <path d="M22 ${H - 50}V${H - 22}H50"/><path d="M${W - 50} ${H - 22}H${W - 22}V${H - 50}"/>
  </g>
</svg>
`;

  writeFileSync(root + "assets/stack.svg", svg);
  const missing = panels.flatMap((p, i) => p.items.filter((_, j) => !paths[i][j]).map(([n]) => n));
  console.log(`assets/stack.svg written (${(svg.length / 1024).toFixed(0)} KB)${missing.length ? `, text badges for: ${missing.join(", ")}` : ""}`);
}

await build();
