/*
 * Shared Ruffle player + AdSense H5 pre-roll overlay.
 * Reads game metadata from #play-frame data-* attributes:
 *   data-type  = "single" | "multi" | "iframe"
 *   data-url   = .swf URL                        (single)
 *   data-base  = jsDelivr base URL               (multi, parts + manifest.json)
 *   data-parts = comma-joined absolute part URLs (multi, no manifest)
 *   data-title
 */
(function () {
  "use strict";

  // ---- AdSense config (pub-6556788076088846) ----
  var AD_CLIENT = "ca-pub-6556788076088846";
  var AD_SLOT = "9406916186";   // 300x250 pre-roll unit
  var AD_SHOW_MS = 5000;        // auto-start the game after this many ms

  var frame = document.getElementById("play-frame");
  if (!frame) return;

  var type = frame.getAttribute("data-type");
  var url = frame.getAttribute("data-url");
  var base = frame.getAttribute("data-base");
  var partsAttr = frame.getAttribute("data-parts");
  var started = false;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---- Ruffle boot ----
  function createRufflePlayer() {
    var ruffle = window.RufflePlayer.newest();
    var player = ruffle.createPlayer();
    player.config = {
      autoplay: "on",
      unmuteOverlay: "visible",
      logLevel: "error",
      scale: "showAll",
      letterbox: "on",
      contextMenu: "off",
      splashScreen: true,
    };
    return player;
  }

  function mountPlayer() {
    var player = createRufflePlayer();
    frame.innerHTML = "";
    frame.appendChild(player);
    return player;
  }

  // ---- Loaders ----
  function loadSingle() {
    var player = mountPlayer();
    player.ruffle().load({ url: url }).catch(showError);
  }

  // -- Progress + combine helpers shared by both multi loaders --
  function createProgress() {
    var wrap = el("div", "load-progress");
    var bar = el("div", "load-bar");
    var label = el("p", "load-label", "Loading game… 0%");
    wrap.appendChild(bar);
    frame.innerHTML = "";
    frame.appendChild(wrap);
    frame.appendChild(label);
    return {
      update: function (pct) {
        bar.style.width = pct + "%";
        label.textContent = "Loading game… " + pct + "%";
      },
    };
  }

  function combineChunks(chunks, totalLen) {
    var out = new Uint8Array(totalLen);
    var off = 0;
    for (var k = 0; k < chunks.length; k++) {
      out.set(chunks[k], off);
      off += chunks[k].length;
    }
    return out.buffer;
  }

  // New path: explicit absolute part URLs via data-parts.
  function loadMultiFromParts(urls) {
    var progress = createProgress();
    var chunks = [];
    var loaded = 0;
    var i = 0;

    function next() {
      if (i >= urls.length) return combineChunks(chunks, loaded);
      return fetch(urls[i])
        .then(function (r) {
          if (!r.ok) throw new Error("part HTTP " + r.status);
          return r.arrayBuffer();
        })
        .then(function (buf) {
          var arr = new Uint8Array(buf);
          chunks.push(arr);
          loaded += arr.length;
          progress.update(Math.round(((i + 1) / urls.length) * 100));
          i++;
          return next();
        });
    }

    Promise.resolve()
      .then(next)
      .then(function (buffer) {
        var player = mountPlayer();
        player.ruffle().load({ data: buffer }).catch(showError);
      })
      .catch(showError);
  }

  // Legacy path: base + manifest.json listing relative part names.
  function loadMultiFromManifest() {
    var progress = createProgress();
    var manifestUrl = base.replace(/\/?$/, "/") + "manifest.json";

    fetch(manifestUrl)
      .then(function (r) {
        if (!r.ok) throw new Error("manifest HTTP " + r.status);
        return r.json();
      })
      .then(function (manifest) {
        return fetchParts(manifest, base, function (pct) {
          progress.update(pct);
        });
      })
      .then(function (buffer) {
        var player = mountPlayer();
        player.ruffle().load({ data: buffer }).catch(showError);
      })
      .catch(showError);
  }

  function loadMulti() {
    if (partsAttr) {
      var urls = partsAttr.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      if (urls.length) return loadMultiFromParts(urls);
    }
    // Fallback to legacy manifest path when data-parts is absent.
    return loadMultiFromManifest();
  }

  function fetchParts(manifest, baseUrl, onProgress) {
    var b = baseUrl.replace(/\/?$/, "/");
    var parts = manifest.parts || [];
    var total = manifest.totalSize || 0;
    var chunks = [];
    var loaded = 0;
    var i = 0;

    function next() {
      if (i >= parts.length) return combineChunks(chunks, loaded);
      return fetch(b + parts[i])
        .then(function (r) {
          if (!r.ok) throw new Error("part HTTP " + r.status);
          return r.arrayBuffer();
        })
        .then(function (buf) {
          var arr = new Uint8Array(buf);
          chunks.push(arr);
          loaded += arr.length;
          if (total) onProgress(Math.min(99, Math.round((loaded / total) * 100)));
          i++;
          return next();
        });
    }
    return Promise.resolve().then(next);
  }

  function showError(err) {
    frame.innerHTML = "";
    var box = el("div", "play-error");
    box.appendChild(el("p", null, "Sorry, this game failed to load."));
    box.appendChild(el("p", "muted", String(err && err.message ? err.message : err)));
    frame.appendChild(box);
  }

  function loadIframe() {
    frame.innerHTML = "";
    var iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.setAttribute("allow", "autoplay; fullscreen; gamepad; microphone; camera");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("title", frame.getAttribute("data-title") || "Game");
    frame.appendChild(iframe);
  }

  function startGame() {
    if (started) return;
    started = true;
    if (type === "iframe") loadIframe();
    else if (type === "multi") loadMulti();
    else loadSingle();
  }

  // ---- AdSense H5 pre-roll overlay ----
  function buildAdOverlay(splash) {
    var overlay = el("div", "ads-overlay");
    var adWrap = el("div", "ad-wrap");
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "inline-block";
    ins.style.width = "300px";
    ins.style.height = "250px";
    ins.setAttribute("data-ad-client", AD_CLIENT);
    ins.setAttribute("data-ad-slot", AD_SLOT);
    adWrap.appendChild(ins);

    var status = el("p", "ad-status", "Quảng cáo");
    var skipBtn = el("button", "btn ad-skip", "Bỏ qua");
    skipBtn.type = "button";

    overlay.appendChild(adWrap);
    overlay.appendChild(status);
    overlay.appendChild(skipBtn);
    frame.appendChild(overlay);
    splash.remove();

    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      overlay.remove();
      startGame(); // sets started = true internally
    }

    skipBtn.addEventListener("click", finish);
    var timer = setTimeout(finish, AD_SHOW_MS);

    // Tell AdSense to fill the newly inserted <ins> unit.
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}

    return { cancel: function () { clearTimeout(timer); } };
  }

  function buildOverlay() {
    var splash = el("div", "play-splash");
    var playBtn = el("button", "btn overlay-play", "Play Game");
    var status = el("p", "overlay-status", "Click Play Game to start");
    playBtn.type = "button";
    splash.appendChild(playBtn);
    splash.appendChild(status);
    frame.appendChild(splash);

    playBtn.addEventListener("click", function () {
      playBtn.disabled = true;
      status.textContent = "Loading advertisement…";
      buildAdOverlay(splash);
    });
  }

  // ---- Toolbar buttons ----
  function wireToolbar() {
    var fsBtn = document.getElementById("fullscreen-btn");
    if (fsBtn) {
      fsBtn.addEventListener("click", function () {
        if (!document.fullscreenElement) frame.requestFullscreen && frame.requestFullscreen();
        else document.exitFullscreen && document.exitFullscreen();
      });
    }
    var restartBtn = document.getElementById("restart-btn");
    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        started = false;
        frame.innerHTML = "";
        buildOverlay();
      });
    }
  }

  function init() {
    wireToolbar();
    buildOverlay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
