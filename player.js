/*
 * Shared Ruffle player + IMA VAST pre-roll ad overlay.
 * Reads game metadata from #play-frame data-* attributes:
 *   data-type  = "single" | "multi"
 *   data-url   = .swf URL                        (single)
 *   data-base  = jsDelivr base URL               (multi, parts + manifest.json)
 *   data-parts = comma-joined absolute part URLs (multi, no manifest)
 *   data-title
 */
(function () {
  "use strict";

  var IMA_SDK = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
  var VAST_TAG = "https://pubads.g.doubleclick.net/gampad/ads?iu=/23332761288/cool2fun.github.io/cool2fun.github.io_vast&description_url=https%3A%2F%2Fcool2fun.github.io&tfcd=0&npa=0&sz=400x300%7C640x360%7C640x480&gdfp_req=1&unviewed_position_start=1&output=vast&env=vp&impl=s&vpmute=1";

  var frame = document.getElementById("play-frame");
  if (!frame) return;

  var type = frame.getAttribute("data-type");
  var url = frame.getAttribute("data-url");
  var base = frame.getAttribute("data-base");
  var partsAttr = frame.getAttribute("data-parts");
  var started = false;
  var imaReady = null;

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

  // ---- IMA VAST pre-roll ad overlay ----
  function loadImaSdk() {
    if (window.google && window.google.ima) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      var timer = setTimeout(function () { reject(new Error("IMA SDK timeout")); }, 10000);
      script.src = IMA_SDK;
      script.async = true;
      script.onload = function () { clearTimeout(timer); resolve(); };
      script.onerror = function () { clearTimeout(timer); reject(new Error("IMA SDK failed to load")); };
      document.head.appendChild(script);
    });
  }

  function loadVastAd(splash, status) {
    var stage = el("div", "vast-stage");
    var video = document.createElement("video");
    var adContainer = el("div", "vast-ad-container");
    var finished = false;
    var adsManager = null;

    video.className = "vast-video";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    stage.appendChild(video);
    stage.appendChild(adContainer);
    frame.appendChild(stage);
    splash.remove();

    function finish() {
      if (finished) return;
      finished = true;
      if (adsManager) { try { adsManager.destroy(); } catch (e) {} }
      stage.remove();
      startGame();
    }

    function fail(event) {
      var error = event && event.getError ? event.getError() : event;
      status.textContent = "Advertisement unavailable";
      if (window.console && console.warn && error) console.warn("IMA ad error", error);
      finish();
    }

    (imaReady || loadImaSdk()).then(function () {
      var displayContainer = new google.ima.AdDisplayContainer(adContainer, video);
      var adsLoader = new google.ima.AdsLoader(displayContainer);
      adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, function (event) {
        adsManager = event.getAdsManager(video);
        adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, fail);
        adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, function () { status.textContent = "Advertisement"; });
        adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, finish);
        adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, finish);
        try {
          adsManager.init(stage.clientWidth, stage.clientHeight, google.ima.ViewMode.NORMAL);
          adsManager.start();
        } catch (e) { fail(e); }
      });
      adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, fail);
      displayContainer.initialize();
      var request = new google.ima.AdsRequest();
      request.adTagUrl = VAST_TAG;
      request.linearAdSlotWidth = stage.clientWidth;
      request.linearAdSlotHeight = stage.clientHeight;
      request.nonLinearAdSlotWidth = stage.clientWidth;
      request.nonLinearAdSlotHeight = Math.round(stage.clientHeight * 0.25);
      status.textContent = "Advertisement loading...";
      adsLoader.requestAds(request);
    }).catch(fail);
  }

  function buildOverlay() {
    var splash = el("div", "play-splash");
    var playBtn = el("button", "btn overlay-play", "Play Game");
    var vastStatus = el("p", "overlay-status", "Click Play Game to start");
    playBtn.type = "button";
    splash.appendChild(playBtn);
    splash.appendChild(vastStatus);
    frame.appendChild(splash);

    playBtn.addEventListener("click", function () {
      playBtn.disabled = true;
      loadVastAd(splash, vastStatus);
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
    // Start downloading IMA before the user clicks so initialization remains one-click.
    imaReady = loadImaSdk();
    // Mark the rejection as handled here; the click path still receives it below.
    imaReady.catch(function () {});
    buildOverlay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
