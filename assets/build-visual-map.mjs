import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lines = JSON.parse(
  fs.readFileSync(path.join(__dirname, "avatar-ascii.json"), "utf8")
);

const MAP_W = 380;
const MAP_H = 400;
const colors = ["#ff1744", "#8b5cf6", "#00ff9d", "#58a6ff", "#e6edf3", "#a371f7"];

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Keep cat head/shoulders — drop full-width screen/floor bars */
function catMask() {
  const kept = [];
  for (const row of lines) {
    const solid = [...row].filter((c) => c !== " " && c !== ".").length;
    const fill = solid / Math.max(1, row.length);
    if (fill > 0.82 || solid === 0) continue;
    kept.push(row);
  }
  if (!kept.length) return lines;
  let left = Infinity;
  let right = 0;
  for (const r of kept) {
    for (let i = 0; i < r.length; i++) {
      if (r[i] !== " " && r[i] !== ".") {
        left = Math.min(left, i);
        right = Math.max(right, i);
      }
    }
  }
  return kept.map((r) => r.slice(left, right + 1));
}

/** Collect cat silhouette target points from ASCII */
function catTargets(rng) {
  const mask = catMask();
  const rows = mask.length;
  const cols = Math.max(...mask.map((l) => l.length));
  const pad = 0.08;
  const usableW = MAP_W * (1 - 2 * pad);
  const usableH = MAP_H * (1 - 2 * pad);
  const cellW = usableW / cols;
  const cellH = usableH / rows;
  const ox = MAP_W * pad;
  const oy = MAP_H * pad;
  const targets = [];

  for (let y = 0; y < rows; y++) {
    const row = mask[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === " " || ch === ".") continue;
      const density = ch === "@" ? 4 : ch === "#" || ch === "%" ? 2 : 1;
      for (let k = 0; k < density; k++) {
        targets.push({
          x: ox + x * cellW + cellW * (0.15 + rng() * 0.7),
          y: oy + y * cellH + cellH * (0.15 + rng() * 0.7),
          solid: ch === "@" || ch === "#",
        });
      }
    }
  }
  return targets;
}

function particles() {
  const rng = mulberry32(42);
  const targets = catTargets(rng);
  // cap for file size / GitHub friendliness
  const max = Math.min(targets.length, 900);
  const picked = [];
  const step = targets.length / max;
  for (let i = 0; i < max; i++) {
    picked.push(targets[Math.floor(i * step)]);
  }

  const dur = "7s";
  // assemble → hold as cat → soft scatter pulse → reform
  // keyTimes: 0 chaos, 0.35 cat, 0.78 cat, 1 soft drift near cat (loop feels alive)
  return picked
    .map((t, i) => {
      const r0 = rng();
      const startX = rng() * MAP_W;
      const startY = rng() * MAP_H;
      // slight drift when "holding" so it shimmer-lives
      const holdX = t.x + (rng() - 0.5) * 3;
      const holdY = t.y + (rng() - 0.5) * 3;
      const midX = t.x + (rng() - 0.5) * 14;
      const midY = t.y + (rng() - 0.5) * 14;
      const r = t.solid ? 1.4 + r0 * 1.4 : 1.0 + r0 * 1.1;
      const fill = colors[i % colors.length];
      const delay = (rng() * 0.8).toFixed(2);

      return (
        `<circle cx="${startX.toFixed(1)}" cy="${startY.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="0.95">` +
        `<animate attributeName="cx" values="${startX.toFixed(1)};${t.x.toFixed(1)};${holdX.toFixed(1)};${midX.toFixed(1)};${startX.toFixed(1)}" keyTimes="0;0.32;0.72;0.88;1" dur="${dur}" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>` +
        `<animate attributeName="cy" values="${startY.toFixed(1)};${t.y.toFixed(1)};${holdY.toFixed(1)};${midY.toFixed(1)};${startY.toFixed(1)}" keyTimes="0;0.32;0.72;0.88;1" dur="${dur}" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>` +
        `<animate attributeName="opacity" values="0.35;1;1;0.7;0.35" keyTimes="0;0.32;0.72;0.88;1" dur="${dur}" begin="${delay}s" repeatCount="indefinite"/>` +
        `</circle>`
      );
    })
    .join("\n");
}

