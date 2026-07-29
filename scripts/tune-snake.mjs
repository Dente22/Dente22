#!/usr/bin/env node
/**
 * Post-process Platane/snk SVGs:
 * - freeze animation when the current calendar month has 0 contribution days
 * - scale loop duration from yearly active-day count (more days → snappier)
 * - hold still across empty month stretches instead of crawling blank cells
 *
 * Usage: node scripts/tune-snake.mjs dist/*.svg
 * Env: GITHUB_TOKEN (optional), GITHUB_USER (default Dente22)
 */

import fs from "node:fs/promises";
import path from "node:path";

const USER = process.env.GITHUB_USER || process.env.GITHUB_REPOSITORY_OWNER || "Dente22";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

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

/** More active days → shorter loop (snappier). Sparse → slower. */
function durationForActiveDays(yearActive) {
  if (yearActive <= 0) return 12000;
  const ms = Math.round(18000 / Math.sqrt(yearActive));
  return Math.min(20000, Math.max(6000, ms));
}

function freezeSvg(svg) {
  let out = svg.replace(/animation-name\s*:\s*[^;}]+;?/gi, "animation-name:none;");
  out = out.replace(/animation\s*:\s*[^;}]+;/gi, "animation:none;");
  // Park snake segments off-grid / at start pose (first translate in each sN keyframe is fine as static transform already set on .s.sN)
  return out;
}

function rewriteDuration(svg, durationMs) {
  return svg
    .replace(/(\d+(?:\.\d+)?)ms(\s+linear\s+infinite)/gi, `${durationMs}ms$2`)
    .replace(/(linear\s+)(\d+(?:\.\d+)?)ms(\s+infinite)/gi, `$1${durationMs}ms$3`);
}

/**
 * Parse Platane keyframe body into {pct,x,y} steps.
 * Supports both `12.3%{...}` and `0%,99.15%{...}`.
 */
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
  steps.sort((a, b) => a.pct - b.pct || a.x - b.x);
  return steps;
}

/**
 * For snake (.s) keyframes: large horizontal jumps = empty months.
 * Convert linear crawl into hold-then-teleport so the snake "stands" on blank stretches.
 */
function holdAcrossEmptyGaps(svg) {
  return svg.replace(/@keyframes (s\d+)\{((?:[^{}]|\{[^}]*\})*)\}/g, (full, name, body) => {
    const expanded = parseTranslateSteps(body);
    if (expanded.length < 2) return full;

    const JUMP_PX = 48; // ~3 weeks of empty cells
    const out = [];
    for (let i = 0; i < expanded.length; i++) {
      const cur = expanded[i];
      const prev = expanded[i - 1];
      if (prev && Math.abs(cur.x - prev.x) >= JUMP_PX) {
        const holdPct = Math.max(prev.pct, +(cur.pct - 0.05).toFixed(2));
        if (holdPct > prev.pct + 0.001) {
          out.push(`${holdPct}%{transform:translate(${prev.x}px,${prev.y}px)}`);
        }
      }
      out.push(`${cur.pct}%{transform:translate(${cur.x}px,${cur.y}px)}`);
    }

    const seen = new Set();
    const deduped = [];
    for (const rule of out) {
      const key = rule.slice(0, rule.indexOf("{"));
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(rule);
    }

    return `@keyframes ${name}{${deduped.join("")}}`;
  });
}

async function tuneFile(filePath, activity) {
  let svg = await fs.readFile(filePath, "utf8");
  const { yearActive, monthActive, monthKey } = activity;

  if (monthActive <= 0) {
    svg = freezeSvg(svg);
    console.log(`❄ ${path.basename(filePath)}: ${monthKey} has 0 active days → frozen`);
  } else {
    const dur = durationForActiveDays(yearActive);
    svg = rewriteDuration(svg, dur);
    svg = holdAcrossEmptyGaps(svg);
    console.log(
      `▶ ${path.basename(filePath)}: monthActive=${monthActive}, yearActive=${yearActive}, duration=${dur}ms`,
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
    // Fallback: count contribution cells in first SVG
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
