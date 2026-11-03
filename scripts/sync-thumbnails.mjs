// Sync thumbnail URLs from crawl-raw.json into games.json.
//
// Reads crawl-raw.json (raw crawl list: each item has id, href, title,
// category, img, alt) and games.json (compact home-page list:
// {slug, title, category, thumb?}), matches games by slug, and replaces
// `thumb` with the crawl `img` CDN URL when a valid one exists.
//
// Items with an empty title or a null/non-http `img` are treated as junk
// (the tail of crawl-raw.json contains several such placeholder rows) and
// are skipped.
//
// Run: node scripts/sync-thumbnails.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const CRAWL_PATH = join(ROOT, "crawl-raw.json");
const LIST_PATH = join(ROOT, "games.json");

const URL_RE = /^https?:\/\//i;

// Turn "/games/Granny.html" or "games/Granny.html" -> "granny".
function slugFromHref(href) {
  if (!href) return "";
  let p = String(href).trim().replace(/^\/+/, "");
  p = p.replace(/^games\//i, "");
  p = p.replace(/\.html$/i, "");
  return slugify(p);
}

// Fallback slug from `id`, e.g. "Drive-Mad" -> "drive-mad".
function slugFromId(id) {
  if (!id) return "";
  return slugify(String(id).trim());
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isJunk(item) {
  const title = String(item.title || "").trim();
  const img = item.img;
  return title.length === 0 || !URL_RE.test(String(img || ""));
}

async function main() {
  const crawlRaw = JSON.parse(await readFile(CRAWL_PATH, "utf8"));
  if (!Array.isArray(crawlRaw)) {
    throw new Error("crawl-raw.json is not a JSON array");
  }

  // Build slug -> img map from the crawl, skipping junk rows.
  const crawlBySlug = new Map();
  let crawlTotal = 0;
  let crawlJunk = 0;
  let crawlValid = 0;
  for (const item of crawlRaw) {
    crawlTotal++;
    if (isJunk(item)) {
      crawlJunk++;
      continue;
    }
    const slug = slugFromHref(item.href) || slugFromId(item.id);
    if (!slug) continue;
    crawlValid++;
    // First valid occurrence wins.
    if (!crawlBySlug.has(slug)) crawlBySlug.set(slug, String(item.img));
  }

  const listRaw = await readFile(LIST_PATH, "utf8");
  const list = JSON.parse(listRaw);
  if (!Array.isArray(list)) {
    throw new Error("games.json is not a JSON array");
  }
  const listTotal = list.length;

  let matched = 0;
  let updated = 0;
  let alreadyCurrent = 0;
  const unmatched = [];

  for (const g of list) {
    const slug = g.slug;
    const img = crawlBySlug.get(slug);
    if (!img) {
      unmatched.push(slug);
      continue;
    }
    matched++;
    if (g.thumb === img) {
      alreadyCurrent++;
      continue;
    }
    g.thumb = img;
    updated++;
  }

  await writeFile(LIST_PATH, JSON.stringify(list), "utf8");

  console.log(`crawl-raw.json: ${crawlTotal} total items`);
  console.log(`  - ${crawlValid} valid (have title + http(s) img)`);
  console.log(`  - ${crawlJunk} junk rows skipped (empty title or null img)`);
  console.log(`  - ${crawlBySlug.size} distinct slugs indexed`);
  console.log(`games.json: ${listTotal} total items`);
  console.log(`  - ${matched} matched to a crawl thumbnail`);
  console.log(`  - ${updated} thumb values updated`);
  console.log(`  - ${alreadyCurrent} already had the same URL`);
  console.log(`  - ${unmatched.length} items have no counterpart in crawl-raw.json`);

  if (unmatched.length) {
    const preview = unmatched.slice(0, 50);
    console.log(`  unmatched slugs (showing up to 50): ${preview.join(", ")}`);
    if (unmatched.length > 50) console.log(`  ... and ${unmatched.length - 50} more`);
  }

  console.log("Done. games.json updated in place.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
