import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projects = [
  {
    href: "https://diskusms-site-iota.vercel.app",
    title: "Dente22/diskusms-site",
    name: "DiskusMS",
    desc: "portfolio � 3D � rock � hacker vibe",
    tags: ["TypeScript", "3D", "Vercel"],
    accent: "#ff1744",
  },
  {
    href: "https://github.com/Dente22/diskusms-music",
    title: "Dente22/diskusms-music",
    name: "diskusms-music",
    desc: "tracks + covers as source of truth",
    tags: ["Sound", "Covers", "Radar"],
    accent: "#00ff9d",
  },
  {
    href: "https://github.com/Dente22/WithYou_bot_public",
    title: "Dente22/WithYou_bot_public",
    name: "WithYou bot",
    desc: "Telegram bot � Python � shipping",
    tags: ["Python", "Telegram", "Bots"],
    accent: "#8b5cf6",
  },
  {
    href: "https://github.com/Dente22",
    title: "Dente22 � vibe coding",
    name: "REBEL_MODE",
    desc: "Sketch ? Jam ? Mix ? Master ? Ship",
    tags: ["Cursor", "AI", "Vibe"],
    accent: "#58a6ff",
  },
];

function card(p, i) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 16 + col * 574;
  const y = 48 + row * 180;
  const tags = p.tags
    .map(
      (t, ti) =>
        `<rect x="${16 + ti * 92}" y="118" width="84" height="24" rx="12" fill="rgba(139,92,246,0.18)" stroke="${p.accent}" stroke-opacity="0.45"/>
         <text x="${58 + ti * 92}" y="134" text-anchor="middle" font-size="11" fill="#e6edf3">${t}</text>`
    )
    .join("\n");

  return `<a href="${p.href}" target="_blank">
  <g transform="translate(${x},${y})">
    <rect width="558" height="164" rx="14" fill="#010409" stroke="${p.accent}" stroke-opacity="0.45">
      <animate attributeName="stroke-opacity" values="0.35;0.85;0.35" dur="4.5s" repeatCount="indefinite"/>
    </rect>
    <rect width="558" height="32" rx="14" fill="#0d1117"/>
    <rect y="18" width="558" height="14" fill="#0d1117"/>
    <line x1="0" y1="32" x2="558" y2="32" stroke="rgba(255,255,255,0.08)"/>
    <text x="16" y="21" font-size="11" fill="#8b949e"><tspan fill="${p.accent}">&#8226;</tspan> ${p.title}</text>
    <circle cx="538" cy="16" r="3.5" fill="${p.accent}">
      <animate attributeName="opacity" values="1;0.25;1" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <text x="16" y="64" font-size="22" font-weight="700" fill="#e6edf3">${p.name}</text>
    <text x="16" y="92" font-size="14" fill="#8b949e">${p.desc}</text>
    ${tags}
  </g>
</a>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1180" height="420" viewBox="0 0 1180 420" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" role="img" aria-label="Projects">
  <defs>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ff1744">
        <animate attributeName="stop-color" values="#ff1744;#8b5cf6;#00ff9d;#ff1744" dur="10s" repeatCount="indefinite"/>
      </stop>
      <stop offset="1" stop-color="#00ff9d">
        <animate attributeName="stop-color" values="#00ff9d;#ff1744;#8b5cf6;#00ff9d" dur="10s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
  </defs>
  <rect width="1180" height="420" fill="#0d1117"/>
  <text x="16" y="24" font-size="12" letter-spacing="2" fill="#58a6ff">PROJECTS.LIST</text>
  <text x="150" y="24" font-size="11" fill="#484f58">./projects.sh --all</text>
  <line x1="16" y1="34" x2="1164" y2="34" stroke="url(#acc)" stroke-width="1.5" opacity="0.8"/>
${projects.map(card).join("\n")}
</svg>
`;

fs.writeFileSync(path.join(__dirname, "projects.svg"), svg);
console.log("wrote projects.svg");
