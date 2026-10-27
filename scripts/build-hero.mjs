// Builds assets/hero.svg: the banner image + animated text and light effects.
// GitHub renders README SVGs as <img>, which blocks external files, so the
// background is embedded as base64. Edit the text/colors/timing below, then run:
//   node scripts/build-hero.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const bg = readFileSync(root + "assets/banner.webp").toString("base64");

const W = 1983;
const H = 793;
const X = 110; // left text margin

// Text lines. `width` is a fixed textLength so layout matches across system fonts.
// `accentFrom` colors the characters from that index onward with `accent`.
const lines = [
  { text: "K@nt 518", cls: "name", y: 360, width: 680, color: "#FFFFFF", accent: "#38BDF8", accentFrom: 5, wave: "#22D3EE", step: 0.11 },
  { text: "Senior Full Stack Engineer", cls: "title", y: 450, width: 635, color: "#E2E8F0", wave: "#22D3EE", step: 0.05 },
  { text: "AI Engineering • Cloud Solutions", cls: "tag", y: 525, width: 595, color: "#22D3EE", wave: "#FFFFFF", step: 0.05 },
];

// Timeline (seconds) of one full loop
const LOOP = 12;
const START = 0.3;        // first letter appears
const LINE_GAP = 0.3;     // pause between lines
const FADE_IN = 0.12;     // each letter's fade-in
const WAVES = [0, 1.7];   // wave passes, relative to the end of the underline
const WAVE_STEP = 0.04;   // delay between neighbouring letters in a wave
const WAVE_LEN = 0.7;     // how long one letter stays highlighted
const OUT_START = LOOP - 1.0; // everything fades out...
const OUT_END = LOOP - 0.5;   // ...and the screen stays empty until the loop restarts

const pct = (t) => `${((t / LOOP) * 100).toFixed(3)}%`;

// When each character appears, in reading order across all lines
const chars = [];
let t = START;
lines.forEach((line, li) => {
  [...line.text].forEach((ch, ci) => {
    const base = line.accentFrom !== undefined && ci >= line.accentFrom ? line.accent : line.color;
    chars.push({ ch, li, base, wave: line.wave, appear: t });
    t += line.step;
  });
  t += LINE_GAP;
});
const TYPED = t - LINE_GAP;
const UNDERLINE_END = TYPED + 0.7;
const WAVE_START = UNDERLINE_END + 0.2;

const charKeyframes = chars.map((c, i) => {
  const frames = [
    [0, `fill-opacity:0;fill:${c.base}`],
    [c.appear, `fill-opacity:0;fill:${c.wave}`],
    [c.appear + FADE_IN, `fill-opacity:1;fill:${c.wave}`],
    [c.appear + FADE_IN + 0.25, `fill-opacity:1;fill:${c.base}`],
  ];
  for (const offset of WAVES) {
    const w = WAVE_START + offset + i * WAVE_STEP;
    frames.push([w, `fill:${c.base}`], [w + WAVE_LEN / 2, `fill:${c.wave}`], [w + WAVE_LEN, `fill:${c.base}`]);
  }
  frames.push([OUT_START, `fill-opacity:1`], [OUT_END, `fill-opacity:0`], [LOOP, `fill-opacity:0`]);
  return `@keyframes c${i} { ${frames.map(([time, css]) => `${pct(time)} { ${css} }`).join(" ")} }
    .c${i} { fill: ${c.base}; animation: c${i} ${LOOP}s linear infinite; }`;
}).join("\n    ");

const textEls = lines.map((line, li) => {
  const spans = chars.map((c, i) => (c.li === li ? `<tspan class="c${i}">${c.ch === " " ? "&#160;" : c.ch}</tspan>` : "")).join("");
  return `<text class="${line.cls}" x="${X}" y="${line.y}" textLength="${line.width}" lengthAdjust="spacing">${spans}</text>`;
}).join("\n    ");

const TAG = lines[2];

// Vertical light lines above the cloud: [x, yTop, yBottom]
const dataLines = [
  [1410, 95, 380],
  [1555, 95, 270],
  [1652, 60, 200],
  [1750, 90, 260],
  [1838, 105, 270],
];

// Existing bright dots in the image that should twinkle: [x, y, r]
const sparkles = [
  [325, 97, 7], [408, 200, 7], [1005, 196, 8], [1249, 104, 7],
  [293, 620, 9], [536, 628, 8], [940, 490, 6], [646, 233, 5], [1180, 445, 5],
];

