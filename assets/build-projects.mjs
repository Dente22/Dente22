#!/usr/bin/env node
/**
 * Build assets/projects.svg from GitHub starred repos.
 *
 * Env:
 *   GITHUB_TOKEN / GH_TOKEN  — optional, higher rate limit
 *   GITHUB_USER              — default: Dente22
 *   PROJECTS_LIMIT           — max cards (default 8)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER = process.env.GITHUB_USER || process.env.GITHUB_REPOSITORY_OWNER || "Dente22";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const LIMIT = Math.max(1, Math.min(12, Number(process.env.PROJECTS_LIMIT || 8)));

const ACCENTS = ["#ff1744", "#58a6ff", "#8b5cf6", "#00ff9d", "#f78166", "#a371f7", "#ff9f1c", "#2dd4bf"];

const FALLBACK = [
  {
    href: `https://github.com/${USER}?tab=stars`,
    title: `${USER} · stars`,
    name: "NO_STARS_YET",
    desc: "star repos → they show up here",
    tags: ["GitHub", "Stars", "Soon"],
    accent: "#8b5cf6",
  },
];

function escapeXml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(s, n) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).trimEnd()}…`;
}

function prettyName(repoName) {
  const raw = String(repoName || "repo");
  // Long kebab names → first token as brand (Resona-music-nearby → Resona)
  if (raw.includes("-") && raw.length > 16) {
    return raw.split("-")[0].replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return raw.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function tagsFor(repo) {
  const tags = [];
  if (repo.language) tags.push(String(repo.language));
  for (const topic of repo.topics || []) {
    if (tags.length >= 3) break;
    const t = String(topic);
    if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) tags.push(t);
  }
  if (tags.length < 3 && repo.stargazers_count != null) {
    tags.push(`★ ${repo.stargazers_count}`);
  }
  while (tags.length < 3) tags.push(["Open", "Source", "GitHub"][tags.length]);
  return tags.slice(0, 3).map((t) => truncate(t, 12));
}

async function fetchStarred(login) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dente22-build-projects",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const url = `https://api.github.com/users/${encodeURIComponent(login)}/starred?per_page=${LIMIT}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub starred ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function mapRepo(repo, i) {
  const homepage = typeof repo.homepage === "string" ? repo.homepage.trim() : "";
  const href =
    homepage && /^https?:\/\//i.test(homepage) && !/(^|\.)github\.com$/i.test(new URL(homepage).hostname)
      ? homepage
      : repo.html_url;
  const desc =
    truncate(repo.description, 56) ||
    `${repo.language || "repo"} · starred on GitHub`;

  return {
    href,
    title: repo.full_name,
    name: truncate(prettyName(repo.name), 28),
    desc,
    tags: tagsFor(repo),
    accent: ACCENTS[i % ACCENTS.length],
  };
}

function card(p, i) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 16 + col * 574;
  const y = 48 + row * 180;
  const tags = p.tags
    .map(
      (t, ti) =>
        `<rect x="${16 + ti * 92}" y="118" width="84" height="24" rx="12" fill="rgba(139,92,246,0.18)" stroke="${p.accent}" stroke-opacity="0.45"/>
         <text x="${58 + ti * 92}" y="134" text-anchor="middle" font-size="11" fill="#e6edf3">${escapeXml(t)}</text>`,
    )
    .join("\n");

  return `<a href="${escapeXml(p.href)}" target="_blank">
  <g transform="translate(${x},${y})">
    <rect width="558" height="164" rx="14" fill="#010409" stroke="${p.accent}" stroke-opacity="0.45">
      <animate attributeName="stroke-opacity" values="0.35;0.85;0.35" dur="4.5s" repeatCount="indefinite"/>
    </rect>
    <rect width="558" height="32" rx="14" fill="#0d1117"/>
    <rect y="18" width="558" height="14" fill="#0d1117"/>
    <line x1="0" y1="32" x2="558" y2="32" stroke="rgba(255,255,255,0.08)"/>
    <text x="16" y="21" font-size="11" fill="#8b949e"><tspan fill="${p.accent}">&#8226;</tspan> ${escapeXml(p.title)}</text>
    <circle cx="538" cy="16" r="3.5" fill="${p.accent}">
      <animate attributeName="opacity" values="1;0.25;1" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <text x="16" y="64" font-size="22" font-weight="700" fill="#e6edf3">${escapeXml(p.name)}</text>
    <text x="16" y="92" font-size="14" fill="#8b949e">${escapeXml(p.desc)}</text>
    ${tags}
  </g>
</a>`;
}

function renderSvg(projects) {
  const rows = Math.ceil(projects.length / 2);
  const height = 48 + rows * 180;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1180" height="${height}" viewBox="0 0 1180 ${height}" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" role="img" aria-label="Starred projects">
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
  <rect width="1180" height="${height}" fill="#0d1117"/>
  <text x="16" y="24" font-size="12" letter-spacing="2" fill="#58a6ff">PROJECTS.LIST</text>
  <text x="150" y="24" font-size="11" fill="#484f58">./projects.sh --starred</text>
  <line x1="16" y1="34" x2="1164" y2="34" stroke="url(#acc)" stroke-width="1.5" opacity="0.8"/>
${projects.map(card).join("\n")}
</svg>
`;
}

async function main() {
  let projects = FALLBACK;
  try {
    const starred = await fetchStarred(USER);
    if (Array.isArray(starred) && starred.length > 0) {
      projects = starred.slice(0, LIMIT).map(mapRepo);
      console.log(`fetched ${projects.length} starred repo(s) for @${USER}`);
    } else {
      console.log(`no starred repos for @${USER} — using fallback card`);
    }
  } catch (err) {
    console.warn(`warn: starred fetch failed (${err.message}) — using fallback`);
  }

  const svg = renderSvg(projects);
  const out = path.join(__dirname, "projects.svg");
  fs.writeFileSync(out, svg);
  console.log("wrote projects.svg", projects.length, "cards");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
