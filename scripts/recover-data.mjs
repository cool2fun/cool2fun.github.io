// Recover the source dataset from the already-generated game/*.html files
// (the original data/_all_games.json and data/data.csv were deleted).
// Splits records back into:
//   data/_all_games.json  (Flash: single/multi)
//   data/imported.json    (iframe games; merged with existing if present)
// Run: node scripts/recover-data.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GAME_DIR = join(ROOT, "game");

function attr(html, name) {
  const m = html.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : "";
}

function title(html) {
  // <span aria-current="page">Title</span> in the breadcrumb
  const m = html.match(/aria-current="page">([^<]+)</);
  if (m) return m[1].trim();
  const h1 = html.match(/<h1>([^<]+)<\/h1>/);
  return h1 ? h1[1].trim() : "";
}

const flash = [];
const iframe = [];

for (const f of readdirSync(GAME_DIR).filter((x) => x.endsWith(".html"))) {
  const html = readFileSync(join(GAME_DIR, f), "utf8");
  const frame = (html.match(/<div class="play-frame"[^>]*>/) || [""])[0];
  const type = attr(frame, "data-type");
  const name = title(html);
  if (!type || !name) continue;

  if (type === "iframe") {
    iframe.push({ name, url: attr(frame, "data-url"), type: "iframe" });
  } else if (type === "multi") {
    flash.push({ name, type: "multi", base: attr(frame, "data-base") });
  } else {
    flash.push({ name, type: "single", url: attr(frame, "data-url") });
  }
}

writeFileSync(join(ROOT, "data", "_all_games.json"), JSON.stringify(flash, null, 2));

// Write recovered iframe games (dedupe by name so distinct games that happen
// to share a host URL are all kept).
const impPath = join(ROOT, "data", "imported.json");
const byName = new Map();
for (const g of iframe) if (!byName.has(g.name)) byName.set(g.name, g);
writeFileSync(impPath, JSON.stringify([...byName.values()], null, 2));

console.log(`Recovered ${flash.length} Flash games -> _all_games.json`);
console.log(`Recovered ${iframe.length} iframe games -> imported.json (${byName.size} total)`);
