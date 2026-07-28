import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Particle field forming a stylized "</>" */
function particles() {
  const pts = [];
  const W = 380;
  const H = 380;
  const rng = (n) => Math.sin(n * 12.9898) * 43758.5453 % 1;

  function stamp(px, py, r, fill, i) {
    const delay = (Math.abs(rng(i)) * 3).toFixed(2);
    const dur = (2.4 + Math.abs(rng(i + 7)) * 2.2).toFixed(2);
    pts.push(
      `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="0.9">` +
        `<animate attributeName="opacity" values="0.45;1;0.45" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>` +
        `</circle>`
    );
  }

  const colors = ["#ff1744", "#8b5cf6", "#00ff9d", "#58a6ff", "#e6edf3", "#a371f7"];
  let i = 0;

  // left "<" � two thick diagonals
  for (let t = -1; t <= 1; t += 0.012) {
    // upper arm
    const x1 = 95 + (1 - Math.abs(t)) * 55;
    const y1 = 190 + t * 130;
    stamp(x1 + rng(i) * 6, y1 + rng(i + 1) * 6, 1.3 + Math.abs(rng(i + 2)) * 1.6, colors[i % colors.length], i++);
    // lower thickening
    stamp(x1 + 8 + rng(i) * 4, y1 + rng(i + 3) * 4, 1.1 + Math.abs(rng(i + 4)), colors[(i + 2) % colors.length], i++);
  }

  // slash "/"
  for (let t = -1; t <= 1; t += 0.014) {
    const x = 190 + t * 28;
    const y = 190 - t * 125;
    stamp(x + rng(i) * 5, y + rng(i + 1) * 5, 1.4 + Math.abs(rng(i + 2)) * 1.5, colors[i % colors.length], i++);
    stamp(x + 6 + rng(i) * 3, y + rng(i + 3) * 3, 1.0 + Math.abs(rng(i + 4)), colors[(i + 1) % colors.length], i++);
  }

  // right ">"
  for (let t = -1; t <= 1; t += 0.012) {
    const x1 = 285 - (1 - Math.abs(t)) * 55;
    const y1 = 190 + t * 130;
    stamp(x1 + rng(i) * 6, y1 + rng(i + 1) * 6, 1.3 + Math.abs(rng(i + 2)) * 1.6, colors[i % colors.length], i++);
    stamp(x1 - 8 + rng(i) * 4, y1 + rng(i + 3) * 4, 1.1 + Math.abs(rng(i + 4)), colors[(i + 3) % colors.length], i++);
  }

  // ambient dust
  for (let k = 0; k < 160; k++) {
    const x = Math.abs(rng(k + 900)) * W;
    const y = Math.abs(rng(k + 901)) * H;
    const r = 0.5 + Math.abs(rng(k + 902)) * 1.0;
    const fill = Math.abs(rng(k + 903)) > 0.5 ? "#8b5cf6" : "#30363d";
    pts.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="${(0.12 + Math.abs(rng(k + 904)) * 0.3).toFixed(2)}"/>`
    );
  }
  return pts.join("\n");
}

function row(y, label, value) {
  const pad = Math.max(2, 48 - label.length - String(value).length);
  const dots = ".".repeat(pad);
  return `<text x="470" y="${y}" font-size="14" xml:space="preserve"><tspan fill="#00ff9d">${label} </tspan><tspan fill="rgba(139,148,158,0.35)">${dots}</tspan><tspan fill="#e6edf3" font-weight="600"> ${value}</tspan></text>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="520" viewBox="0 0 1180 520" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" role="img" aria-label="Dente22 visual map">
  <defs>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff1744"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#00ff9d"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35"/>
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
  <text x="90" y="26" font-size="12" fill="#8b949e">dente22 � visual.map � diskusms</text>
  <text x="1145" y="26" text-anchor="end" font-size="12" fill="#8b949e">diskusms-site-iota.vercel.app</text>

  <text x="36" y="64" font-size="11" letter-spacing="2" fill="#58a6ff">VISUAL.MAP</text>
  <rect x="28" y="72" width="400" height="400" rx="14" fill="#010409" stroke="rgba(88,166,255,0.35)" stroke-width="1.5"/>
  <path d="M40 92 H56 M40 92 V108" stroke="#00ff9d" stroke-width="2" fill="none"/>
  <path d="M400 92 H384 M400 92 V108" stroke="#00ff9d" stroke-width="2" fill="none"/>
  <path d="M40 452 H56 M40 452 V436" stroke="#ff1744" stroke-width="2" fill="none"/>
  <path d="M400 452 H384 M400 452 V436" stroke="#ff1744" stroke-width="2" fill="none"/>
  <rect x="28" y="72" width="400" height="400" fill="url(#glow)"/>
  <g clip-path="url(#mapClip)" transform="translate(38,82)">
${particles()}
  </g>

  <text x="470" y="64" font-size="11" letter-spacing="2" fill="#58a6ff">SYSTEM.INFO</text>
  <line x1="470" y1="78" x2="980" y2="78" stroke="rgba(255,255,255,0.10)"/>
  <text x="1145" y="72" text-anchor="end" font-size="12" fill="#ff1744" font-weight="700">
    <tspan>&#9679;</tspan> LIVE
    <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/>
  </text>

  <rect x="470" y="96" width="210" height="22" rx="4" fill="#4c1d95"/>
  <text x="482" y="112" font-size="13" font-weight="700" fill="#e9d5ff">dente22@diskusms</text>

${row(148, "Subject", "Dente22")}
${row(174, "Role", "vibe coder � sound � code")}
${row(200, "Origin", "Almaty")}
${row(226, "Uptime", "~18�19 yrs (b. 2007)")}
${row(252, "Status", "Jam � Mix � Master � Ship")}
${row(278, "ToolChain", "Cursor � VS Code � git")}
${row(304, "Core.Lang", "TypeScript � Python � JS")}
${row(330, "Core.Stack", "3D web � bots � Vercel")}
${row(356, "Core.Sound", "DiskusMS � drops � radar")}
${row(382, "Grid.TG", "@Diskusmms")}
${row(408, "Grid.GH", "github.com/Dente22")}
${row(434, "Grid.Web", "diskusms-site-iota.vercel.app")}

  <text x="470" y="478" font-size="12" fill="#8b949e">Mode <tspan fill="#8b5cf6">VIBE+AI</tspan>  �  Diff <tspan fill="#3fb950">+ideas</tspan>/<tspan fill="#f85149">-noise</tspan>  �  <tspan fill="#00ff9d">REBEL_MODE</tspan></text>
</svg>
`;

fs.writeFileSync(path.join(__dirname, "visual-map.svg"), svg);
console.log("wrote visual-map.svg", Math.round(svg.length / 1024), "KB");
