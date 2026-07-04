// Build script: reads data/_all_games.json and generates
//   - game/<slug>.html for every game
//   - games.json (compact list for the home page)
//   - sitemap.xml
// Run: node scripts/build.mjs
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { normalize, CATEGORY_ICONS, parseCsv } from "./games.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITE = "https://cool2fun.github.io";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sidebar() {
  return `    <aside class="sidebar">
      <a class="brand" href="/">
        <img src="/assets/favicon.svg" alt="Cool2Fun logo" width="30" height="30">
        Cool2Fun
      </a>
      <nav aria-label="Game categories">
        <p class="cat-label">Explore</p>
        <div class="cat-nav">
          <a href="/">🏠 Home</a>
          <a href="/#new">✨ New</a>
          <a href="/#popular">🔥 Popular</a>
        </div>
        <p class="cat-label">Categories</p>
        <div class="cat-nav">
          <a href="/?cat=Action">⚔️ Action</a>
          <a href="/?cat=Puzzle">🧩 Puzzle</a>
          <a href="/?cat=Strategy">♟️ Strategy</a>
          <a href="/?cat=Platform">🏃 Platform</a>
          <a href="/?cat=Adventure">🗺️ Adventure</a>
          <a href="/?cat=Cooking">🍔 Cooking</a>
          <a href="/?cat=Arcade">🕹️ Arcade</a>
        </div>
      </nav>
    </aside>`;
}

function footer() {
  return `      <footer class="site-footer">
        <nav class="footer-links" aria-label="Footer">
          <a href="/about.html">About</a>
          <a href="/contact.html">Contact</a>
          <a href="/privacy.html">Privacy Policy</a>
          <a href="/terms.html">Terms &amp; Conditions</a>
        </nav>
        <p>&copy; 2026 Cool2Fun. All rights reserved.</p>
      </footer>`;
}

function thumb(g) {
  const icon = CATEGORY_ICONS[g.category] || "🎮";
  const src = g.thumb || `/thumbs/${g.slug}.jpg`;
  return `<img class="thumb-img" src="${src}" alt="${esc(g.title)}" loading="lazy" width="300" height="225" onerror="this.parentNode.classList.add('no-img');this.remove();"><span class="thumb-emoji" aria-hidden="true">${icon}</span>`;
}

function relatedCards(related) {
  return related
    .map(function (g) {
      return `            <article class="game-card"><a href="/game/${g.slug}.html" aria-label="Play ${esc(g.title)}"><div class="game-thumb">${thumb(g)}</div><div class="game-body"><h3>${esc(g.title)}</h3><span class="tag">${esc(g.category)}</span></div></a></article>`;
    })
    .join("\n");
}

function railItems(related) {
  return related
    .map(function (g) {
      const icon = CATEGORY_ICONS[g.category] || "🎮";
      const src = g.thumb || `/thumbs/${g.slug}.jpg`;
      return `                <li><a href="/game/${g.slug}.html"><span class="rail-thumb"><img class="rail-img" src="${src}" alt="" loading="lazy" width="48" height="48" onerror="this.parentNode.classList.add('no-img');this.remove();"><span class="rail-emoji" aria-hidden="true">${icon}</span></span><span class="rail-info"><strong>${esc(g.title)}</strong><span class="tag">${esc(g.category)}</span></span></a></li>`;
    })
    .join("\n");
}

