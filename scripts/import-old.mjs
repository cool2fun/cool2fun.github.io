// One-off import: pull games from the old Astro site's markdown collection
// that aren't already in this site, write them to data/imported.json, and
// copy their PNG thumbnails into thumbs/.
// Run: node scripts/import-old.mjs
import { readFileSync, readdirSync, existsSync, copyFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { slugify } from "./games.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OLD = "C:/Users/ngocl/Documents/GitHub/cool2fun.github.io";
const MD_DIR = join(OLD, "src/content/games");
const IMG_DIR = join(OLD, "public/images");
const THUMBS = join(ROOT, "thumbs");

function field(text, key) {
  const m = text.match(new RegExp(key + ':\\s*"?([^"\\n]+)"?'));
  return m ? m[1].trim() : "";
}

function main() {
  const current = new Set(JSON.parse(readFileSync(join(ROOT, "games.json"))).map((g) => g.slug));
  const files = readdirSync(MD_DIR).filter((f) => f.endsWith(".md"));

  const imported = [];
  let copied = 0;
  for (const f of files) {
    const text = readFileSync(join(MD_DIR, f), "utf8");
    const name = field(text, "name");
    const src = field(text, "src");
    const slug = field(text, "slug") || slugify(f.replace(/\.md$/, ""));
    if (!name || !src) continue;
    if (current.has(slug)) continue; // already on the site

    imported.push({ name, url: src, type: "iframe" });

    // Copy thumbnail if present (old site uses <slug>.png).
    const png = join(IMG_DIR, slug + ".png");
    if (existsSync(png)) {
      copyFileSync(png, join(THUMBS, slug + ".png"));
      copied++;
    }
  }

  writeFileSync(join(ROOT, "data", "imported.json"), JSON.stringify(imported, null, 2));
  console.log(`Imported ${imported.length} new games, copied ${copied} thumbnails (.png).`);
}

main();
