/**
 * Service worker — precache & fallback theo file thật trong repo (không dùng đường dẫn Y8 cũ có dấu cách/.gz).
 * CDN_BASE: đặt URL gốc nếu muốn mirror khi local 404 (ví dụ CDN game); để rỗng = chỉ origin.
 */
const CDN_BASE = "";

const PRECACHE = [
  "index.html",
  "ads.js",
  "vendor/prevent-keys.js",
  "Build/CSDust.loader.js",
  "Build/build.framework.js",
  "Build/webgl.data",
  "Build/build.wasm",
  "TemplateData/progress-bar-empty-dark.png",
  "TemplateData/progress-bar-full-dark.png",
  "TemplateData/unity-logo-dark.png",
];

const MOUNT_PREFIX = "";

function stripMount(pathname) {
  const m = MOUNT_PREFIX;
  if (!m) return pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (pathname === m || pathname === m + "/") return "";
  const prefix = m.endsWith("/") ? m : m + "/";
  if (pathname.startsWith(prefix)) return pathname.slice(prefix.length).replace(/^\//, "");
  return pathname.startsWith("/") ? pathname.slice(1) : pathname;
}

function shouldHandle(pathname) {
  const rel = stripMount(pathname);
  if (!rel || rel === "index.html") return false;
  if (rel === "unity-offline-sw.js" || rel === "unity-sw-register.js") return false;
  if (rel.startsWith("Build/") || rel.startsWith("TemplateData/") || rel.startsWith("StreamingAssets/"))
    return true;
  if (rel.startsWith("vendor/")) return true;
  return PRECACHE.indexOf(rel) !== -1;
}

function cdnUrlForRel(rel) {
  if (!CDN_BASE || !String(CDN_BASE).trim()) return "";
  const b = CDN_BASE.endsWith("/") ? CDN_BASE : CDN_BASE + "/";
  return b + rel.replace(/^\//, "");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("unity-mirror-v3").then((cache) =>
      Promise.all(
        PRECACHE.map((p) =>
          cache.add(new URL(p, self.location).toString()).catch(() => {
            /* file chưa upload (wasm/data/png) — bỏ qua, không spam lặp */
          })
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k === "unity-mirror-v1" || k === "unity-mirror-v2")
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") return;
  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (!shouldHandle(url.pathname)) return;

  event.respondWith(
    (async () => {
      const rel = stripMount(url.pathname);
      const localReq = req;
      try {
        const res = await fetch(localReq);
        if (res && res.ok) return res;
      } catch (e) {}
      const cdn = cdnUrlForRel(rel);
      if (cdn) {
        try {
          const fromCdn = await fetch(cdn, { mode: "cors", credentials: "omit" });
          if (fromCdn && fromCdn.ok) {
            const copy = fromCdn.clone();
            caches.open("unity-mirror-v3").then((c) => c.put(localReq, copy));
            return fromCdn;
          }
        } catch (e) {}
      }
      try {
        const cached = await caches.match(localReq);
        if (cached) return cached;
      } catch (e) {}
      return fetch(localReq);
    })()
  );
});
