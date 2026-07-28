import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetsFile = JSON.parse(
  fs.readFileSync(path.join(__dirname, "cat-targets.json"), "utf8")
);

const MAP_W = 380;
const MAP_H = 400;
const colors = ["#ff1744", "#8b5cf6", "#00ff9d", "#58a6ff", "#e6edf3", "#a371f7"];
const DUR = 6.5; // seconds per loop — continuous like the snake

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function row(y, label, value) {
  const pad = Math.max(2, 48 - label.length - String(value).length);
  const dots = ".".repeat(pad);
  return `<text x="470" y="${y}" font-size="14" xml:space="preserve"><tspan fill="#00ff9d">${label} </tspan><tspan fill="rgba(139,148,158,0.35)">${dots}</tspan><tspan fill="#e6edf3" font-weight="600"> ${value}</tspan></text>`;
}

function buildParticles() {
  const rng = mulberry32(42);
  const pad = 0.1;
  const usableW = MAP_W * (1 - 2 * pad);
  const usableH = MAP_H * (1 - 2 * pad);
  const ox = MAP_W * pad;
  const oy = MAP_H * pad;

  const pts = targetsFile.points.slice(0, 650);
  let keyframes = "";
  let circles = "";

  pts.forEach((p, i) => {
    const tx = ox + p.x * usableW;
    const ty = oy + p.y * usableH;
    const sx = rng() * MAP_W;
    const sy = rng() * MAP_H;
    // slight hold jitter so cat "breathes"
    const jx = tx + (rng() - 0.5) * 4;
    const jy = ty + (rng() - 0.5) * 4;
    const mx = tx + (rng() - 0.5) * 18;
    const my = ty + (rng() - 0.5) * 18;
    const r = p.solid ? 1.6 + rng() * 1.2 : 1.1 + rng() * 0.9;
    const fill = colors[i % colors.length];
    const delay = -(rng() * DUR).toFixed(2); // negative delay = already mid-loop (autoplay feel)
    const name = `p${i}`;

    keyframes += `@keyframes ${name}{0%{transform:translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px);opacity:.35}32%{transform:translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px);opacity:1}72%{transform:translate(${jx.toFixed(1)}px,${jy.toFixed(1)}px);opacity:1}88%{transform:translate(${mx.toFixed(1)}px,${my.toFixed(1)}px);opacity:.75}100%{transform:translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px);opacity:.35}}`;
    circles += `<circle class="dot" r="${r.toFixed(1)}" fill="${fill}" style="animation:${name} ${DUR}s ease-in-out ${delay}s infinite"/>`;
  });

  return { keyframes, circles };
}

const { keyframes, circles } = buildParticles();

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="520" viewBox="0 0 1180 520" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" role="img" aria-label="Dente22 visual map — particles assemble into cat (autoplay)">
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
    <clipPath id="mapClip"><rect x="0" y="0" width="${MAP_W}" height="${MAP_H}" rx="14"/></clipPath>
    <style><![CDATA[
      .dot{transform-box:fill-box;transform-origin:center}
      ${keyframes}
      @keyframes livePulse{0%,100%{opacity:1}50%{opacity:.3}}
      .live{animation:livePulse 1.6s ease-in-out infinite}
      @keyframes chip{0%,30%{opacity:1}35%,65%{opacity:0}70%,100%{opacity:1}}
      .chip-a{animation:chip 6.5s ease-in-out infinite}
      .chip-b{animation:chip 6.5s ease-in-out infinite;animation-delay:-3.25s}
    ]]></style>
  </defs>

  <rect width="1180" height="520" rx="18" fill="#0d1117" stroke="url(#acc)" stroke-width="2"/>
  <rect width="1180" height="42" rx="18" fill="#010409"/>
  <rect y="24" width="1180" height="18" fill="#010409"/>
  <circle cx="24" cy="21" r="6" fill="#ff5f56"/>
  <circle cx="44" cy="21" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="21" r="6" fill="#27c93f"/>
  <text x="90" y="26" font-size="12" fill="#8b949e">dente22 — visual.map · cat assemble · autoplay</text>
  <text x="1145" y="26" text-anchor="end" font-size="12" fill="#8b949e">diskusms-site-iota.vercel.app</text>

  <text x="36" y="64" font-size="11" letter-spacing="2" fill="#58a6ff">VISUAL.MAP</text>
  <text x="130" y="64" font-size="10" fill="#484f58">./assemble --target=cat --loop</text>
  <rect x="28" y="72" width="400" height="400" rx="14" fill="#010409" stroke="rgba(88,166,255,0.35)" stroke-width="1.5"/>
  <path d="M40 92 H56 M40 92 V108" stroke="#00ff9d" stroke-width="2" fill="none"/>
  <path d="M400 92 H384 M400 92 V108" stroke="#00ff9d" stroke-width="2" fill="none"/>
  <path d="M40 452 H56 M40 452 V436" stroke="#ff1744" stroke-width="2" fill="none"/>
  <path d="M400 452 H384 M400 452 V436" stroke="#ff1744" stroke-width="2" fill="none"/>
  <rect x="28" y="72" width="400" height="400" fill="url(#glow)"/>

  <g transform="translate(38,82)" clip-path="url(#mapClip)">
    ${circles}
  </g>

  <rect x="110" y="458" width="236" height="22" rx="11" fill="#161b22" stroke="#30363d"/>
  <circle cx="128" cy="469" r="4" fill="#00ff9d" class="live"/>
  <text x="142" y="473" font-size="11" fill="#8b949e" class="chip-a">particles → assembling…</text>
  <text x="142" y="473" font-size="11" fill="#e6edf3" class="chip-b">particles → CAT LOCKED</text>

  <text x="470" y="64" font-size="11" letter-spacing="2" fill="#58a6ff">SYSTEM.INFO</text>
  <line x1="470" y1="78" x2="980" y2="78" stroke="rgba(255,255,255,0.10)"/>
  <text x="1145" y="72" text-anchor="end" font-size="12" fill="#ff1744" font-weight="700" class="live">● LIVE</text>

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
console.log("wrote visual-map.svg", Math.round(svg.length / 1024), "KB");