function row(y, label, value) {
  const pad = Math.max(2, 48 - label.length - String(value).length);
  const dots = ".".repeat(pad);
  return `<text x="470" y="${y}" font-size="14" xml:space="preserve"><tspan fill="#00ff9d">${label} </tspan><tspan fill="rgba(139,148,158,0.35)">${dots}</tspan><tspan fill="#e6edf3" font-weight="600"> ${value}</tspan></text>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="520" viewBox="0 0 1180 520" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" role="img" aria-label="Dente22 visual map — particles form cat">
  <defs>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff1744"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#00ff9d"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="55%" r="55%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.32"/>
      <stop offset="55%" stop-color="#ff1744" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#0d1117" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="mapClip"><rect x="28" y="72" width="400" height="400" rx="14"/></clipPath>
  </defs>

  <rect width="1180" height="520" rx="18" fill="#0d1117" stroke="url(#acc)" stroke-width="2"/>
  <rect width="1180" height="42" rx="18" fill="#010409"/>
  <rect y="24" width="1180" height="18" fill="#010409"/>
  <circle cx="24" cy="21" r="6" fill="#ff5f56"/>
  <circle cx="44" cy="21" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="21" r="6" fill="#27c93f"/>
  <text x="90" y="26" font-size="12" fill="#8b949e">dente22 — visual.map · cat assemble</text>
  <text x="1145" y="26" text-anchor="end" font-size="12" fill="#8b949e">diskusms-site-iota.vercel.app</text>

  <text x="36" y="64" font-size="11" letter-spacing="2" fill="#58a6ff">VISUAL.MAP</text>
  <text x="130" y="64" font-size="10" fill="#484f58">./assemble --target=cat</text>
  <rect x="28" y="72" width="400" height="400" rx="14" fill="#010409" stroke="rgba(88,166,255,0.35)" stroke-width="1.5"/>
  <path d="M40 92 H56 M40 92 V108" stroke="#00ff9d" stroke-width="2" fill="none"/>
  <path d="M400 92 H384 M400 92 V108" stroke="#00ff9d" stroke-width="2" fill="none"/>
  <path d="M40 452 H56 M40 452 V436" stroke="#ff1744" stroke-width="2" fill="none"/>
  <path d="M400 452 H384 M400 452 V436" stroke="#ff1744" stroke-width="2" fill="none"/>
  <rect x="28" y="72" width="400" height="400" fill="url(#glow)"/>
  <g clip-path="url(#mapClip)" transform="translate(38,82)">
${particles()}
  </g>

  <!-- status chip under map -->
  <rect x="120" y="458" width="216" height="22" rx="11" fill="#161b22" stroke="#30363d"/>
  <circle cx="138" cy="469" r="4" fill="#00ff9d">
    <animate attributeName="opacity" values="1;0.25;1" dur="1.4s" repeatCount="indefinite"/>
  </circle>
  <text x="152" y="473" font-size="11" fill="#8b949e">particles → <tspan fill="#e6edf3">CAT</tspan></text>

  <text x="470" y="64" font-size="11" letter-spacing="2" fill="#58a6ff">SYSTEM.INFO</text>
  <line x1="470" y1="78" x2="980" y2="78" stroke="rgba(255,255,255,0.10)"/>
  <text x="1145" y="72" text-anchor="end" font-size="12" fill="#ff1744" font-weight="700">
    <tspan>&#9679;</tspan> LIVE
    <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/>
  </text>

  <rect x="470" y="96" width="210" height="22" rx="4" fill="#4c1d95"/>
  <text x="482" y="112" font-size="13" font-weight="700" fill="#e9d5ff">dente22@diskusms</text>

${row(148, "Subject", "Dente22")}
${row(174, "Role", "vibe coder · sound × code")}
${row(200, "Origin", "Almaty")}
${row(226, "Uptime", "~18–19 yrs (b. 2007)")}
${row(252, "Status", "Jam · Mix · Master · Ship")}
${row(278, "ToolChain", "Cursor · VS Code · git")}
${row(304, "Core.Lang", "TypeScript · Python · JS")}
${row(330, "Core.Stack", "3D web · bots · Vercel")}
${row(356, "Core.Sound", "DiskusMS · drops · radar")}
${row(382, "Grid.TG", "@Diskusmms")}
${row(408, "Grid.GH", "github.com/Dente22")}
${row(434, "Grid.Web", "diskusms-site-iota.vercel.app")}

  <text x="470" y="478" font-size="12" fill="#8b949e">Mode <tspan fill="#8b5cf6">VIBE+AI</tspan>  ·  Diff <tspan fill="#3fb950">+ideas</tspan>/<tspan fill="#f85149">-noise</tspan>  ·  <tspan fill="#00ff9d">REBEL_MODE</tspan></text>
</svg>
`;

fs.writeFileSync(path.join(__dirname, "visual-map.svg"), svg);
console.log("wrote visual-map.svg", Math.round(svg.length / 1024), "KB", "targets from", lines.length, "rows");
