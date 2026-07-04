/*
 * Shared Ruffle player + pre-roll ad overlay.
 * Reads game metadata from #play-frame data-* attributes:
 *   data-type = "single" | "multi"
 *   data-url  = .swf URL           (single)
 *   data-base = jsDelivr base URL  (multi, parts + manifest.json)
 *   data-title
 */
(function () {
  "use strict";

  var COUNTDOWN_SECONDS = 5;

  var frame = document.getElementById("play-frame");
  if (!frame) return;

  var type = frame.getAttribute("data-type");
  var url = frame.getAttribute("data-url");
  var base = frame.getAttribute("data-base");
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

  function loadMulti() {
    var progressWrap = el("div", "load-progress");
    var bar = el("div", "load-bar");
    var label = el("p", "load-label", "Loading game… 0%");
    progressWrap.appendChild(bar);
    frame.innerHTML = "";
    frame.appendChild(progressWrap);
    frame.appendChild(label);

    var manifestUrl = base.replace(/\/?$/, "/") + "manifest.json";

    fetch(manifestUrl)
      .then(function (r) {
        if (!r.ok) throw new Error("manifest HTTP " + r.status);
        return r.json();
      })
      .then(function (manifest) {
        return fetchParts(manifest, base, function (pct) {
          bar.style.width = pct + "%";
          label.textContent = "Loading game… " + pct + "%";
        });
      })
      .then(function (buffer) {
        var player = mountPlayer();
        player.ruffle().load({ data: buffer }).catch(showError);
      })
      .catch(showError);
  }

  function fetchParts(manifest, baseUrl, onProgress) {
    var b = baseUrl.replace(/\/?$/, "/");
    var parts = manifest.parts || [];
    var total = manifest.totalSize || 0;
    var chunks = [];
    var loaded = 0;
    var i = 0;

    function next() {
      if (i >= parts.length) {
        var combined = new Uint8Array(loaded);
        var offset = 0;
        for (var k = 0; k < chunks.length; k++) {
          combined.set(chunks[k], offset);
          offset += chunks[k].length;
        }
        return combined.buffer;
      }
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

  // ---- Pre-roll ad overlay ----
  function buildOverlay() {
    var overlay = el("div", "play-overlay");

    var adBox = el("div", "overlay-ad");
    adBox.setAttribute("data-ad", "overlay");
    adBox.setAttribute("role", "complementary");
    adBox.setAttribute("aria-label", "Advertisement");
    adBox.appendChild(el("span", null, "Advertisement"));

    var playBtn = el("button", "btn overlay-play");
    playBtn.type = "button";
    playBtn.textContent = "▶ Play Game";

    var status = el("p", "overlay-status");

    overlay.appendChild(adBox);
    overlay.appendChild(playBtn);
    overlay.appendChild(status);
    frame.appendChild(overlay);

    // Fill the overlay ad unit (also covers overlays rebuilt on Restart).
    if (window.C2FAds && window.C2FAds.refresh) window.C2FAds.refresh(overlay);

    playBtn.addEventListener("click", function () {
      playBtn.disabled = true;
      var remaining = COUNTDOWN_SECONDS;
      status.textContent = "Your game starts in " + remaining + "s…";
      var timer = setInterval(function () {
        remaining--;
        if (remaining > 0) {
          status.textContent = "Your game starts in " + remaining + "s…";
        } else {
          clearInterval(timer);
          overlay.remove();
          startGame();
        }
      }, 1000);
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