const FONT = `'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif`;
const ARIA = lines.map((l) => l.text).join(" · ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${ARIA}">
  <title>${ARIA}</title>
  <defs>
    <linearGradient id="accent" x1="0" x2="1">
      <stop offset="0" stop-color="#22D3EE"/>
      <stop offset="1" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="shade" x1="0" x2="1">
      <stop offset="0" stop-color="#020617" stop-opacity=".75"/>
      <stop offset=".45" stop-color="#020617" stop-opacity=".35"/>
      <stop offset=".6" stop-color="#020617" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0" stop-color="#38BDF8" stop-opacity=".55"/>
      <stop offset="1" stop-color="#38BDF8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="dot">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".35" stop-color="#67E8F9"/>
      <stop offset="1" stop-color="#22D3EE" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="textGlow" x="-10%" y="-30%" width="120%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="b"/>
      <feFlood flood-color="#22D3EE" flood-opacity=".35"/>
      <feComposite in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <path id="waveTop" d="M -40 190 C 250 185 450 205 650 232 S 950 270 1080 350 S 1300 440 1460 452"/>
    <path id="waveLow" d="M 200 650 C 420 615 600 570 760 580 S 1000 650 1120 620 S 1350 545 1520 525"/>
  </defs>

  <style>
    .name     { font: 800 150px ${FONT}; letter-spacing: -2px; }
    .title    { font: 500 54px ${FONT}; }
    .tag      { font: 500 40px ${FONT}; }

    /* text loop: letters type in one by one, then a color wave flows through them */
    ${charKeyframes}

    .underline { transform-box: fill-box; animation: underline ${LOOP}s ease-out infinite; }
    @keyframes underline {
      0%, ${pct(TYPED)} { transform: scaleX(0); opacity: 1 }
      ${pct(UNDERLINE_END)}, ${pct(OUT_START)} { transform: scaleX(1); opacity: 1 }
      ${pct(OUT_END)}, 100% { transform: scaleX(1); opacity: 0 }
    }

    .cursor   { animation: cursor ${LOOP}s step-end infinite; }
    @keyframes cursor {
      0% { opacity: 0 }
      ${Array.from({ length: Math.floor((OUT_START - TYPED) / 0.5) }, (_, k) => `${pct(TYPED + k * 0.5)} { opacity: ${k % 2 ? 0 : 1} }`).join(" ")}
      ${pct(OUT_START)} { opacity: 0 }
    }

    /* ambient loops on the image */
    .breathe  { transform-box: fill-box; transform-origin: center; animation: breathe 5s ease-in-out infinite; }
    @keyframes breathe { 0%, 100% { opacity: .35; transform: scale(.96) } 50% { opacity: .8; transform: scale(1.04) } }

    .chip     { animation: beat 2.6s ease-in-out infinite; }
    @keyframes beat { 0%, 40%, 100% { opacity: .15 } 12% { opacity: .9 } 26% { opacity: .55 } }

    .twinkle  { animation: twinkle 3.2s ease-in-out infinite; }
    @keyframes twinkle { 0%, 100% { opacity: .15 } 50% { opacity: 1 } }

    .up       { animation: up 3s cubic-bezier(.4,0,.6,1) infinite; opacity: 0; }
    @keyframes up { 0% { opacity: 0; transform: translateY(0) } 15% { opacity: 1 } 85% { opacity: 1 } 100% { opacity: 0; transform: translateY(var(--dy)) } }

    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
      .up, .cursor { display: none; }
    }
  </style>

  <!-- background + left shade for text contrast -->
  <image href="data:image/webp;base64,${bg}" xlink:href="data:image/webp;base64,${bg}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>

  <!-- cloud breathing glow -->
  <ellipse class="breathe" cx="1640" cy="330" rx="300" ry="190" fill="url(#glow)" style="mix-blend-mode:screen"/>

  <!-- AI chip heartbeat -->
  <rect class="chip" x="1532" y="378" width="140" height="148" rx="16" fill="none" stroke="#67E8F9" stroke-width="6" filter="url(#blur)"/>

  <!-- twinkling sparkles -->
  ${sparkles.map(([x, y, r], i) => `<circle class="twinkle" cx="${x}" cy="${y}" r="${r * 2.2}" fill="url(#dot)" style="animation-delay:${(i * 0.45).toFixed(2)}s"/>`).join("\n  ")}

  <!-- data pulses rising to the cloud -->
  ${dataLines.map(([x, top, bottom], i) => `<rect class="up" x="${x - 2}" y="${bottom - 40}" width="4" height="40" rx="2" fill="#A5F3FC" style="--dy:${top - bottom}px;animation-delay:${(i * 0.6).toFixed(1)}s"/>`).join("\n  ")}

  <!-- light comets flowing along the waves -->
  ${[["waveTop", 4.5, 0], ["waveTop", 4.5, 2.2], ["waveLow", 5.5, 1], ["waveLow", 5.5, 3.6]].map(([p, dur, delay]) => `<circle r="16" fill="url(#dot)" opacity="0">
    <animateMotion dur="${dur}s" begin="${delay}s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .6 1"><mpath href="#${p}" xlink:href="#${p}"/></animateMotion>
    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
  </circle>`).join("\n  ")}

  <!-- text -->
  <g filter="url(#textGlow)">
    ${textEls}
  </g>
  <rect class="cursor" x="${X + TAG.width + 14}" y="${TAG.y - 35}" width="4" height="44" fill="#22D3EE"/>
  <rect class="underline" x="${X + 2}" y="${TAG.y + 31}" width="${TAG.width}" height="4" rx="2" fill="url(#accent)"/>
</svg>
`;

writeFileSync(root + "assets/hero.svg", svg);
console.log(`assets/hero.svg written (${(svg.length / 1024).toFixed(0)} KB), loop ${LOOP}s, typed by ${TYPED.toFixed(1)}s`);
