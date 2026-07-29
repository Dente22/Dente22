#!/usr/bin/env node
/**
 * Post-process Platane/snk SVGs:
 * - expand snake path so it visits every grid cell (16px steps) — smoother motion
 * - duration grows with path length (and a bit with yearly active days)
 * - freeze entirely when the current calendar month has 0 contribution days
 *
 * Usage: node scripts/tune-snake.mjs dist/*.svg
 * Env: GITHUB_TOKEN (optional), GITHUB_USER (default Dente22)
 */

import fs from "node:fs/promises";
import path from "node:path";

const USER = process.env.GITHUB_USER || process.env.GITHUB_REPOSITORY_OWNER || "Dente22";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const CELL = 16;
const MS_PER_CELL = 95; // base time spent on each cell
const BODY_SEGMENTS = 4; // s0..s3

async function fetchContributionDays(login) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "dente22-tune-snake",
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables: { login } }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  const days = weeks.flatMap((w) => w.contributionDays ?? []);
  return days.map((d) => ({
    date: d.date,
    count: Number(d.contributionCount) || 0,
  }));
}

function summarizeActivity(days) {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  let yearActive = 0;
  let monthActive = 0;
  let yearTotal = 0;

  for (const day of days) {
    if (day.count <= 0) continue;
    yearActive += 1;
    yearTotal += day.count;
    if (String(day.date).startsWith(ym)) monthActive += 1;
  }

  return { yearActive, monthActive, yearTotal, monthKey: ym };
}

function freezeSvg(svg) {
  let out = svg.replace(/animation-name\s*:\s*[^;}]+;?/gi, "animation-name:none;");
  out = out.replace(/animation\s*:\s*[^;}]+;/gi, "animation:none;");
  return out;
}

function rewriteDuration(svg, durationMs) {
  return svg
    .replace(/(\d+(?:\.\d+)?)ms(\s+linear\s+infinite)/gi, `${durationMs}ms$2`)
    .replace(/(linear\s+)(\d+(?:\.\d+)?)ms(\s+infinite)/gi, `$1${durationMs}ms$3`);
}

function parseTranslateSteps(body) {
  const steps = [];
  const re =
    /([\d.,%\s]+)\s*\{\s*transform:translate\((-?\d+(?:\.\d+)?)px,(-?\d+(?:\.\d+)?)px\)\s*\}/g;
  let m;
  while ((m = re.exec(body))) {
    const x = Number(m[2]);
    const y = Number(m[3]);
    const pcts = String(m[1])
      .split(",")
      .map((p) => Number(String(p).replace(/%/g, "").trim()))
      .filter((n) => !Number.isNaN(n));
    for (const pct of pcts) steps.push({ pct, x, y });
  }
  steps.sort((a, b) => a.pct - b.pct);
  return steps;
}

/** Walk from A→B one cell at a time (axis-aligned: X then Y). */
function cellsBetween(a, b) {
  const out = [];
  let x = a.x;
  let y = a.y;

  while (x !== b.x) {
    const remain = b.x - x;
    x += Math.abs(remain) <= CELL ? remain : Math.sign(remain) * CELL;
    out.push({ x, y });
  }
  while (y !== b.y) {
    const remain = b.y - y;
    y += Math.abs(remain) <= CELL ? remain : Math.sign(remain) * CELL;
    out.push({ x, y });
  }
  return out;
}

function densifyWaypoints(waypoints) {
  if (waypoints.length === 0) return [];
  const path = [{ x: waypoints[0].x, y: waypoints[0].y }];
  for (let i = 1; i < waypoints.length; i++) {
    const next = waypoints[i];
    const prev = path[path.length - 1];
    if (prev.x === next.x && prev.y === next.y) continue;
    // If already adjacent (or off-grid hop ≤ CELL), just append
    const dx = Math.abs(next.x - prev.x);
    const dy = Math.abs(next.y - prev.y);
    if (dx + dy <= CELL) {
      path.push({ x: next.x, y: next.y });
      continue;
    }
    for (const p of cellsBetween(prev, next)) {
      const last = path[path.length - 1];
      if (last.x === p.x && last.y === p.y) continue;
      path.push(p);
    }
  }
  return path;
}

function pct(i, n) {
  if (n <= 1) return 0;
  return +((i / (n - 1)) * 99.2).toFixed(2);
}

function buildKeyframeBody(points) {
  // Spread path across 0..98%, then snap back to start at 99.2% for a clean loop.
  const rules = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const at = n <= 1 ? 0 : +((i / Math.max(1, n - 1)) * 98).toFixed(2);
    rules.push(`${at}%{transform:translate(${p.x}px,${p.y}px)}`);
  }
  const first = points[0];
  rules.push(`99.2%{transform:translate(${first.x}px,${first.y}px)}`);
  return rules.join("");
}

/**
 * Expand s0..s3 to cell-by-cell paths.
 * Body segments trail the head by 1 cell each.
 * Contribution flashes (cN) remapped to when the head reaches that cell.
 * Progress bar (u0) remapped to path progress.
 */