function gamePage(g, related) {
  const icon = CATEGORY_ICONS[g.category] || "🎮";
  let dataAttrs;
  if (g.type === "multi") dataAttrs = `data-type="multi" data-base="${esc(g.base)}"`;
  else if (g.type === "iframe") dataAttrs = `data-type="iframe" data-url="${esc(g.url)}"`;
  else dataAttrs = `data-type="single" data-url="${esc(g.url)}"`;
  const kind = g.type === "iframe" ? "HTML5" : "Flash";
  const desc = `Play ${g.title} for free on Cool2Fun. A ${kind} ${g.category} game, running right in your browser with no download required.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(g.title)} — Play Online Free | Cool2Fun</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${SITE}/game/${g.slug}.html">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">

  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(g.title)} — Cool2Fun">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${SITE}/game/${g.slug}.html">
  <meta property="og:image" content="${SITE}/assets/favicon.svg">
  <meta name="twitter:card" content="summary_large_image">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": ${JSON.stringify(g.title)},
    "url": "${SITE}/game/${g.slug}.html",
    "description": ${JSON.stringify(desc)},
    "genre": ${JSON.stringify(g.category)},
    "gamePlatform": "Web Browser",
    "applicationCategory": "Game",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  }
  </script>

  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="layout">
${sidebar()}

    <div class="content">
      <main>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/?cat=${encodeURIComponent(g.category)}">${esc(g.category)}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">${esc(g.title)}</span>
        </nav>

        <div class="play-toolbar">
          <h1>${esc(g.title)}</h1>
        </div>

        <div class="game-meta" aria-label="Game info">
          <span class="meta-badge">${icon} ${esc(g.category)}</span>
          <span class="meta-item">🎮 ${kind} game</span>
          <span class="meta-item rating" aria-label="Rated 4.5 out of 5 stars">★★★★<span style="opacity:.4">★</span></span>
          <span class="meta-item">📱 ${g.type === "iframe" ? "Play in browser" : "Powered by Ruffle"}</span>
        </div>

        <div class="play-stage">
          <div class="play-main">
            <div class="play-frame" id="play-frame" ${dataAttrs} data-title="${esc(g.title)}" aria-label="${esc(g.title)} game area"></div>

            <div class="toolbar-actions">
              <button class="btn btn-outline" id="restart-btn" type="button">↻ Restart</button>
              <button class="btn" id="fullscreen-btn" type="button">⛶ Fullscreen</button>
            </div>

            <div class="ad-banner" data-ad="leaderboard" role="complementary" aria-label="Advertisement">
              <span>970 × 250 / 728 × 90</span>
            </div>
          </div>

          <aside class="play-rail" aria-label="Sidebar">
            <div class="ad-slot" data-ad="sidebar" role="complementary" aria-label="Advertisement">
              <span>300 × 600</span>
            </div>

            <section class="rail-games" aria-labelledby="rail-games-heading">
              <h2 id="rail-games-heading">Recommended for you</h2>
              <ul class="rail-list">
${railItems(related)}
              </ul>
            </section>
          </aside>
        </div>

        <article class="play-desc">
          <div class="howto">
            <h3>How to play</h3>
            <ul>
              <li>Click <strong>Play Game</strong> to start. A short ad may show before the game loads.</li>
              <li>Most games use the <span class="key">↑</span> <span class="key">↓</span> <span class="key">←</span> <span class="key">→</span> arrow keys and the mouse.</li>
              <li>Use <strong>Fullscreen</strong> for a bigger view, or <strong>Restart</strong> to reload.</li>
            </ul>
          </div>

          <h2>About ${esc(g.title)}</h2>
          <p>${esc(g.title)} is a ${g.category.toLowerCase()} game you can play right in your
          browser — no plugins, no downloads. Just click play and enjoy.</p>
        </article>

        <section class="related" aria-labelledby="related-heading">
          <h2 id="related-heading">Related games</h2>
          <div class="game-grid">
${relatedCards(related)}
          </div>
        </section>
      </main>

${footer()}
    </div>
  </div>

${g.type === "iframe" ? "" : '  <script src="/ruffle/ruffle.js"></script>\n'}  <script src="/player.js" defer></script>
  <script src="/ads.js" defer></script>
</body>
</html>
`;
}

