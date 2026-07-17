import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = __dirname;

const lines = JSON.parse(fs.readFileSync(path.join(dir, "avatar-ascii.json"), "utf8"));

function colorFor(ch) {
  const ramp = " .`-:=+*#%@";
  // map our charset ' .:-+=*#%@' loosely
  const map = { " ": 0, ".": 1, ":": 2, "-": 3, "=": 4, "+": 5, "*": 6, "#": 7, "%": 8, "@": 9 };
  const i = map[ch] ?? 0;
  if (i <= 1) return "#0d1117";
  if (i <= 3) return "#30363d";
  if (i <= 5) return "#6e7681";
  if (i <= 6) return "#00ff9d";
  if (i <= 7) return "#58a6ff";
  if (i <= 8) return "#a371f7";
  return "#e6edf3"; // silhouette highlight
}

const startX = 20;
const startY = 70;
const lineH = 12;
const fontSize = 10.5;
const charW = 6.35;

function esc(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let texts = "";
lines.forEach((line, yi) => {
  let run = "";
  let runColor = colorFor(line[0] || " ");
  let runX = startX;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const col = colorFor(ch);
    if (col !== runColor) {
      if (run) {
        texts += `<text x="${runX}" y="${startY + yi * lineH}" fill="${runColor}" xml:space="preserve">${esc(run)}</text>\n`;
      }
      runX = startX + i * charW;
      run = ch;
      runColor = col;
    } else {
      run += ch;
    }
  }
  if (run) {
    texts += `<text x="${runX}" y="${startY + yi * lineH}" fill="${runColor}" xml:space="preserve">${esc(run)}</text>\n`;
  }
});

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="560" viewBox="0 0 980 560">
  <defs>
    <linearGradient id="stroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff1744"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#00ff9d"/>
    </linearGradient>
  </defs>
  <rect width="980" height="560" rx="18" fill="#0d1117" stroke="url(#stroke)" stroke-width="2.5"/>
  <rect width="980" height="40" rx="18" fill="#010409"/>
  <rect y="22" width="980" height="18" fill="#010409"/>
  <circle cx="24" cy="20" r="6" fill="#ff5f56"/>
  <circle cx="44" cy="20" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="20" r="6" fill="#27c93f"/>
  <text x="490" y="24" text-anchor="middle" fill="#8b949e" font-family="ui-monospace,Consolas,monospace" font-size="12">dente22 — zsh — neofetch · cat avatar ASCII</text>

  <g font-family="ui-monospace,Consolas,Menlo,monospace" font-size="${fontSize}">
${texts}
  </g>

  <g font-family="ui-monospace,Consolas,monospace" font-size="15">
    <text x="320" y="78">
      <tspan fill="#ff1744" font-weight="700">dente22</tspan><tspan fill="#8b949e">@</tspan><tspan fill="#00ff9d" font-weight="700">diskusms</tspan>
    </text>
    <text x="320" y="98" fill="#30363d">────────────────────────────────────</text>
    <text x="320" y="130"><tspan fill="#f78166">OS</tspan><tspan fill="#8b949e">:           </tspan><tspan fill="#c9d1d9">Windows · Vercel · GitHub</tspan></text>
    <text x="320" y="158"><tspan fill="#f78166">Host</tspan><tspan fill="#8b949e">:         </tspan><tspan fill="#c9d1d9">DiskusMS — sound × code</tspan></text>
    <text x="320" y="186"><tspan fill="#f78166">Kernel</tspan><tspan fill="#8b949e">:       </tspan><tspan fill="#c9d1d9">vibe coding + AI copilots</tspan></text>
    <text x="320" y="214"><tspan fill="#f78166">IDE</tspan><tspan fill="#8b949e">:          </tspan><tspan fill="#c9d1d9">Cursor · VS Code</tspan></text>
    <text x="320" y="242"><tspan fill="#f78166">Shell</tspan><tspan fill="#8b949e">:        </tspan><tspan fill="#c9d1d9">PowerShell · git · ship</tspan></text>
    <text x="320" y="278"><tspan fill="#f78166">Languages</tspan><tspan fill="#8b949e">:</tspan></text>
    <text x="320" y="304"><tspan fill="#a371f7">  Programming</tspan><tspan fill="#8b949e">: </tspan><tspan fill="#79c0ff">TypeScript, Python, JS</tspan></text>
    <text x="320" y="330"><tspan fill="#a371f7">  Real</tspan><tspan fill="#8b949e">:         </tspan><tspan fill="#79c0ff">Russian, English</tspan></text>
    <text x="320" y="366"><tspan fill="#f78166">Hobbies</tspan><tspan fill="#8b949e">:</tspan></text>
    <text x="320" y="392"><tspan fill="#a371f7">  Software</tspan><tspan fill="#8b949e">:    </tspan><tspan fill="#79c0ff">bots, 3D web, shipping</tspan></text>
    <text x="320" y="418"><tspan fill="#a371f7">  Sound</tspan><tspan fill="#8b949e">:       </tspan><tspan fill="#79c0ff">drops, production, radar</tspan></text>
    <text x="320" y="454"><tspan fill="#f78166">Contact</tspan><tspan fill="#8b949e">:     </tspan><tspan fill="#58a6ff">github.com/Dente22</tspan></text>
    <text x="320" y="480"><tspan fill="#f78166">Website</tspan><tspan fill="#8b949e">:     </tspan><tspan fill="#3fb950">diskusms-site-iota.vercel.app</tspan></text>
  </g>

  <rect x="24" y="505" width="932" height="36" rx="8" fill="#010409" stroke="#21262d"/>
  <text x="40" y="528" font-family="ui-monospace,Consolas,monospace" font-size="13">
    <tspan fill="#f78166">GitHub Stats:</tspan>
    <tspan fill="#8b949e">  Mode </tspan><tspan fill="#a371f7">VIBE+AI</tspan>
    <tspan fill="#8b949e">  ·  Diff </tspan><tspan fill="#3fb950">+ideas</tspan><tspan fill="#8b949e">/</tspan><tspan fill="#f85149">-noise</tspan>
    <tspan fill="#8b949e">  ·  Avatar </tspan><tspan fill="#00ff9d">ASCII_CAT</tspan>
  </text>
</svg>
`;

fs.writeFileSync(path.join(dir, "neofetch.svg"), svg);
console.log("ok", lines.length, "x", lines[0].length);