function densifySnakeSvg(svg) {
  const s0Match = svg.match(/@keyframes s0\{((?:[^{}]|\{[^}]*\})*)\}/);
  if (!s0Match) return { svg, steps: 0 };

  const raw = parseTranslateSteps(s0Match[1]);
  // Drop duplicate loop endpoint if present as second copy of start at high %
  const waypoints = [];
  for (const step of raw) {
    if (step.pct >= 99) continue; // loop close handled later
    const last = waypoints[waypoints.length - 1];
    if (last && last.x === step.x && last.y === step.y) continue;
    waypoints.push({ x: step.x, y: step.y });
  }

  const dense = densifyWaypoints(waypoints);
  if (dense.length < 2) return { svg, steps: dense.length };

  // Rebuild s0..s3
  let out = svg;
  for (let seg = 0; seg < BODY_SEGMENTS; seg++) {
    const shifted = dense.map((_, i) => {
      const src = Math.max(0, i - seg);
      return dense[src];
    });
    const body = buildKeyframeBody(shifted);
    const re = new RegExp(`@keyframes s${seg}\\{((?:[^{}]|\\{[^}]*\\})*)\\}`);
    if (re.test(out)) {
      out = out.replace(re, `@keyframes s${seg}{${body}}`);
    }
  }

  // Remap contribution eats: match cell rect positions to snake translates
  // Cell at (2+col*16, 2+row*16) ≈ snake translate (col*16, row*16)
  const cellRe =
    /<rect class="c c(\d+)"[^>]*\bx="(-?\d+(?:\.\d+)?)"[^>]*\by="(-?\d+(?:\.\d+)?)"[^>]*\/?>|<rect class="c c(\d+)"[^>]*\by="(-?\d+(?:\.\d+)?)"[^>]*\bx="(-?\d+(?:\.\d+)?)"[^>]*\/?>/g;
  const eats = [];
  let cm;
  while ((cm = cellRe.exec(svg))) {
    const id = Number(cm[1] ?? cm[4]);
    const x = Number(cm[2] ?? cm[6]);
    const y = Number(cm[3] ?? cm[5]);
    // convert cell pixel to snake translate approx
    const sx = Math.round((x - 2) / CELL) * CELL;
    const sy = Math.round((y - 2) / CELL) * CELL;
    eats.push({ id, sx, sy });
  }

  for (const eat of eats) {
    let idx = dense.findIndex((p) => p.x === eat.sx && p.y === eat.sy);
    if (idx < 0) {
      // nearest
      let best = Infinity;
      for (let i = 0; i < dense.length; i++) {
        const d = Math.abs(dense[i].x - eat.sx) + Math.abs(dense[i].y - eat.sy);
        if (d < best) {
          best = d;
          idx = i;
        }
      }
    }
    const at = pct(Math.max(0, idx), dense.length);
    const end = Math.min(99.9, +(at + 0.15).toFixed(2));
    const body = `${at}%{fill:var(--c4)}${end}%,100%{fill:var(--ce)}`;
    const re = new RegExp(`@keyframes c${eat.id}\\{((?:[^{}]|\\{[^}]*\\})*)\\}`);
    if (re.test(out)) {
      out = out.replace(re, `@keyframes c${eat.id}{${body}}`);
    }
  }

  // Progress bar: grow with path index
  const uSteps = [];
  const samples = Math.min(dense.length, 24);
  for (let i = 0; i < samples; i++) {
    const t = i / Math.max(1, samples - 1);
    const at = pct(Math.round(t * (dense.length - 1)), dense.length);
    const scale = t.toFixed(3);
    uSteps.push(`${at}%{transform:scale(${scale},1)}`);
  }
  uSteps.push(`100%{transform:scale(1.000,1)}`);
  out = out.replace(
    /@keyframes u0\{((?:[^{}]|\{[^}]*\})*)\}/,
    `@keyframes u0{${uSteps.join("")}}`,
  );

  return { svg: out, steps: dense.length };
}

function durationForPath(steps, yearActive) {
  // Longer path → longer animation; a bit more time when more active days.
  const activityBoost = 1 + Math.min(0.5, yearActive / 40);
  const ms = Math.round(steps * MS_PER_CELL * activityBoost);
  return Math.min(90000, Math.max(12000, ms));
}

async function tuneFile(filePath, activity) {
  let svg = await fs.readFile(filePath, "utf8");
  const { yearActive, monthActive, monthKey } = activity;

  if (monthActive <= 0) {
    svg = freezeSvg(svg);
    console.log(`❄ ${path.basename(filePath)}: ${monthKey} has 0 active days → frozen`);
  } else {
    const { svg: denseSvg, steps } = densifySnakeSvg(svg);
    svg = denseSvg;
    const dur = durationForPath(Math.max(steps, 1), yearActive);
    svg = rewriteDuration(svg, dur);
    console.log(
      `▶ ${path.basename(filePath)}: cells=${steps}, monthActive=${monthActive}, yearActive=${yearActive}, duration=${dur}ms`,
    );
  }

  await fs.writeFile(filePath, svg, "utf8");
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("Usage: node scripts/tune-snake.mjs <svg...>");
    process.exit(1);
  }

  let activity = { yearActive: 0, monthActive: 0, yearTotal: 0, monthKey: "unknown" };
  try {
    const days = await fetchContributionDays(USER);
    activity = summarizeActivity(days);
    console.log(
      `activity @${USER}: yearActive=${activity.yearActive} monthActive=${activity.monthActive} (${activity.monthKey})`,
    );
  } catch (err) {
    console.warn(`warn: could not fetch contributions (${err.message}); inferring from SVG cells`);
    const sample = await fs.readFile(files[0], "utf8");
    const cells = (sample.match(/\bc\.c\d+\b/g) || []).length;
    activity = {
      yearActive: cells,
      monthActive: cells > 0 ? 1 : 0,
      yearTotal: cells,
      monthKey: "fallback",
    };
  }

  for (const file of files) {
    await tuneFile(file, activity);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