function pickRelated(all, current, n) {
  const sameCat = all.filter((g) => g.category === current.category && g.slug !== current.slug);
  const pool = sameCat.length >= n ? sameCat : all.filter((g) => g.slug !== current.slug);
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function sitemap(games) {
  const urls = [
    { loc: `${SITE}/`, priority: "1.0" },
    { loc: `${SITE}/about.html`, priority: "0.5" },
    { loc: `${SITE}/contact.html`, priority: "0.5" },
    { loc: `${SITE}/privacy.html`, priority: "0.3" },
    { loc: `${SITE}/terms.html`, priority: "0.3" },
  ].concat(
    games.map((g) => ({ loc: `${SITE}/game/${g.slug}.html`, priority: "0.7" }))
  );
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function main() {
  const rawText = await readFile(join(ROOT, "data", "_all_games.json"), "utf8");
  const raw = JSON.parse(rawText);

  // De-duplicate games that only differ by an apostrophe, e.g.
  // "Papa-S-Sushiria" vs "Papas-Sushiria". Collapse to a key that ignores
  // non-alphanumerics, and prefer the "Papa's" spelling (the "-S-" variant).
  const dedupKey = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hasApostropheForm = (name) => /-s-/i.test(name) || /-s$/i.test(name);

  const chosen = new Map(); // key -> raw item
  for (const item of raw) {
    const key = dedupKey(item.name);
    const existing = chosen.get(key);
    if (!existing) {
      chosen.set(key, item);
    } else if (hasApostropheForm(item.name) && !hasApostropheForm(existing.name)) {
      chosen.set(key, item); // replace with the preferred "Papa's" spelling
    }
  }

  const seen = new Set();
  const games = [];
  for (const item of chosen.values()) {
    const g = normalize(item);
    if (seen.has(g.slug)) continue;
    seen.add(g.slug);
    games.push(g);
  }

  // Merge iframe games from data/data.csv (Google Apps Script + HTML5 links).
  // Existing slugs (from the Flash set) take priority and are skipped.
  const csvPath = join(ROOT, "data", "data.csv");
  if (existsSync(csvPath)) {
    const csvGames = parseCsv(await readFile(csvPath, "utf8"));
    let added = 0;
    for (const item of csvGames) {
      const g = normalize(item);
      if (seen.has(g.slug)) continue;
      seen.add(g.slug);
      games.push(g);
      added++;
    }
    console.log(`Merged ${added} iframe games from data.csv (${csvGames.length} rows).`);
  }

  // Merge games imported from the old Astro site (data/imported.json).
  const importedPath = join(ROOT, "data", "imported.json");
  if (existsSync(importedPath)) {
    const importedGames = JSON.parse(await readFile(importedPath, "utf8"));
    let added = 0;
    for (const item of importedGames) {
      const g = normalize(item);
      if (seen.has(g.slug)) continue;
      seen.add(g.slug);
      games.push(g);
      added++;
    }
    console.log(`Merged ${added} imported games from imported.json.`);
  }

  // Resolve which thumbnail file each game actually has (jpg from capture,
  // png from the old-site import) so the markup points at a real file.
  const thumbsDir = join(ROOT, "thumbs");
  const thumbFiles = new Set(await readdir(thumbsDir).catch(() => []));
  for (const g of games) {
    if (thumbFiles.has(g.slug + ".jpg")) g.thumb = `/thumbs/${g.slug}.jpg`;
    else if (thumbFiles.has(g.slug + ".png")) g.thumb = `/thumbs/${g.slug}.png`;
  }

  const gameDir = join(ROOT, "game");
  await mkdir(gameDir, { recursive: true });

  // Clean previously generated .html in game/ (leave anything else alone).
  const existing = await readdir(gameDir).catch(() => []);
  await Promise.all(
    existing
      .filter((f) => f.endsWith(".html"))
      .map((f) => unlink(join(gameDir, f)).catch(() => {}))
  );

  let count = 0;
  for (const g of games) {
    const related = pickRelated(games, g, 4);
    await writeFile(join(gameDir, `${g.slug}.html`), gamePage(g, related), "utf8");
    count++;
  }

  // Compact list for the home page.
  const list = games.map((g) => {
    const o = { slug: g.slug, title: g.title, category: g.category };
    if (g.thumb) o.thumb = g.thumb;
    return o;
  });
  await writeFile(join(ROOT, "games.json"), JSON.stringify(list), "utf8");

  await writeFile(join(ROOT, "sitemap.xml"), sitemap(games), "utf8");

  console.log(`Generated ${count} game pages, games.json (${list.length}), sitemap.xml`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
