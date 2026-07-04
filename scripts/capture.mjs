// Capture a thumbnail (first frame) from each Ruffle game via headless Chrome.
// Usage:
//   node scripts/capture.mjs            -> capture all games in games.json
//   node scripts/capture.mjs 5          -> only the first 5 (test run)
//   node scripts/capture.mjs slug-a slug-b  -> only specific slugs
//
// Requires: puppeteer (uses system Chrome via executablePath), a static server
// running at http://localhost:8080 serving the repo root.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = "http://localhost:8080";
const OUT = join(ROOT, "thumbs");

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

async function findChrome() {
  const { existsSync } = await import("node:fs");
  for (const p of CHROME_CANDIDATES) if (existsSync(p)) return p;
  return undefined; // let puppeteer try its bundled browser
}

function parseArgs(games) {
  const args = process.argv.slice(2);
  if (args.length === 0) return games;
  if (args.length === 1 && /^\d+$/.test(args[0])) return games.slice(0, Number(args[0]));
  const set = new Set(args);
  return games.filter((g) => set.has(g.slug));
}

async function main() {
  const games = JSON.parse(await readFile(join(ROOT, "games.json"), "utf8"));
  const targets = parseArgs(games);
  await mkdir(OUT, { recursive: true });

  const executablePath = await findChrome();
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
  });

  let ok = 0, fail = 0;
  for (const g of targets) {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    try {
      await page.goto(`${BASE}/game/${g.slug}.html`, { waitUntil: "load", timeout: 30000 });

      // Auto-start: click the overlay Play button, then wait for Ruffle canvas.
      await page.waitForSelector(".overlay-play", { timeout: 8000 }).catch(() => {});
      await page.evaluate(() => {
        const b = document.querySelector(".overlay-play");
        if (b) b.click();
      });

      // Ruffle renders into a <canvas> inside the <ruffle-player> shadow DOM,
      // so we can't query the canvas directly. Wait for the player element and
      // for its WASM to report an instance, then let the title screen render.
      await page.waitForSelector("#play-frame ruffle-player", { timeout: 25000 });

      // Give the game time to load its SWF and paint the title screen.
      await new Promise((r) => setTimeout(r, 9000));

      const frame = await page.$("#play-frame");
      const buf = await frame.screenshot({ type: "jpeg", quality: 82 });
      await writeFile(join(OUT, `${g.slug}.jpg`), buf);
      ok++;
      console.log(`ok   ${g.slug}`);
    } catch (err) {
      fail++;
      console.log(`FAIL ${g.slug}  (${err.message.split("\n")[0]})`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\nDone. ${ok} captured, ${fail} failed, out of ${targets.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
