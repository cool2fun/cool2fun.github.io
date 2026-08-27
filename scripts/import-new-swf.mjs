// One-off migration: rebuild data/_all_games.json from the new SWF URL maps
// in C:\Users\ngocl\Desktop\new-game-swf\github-upload.
//   - cdn-mapping.json           -> 287 small single-file SWF games
//   - xml-cdn-mapping.json       -> authoritative name list for those 287
//   - larger-xml-cdn-mapping.json -> 23 large games; their XMLs list part URLs
//     which we store as { type: "multi", parts: [...] }
// Run: node scripts/import-new-swf.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = "C:\\Users\\ngocl\\Desktop\\new-game-swf\\github-upload";

// jsDelivr requires apostrophes to be percent-encoded.
const encodePath = (name) => name.replace(/'/g, "%27");

async function main() {
  const cdnMap = JSON.parse(await readFile(join(SRC, "cdn-mapping.json"), "utf8"));
  const xmlMap = JSON.parse(await readFile(join(SRC, "xml-cdn-mapping.json"), "utf8"));
  const largerMap = JSON.parse(await readFile(join(SRC, "larger-xml-cdn-mapping.json"), "utf8"));

  // Index every SWF file by lowercased stem so XML names match regardless
  // of the inconsistent file casing in the repos.
  const swfByStem = new Map();
  for (const repo of cdnMap) {
    for (const file of repo.files) {
      if (!file.toLowerCase().endsWith(".swf")) continue;
      const stem = file.slice(0, -4).toLowerCase();
      swfByStem.set(stem, { file, url: repo.cdn_base + encodePath(file) });
    }
  }

  const games = [];
  const unmatched = [];
  const used = new Set();

  // --- 287 small games: one entry per XML name ---
  for (const key of Object.keys(xmlMap)) {
    const stem = key.replace(/\.xml$/i, "");
    const hit = swfByStem.get(stem.toLowerCase());
    if (!hit) {
      unmatched.push(stem);
      continue;
    }
    used.add(hit.file);
    games.push({ name: stem, type: "single", url: hit.url });
  }

  // --- 23 large games: fetch each XML and collect its part URLs ---
  for (const [key, xmlUrl] of Object.entries(largerMap)) {
    const stem = key.replace(/\.xml$/i, "");
    const res = await fetch(xmlUrl);
    if (!res.ok) throw new Error(`XML fetch failed for ${stem}: HTTP ${res.status}`);
    const xml = await res.text();

    const parts = [...xml.matchAll(/<part[^>]*url="([^"]+)"/g)].map((m) => m[1]);
    if (parts.length > 0) {
      games.push({ name: stem, type: "multi", parts });
      continue;
    }
    // Fallback: XML declares a single movie url.
    const movie = xml.match(/<movie[^>]*url="([^"]+)"/);
    if (movie) {
      games.push({ name: stem, type: "single", url: movie[1] });
      continue;
    }
    throw new Error(`No part/movie URLs found in XML for ${stem}`);
  }

  games.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  await writeFile(join(ROOT, "data", "_all_games.json"), JSON.stringify(games, null, 2) + "\n", "utf8");

  const singles = games.filter((g) => g.type === "single").length;
  const multis = games.filter((g) => g.type === "multi").length;
  console.log(`Wrote ${games.length} games (${singles} single, ${multis} multi) to data/_all_games.json`);
  if (unmatched.length) {
    console.warn(`XML names with no matching SWF file: ${unmatched.join(", ")}`);
  }
  const unused = [...swfByStem.values()].filter((v) => !used.has(v.file)).map((v) => v.file);
  if (unused.length) {
    console.warn(`SWF files not referenced by any XML name: ${unused.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
