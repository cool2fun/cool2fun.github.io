/**
 * 12 MiniBattles - Google Apps Script WebApp (v3 - cache + save)
 * Splash served at /exec, game frame at /exec?run=1.
 * Single PLAY overlay in splash; game frame auto-boots.
 * Fullscreen on outer stage; resize forwarded into iframe via postMessage.
 * Server cache (CacheService) for splash HTML.
 * Progress save API: google.script.run.saveGameProgress(playerId, data)
 *                    google.script.run.loadGameProgress(playerId)
 */

const APP_CONFIG = {
  TITLE: '12 MiniBattles',
  CACHE_KEY: 'splash_v3_ima',
  CACHE_TTL_SECONDS: 21600, // 6 hours max for CacheService
  SAVE_MAX_CHARS: 200000
};

function doGet(e) {
  const isGameFrame = e && e.parameter && e.parameter.run === '1';
  if (isGameFrame) return createGameResponse();
  return createSplashResponse();
}

function createGameResponse() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_CONFIG.TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function createSplashResponse() {
  const cache = CacheService.getScriptCache();
  let html = null;
  try { html = cache.get(APP_CONFIG.CACHE_KEY); } catch (_) {}
  if (!html) {
    const gameUrl = ScriptApp.getService().getUrl() + '?run=1';
    html = buildSplashHtml(gameUrl, APP_CONFIG.TITLE);
    try { cache.put(APP_CONFIG.CACHE_KEY, html, APP_CONFIG.CACHE_TTL_SECONDS); } catch (_) {}
  }
  return HtmlService.createHtmlOutput(html)
    .setTitle(APP_CONFIG.TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Splash shell — single PLAY + Fullscreen UI. Game frame inside iframe has no overlay/controls.
 */
function buildLegacySplashHtml(gameUrl, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg-color: #0f172a;
      --card-color: #1e293b;
      --accent-color: #facc15;
      --accent-hover: #eab308;
      --text-color: #ffffff;
      --radius: 8px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; background: transparent; }
    body {
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      background: transparent;
      font-family: Arial, sans-serif;
      color: var(--text-color);
      display: flex;
      flex-direction: column;
      padding: 5px;
    }
    .stage {
      position: relative;
      flex: 1;
      min-height: 0;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      border: 3px solid #334155;
      border-radius: var(--radius);
      display: flex;
    }
    .stage iframe {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      background: #000;
    }
    .stage.expanded {
      position: fixed;
      inset: 0;
      z-index: 99999;
      border: none;
      border-radius: 0;
    }
    .overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      background: var(--card-color);
    }
        .game-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-color);
      text-align: center;
    }
    .play-btn {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 16px 44px;
      font-size: 18px;
      font-weight: bold;
      color: #0f172a;
      background-color: var(--accent-color);
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      transition: transform 0.1s, background-color 0.2s;
      text-transform: uppercase;
    }
    .play-btn:hover { background-color: var(--accent-hover); transform: scale(1.03); }
    .play-btn:active { transform: scale(0.98); }
    .controls {
      display: flex;
      justify-content: flex-end;
      padding-top: 10px;
      background: transparent;
      flex-shrink: 0;
    }
    .fs-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-color);
      background: darkslateblue;
      border: 1px solid #334155;
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .fs-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .fs-btn:not(:disabled):hover { background: var(--accent-color); color: #0f172a; border-color: var(--accent-color); }
    @media (max-width: 480px) {
      body { padding: 6px; }
      .game-title { font-size: 24px; }
      .play-btn { padding: 14px 30px; font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="stage" id="stage">
    <iframe
      id="gameIframe"
      data-src="${escapeHtml(gameUrl)}"
      allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; clipboard-read; clipboard-write; microphone"
      title="${escapeHtml(title)}"
    ></iframe>
    <div class="overlay" id="overlay">
      <h1 class="game-title">${escapeHtml(title)}</h1>
      <button class="play-btn" id="startBtn" type="button" aria-label="Play ${escapeHtml(title)}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
        PLAY NOW
      </button>
    </div>
  </div>
  <div class="controls">
    <button class="fs-btn" id="fsBtn" disabled type="button" aria-label="Toggle fullscreen">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
      </svg>
      <span id="fsText">Fullscreen</span>
    </button>
  </div>
  <script>
    'use strict';
    (function () {
      var stage      = document.getElementById('stage');
      var overlay    = document.getElementById('overlay');
      var startBtn   = document.getElementById('startBtn');
      var gameIframe = document.getElementById('gameIframe');
      var fsBtn      = document.getElementById('fsBtn');
      var fsText     = document.getElementById('fsText');
      var hasStarted = false;

      startBtn.addEventListener('click', function () {
        if (hasStarted) return;
        hasStarted = true;
        var src = gameIframe.getAttribute('data-src');
        if (src) gameIframe.src = src;
        overlay.style.display = 'none';
        fsBtn.disabled = false;
        gameIframe.addEventListener('load', function onLoad() {
          gameIframe.removeEventListener('load', onLoad);
          try { gameIframe.focus(); } catch (_) {}
          // Forward a user gesture into the inner frame so AudioContext can resume
          try {
            var win = gameIframe.contentWindow;
            if (win) {
              try { win.postMessage('splash-v2:resume-audio', '*'); } catch (_) {}
              ['pointerdown','mousedown','touchstart','click'].forEach(function(t){
                try {
                  var ev = new Event(t, {bubbles:true});
                  // Mark as user gesture where possible
                  try { Object.defineProperty(ev, 'isTrusted', {get:function(){return true}}); } catch(_){}
                  win.dispatchEvent(ev);
                } catch(_){}
                try {
                  var doc = win.document;
                  if (doc) {
                    var ev2 = new win.Event(t, {bubbles:true});
                    (doc.body || doc.documentElement).dispatchEvent(ev2);
                  }
                } catch(_){}
              });
            }
          } catch(_){}
          notifyInnerResize();
          // Second resume after inner has initialized
          setTimeout(function(){
            try {
              var w2 = gameIframe.contentWindow;
              if (w2) w2.postMessage('splash-v2:resume-audio', '*');
            } catch(_){}
          }, 800);
        });
      });

      function isExpanded() { return stage.classList.contains('expanded'); }

      function syncLabel() {
        var nativeFs = Boolean(document.fullscreenElement);
        var expanded = isExpanded();
        fsText.textContent = (nativeFs || expanded) ? 'Exit Fullscreen' : 'Fullscreen';
        notifyInnerResize();
      }

      function sendResize() {
        try {
          var win = gameIframe.contentWindow;
          if (win) win.dispatchEvent(new Event('resize'));
        } catch (_) {}
      }

      function notifyInnerResize() {
        setTimeout(function () {
          try {
            var win = gameIframe.contentWindow;
            if (win) {
              try { win.dispatchEvent(new Event('resize')); } catch (_) {}
              try { sendResize(); } catch (_) {}
            }
          } catch (_) {}
          window.dispatchEvent(new Event('resize'));
        }, 60);
        setTimeout(function () {
          try {
            var win2 = gameIframe.contentWindow;
            if (win2) {
              try { win2.dispatchEvent(new Event('resize')); } catch (_) {}
              try { win2.postMessage('splash-v2:resize', '*'); } catch (_) {}
            }
          } catch (_) {}
        }, 300);
      }

      function toggleFullscreen() {
        if (isExpanded()) {
          stage.classList.remove('expanded');
          syncLabel();
          return;
        }
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(function () {});
          return;
        }
        if (stage.requestFullscreen) {
          stage.requestFullscreen().catch(function () {
            stage.classList.add('expanded');
            syncLabel();
          });
        } else {
          stage.classList.add('expanded');
          syncLabel();
        }
      }

      fsBtn.addEventListener('click', toggleFullscreen);
      document.addEventListener('fullscreenchange', syncLabel);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isExpanded()) {
          stage.classList.remove('expanded');
          syncLabel();
        }
      });
      window.addEventListener('resize', notifyInnerResize);
    })();
  </script>
</body>
</html>`;
}

// Splash on the Apps Script origin. IMA runs here, then the game frame is loaded.
function buildSplashHtml(gameUrl, title) {
  const vastTag = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/23332761288/cool2fun.github.io/cool2fun.github.io_vast&description_url=https%3A%2F%2Fcool2fun.github.io&tfcd=0&npa=0&sz=400x300%7C640x360%7C640x480&gdfp_req=1&unviewed_position_start=1&output=vast&env=vp&impl=s&vpmute=1&correlator=';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <script src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #05070a; }
    body { display: flex; flex-direction: column; padding: 5px; font-family: Arial, sans-serif; color: #fff; }
    .stage { position: relative; flex: 1; min-height: 0; overflow: hidden; border: 2px solid #334155; border-radius: 8px; background: #000; }
    #gameFrame, #adStage, #adContainer { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    #gameFrame { display: none; background: #000; }
    #adStage { display: none; place-items: center; background: #111827; }
    #adContainer { z-index: 2; }
    #adVideo { width: 100%; height: 100%; object-fit: contain; background: #000; }
    #adStatus { position: absolute; z-index: 3; inset: auto 0 18px; margin: 0; color: #cbd5e1; text-align: center; }
    #splash { position: absolute; z-index: 5; inset: 0; display: grid; place-items: center; padding: 20px; text-align: center; background: radial-gradient(circle at 50% 35%, #26354c, #0b111b 75%); }
    #splashBox { max-width: 420px; }
    h1 { margin: 0 0 10px; font-size: clamp(24px, 5vw, 38px); }
    p { margin: 0 0 18px; color: #b8c2d1; }
    button { border: 0; border-radius: 8px; padding: 14px 30px; color: #111827; background: #facc15; cursor: pointer; font: 700 17px Arial, sans-serif; }
    button:disabled { cursor: wait; opacity: .65; }
    .controls { display: flex; justify-content: flex-end; padding-top: 8px; }
    #fsBtn { padding: 8px 16px; color: #fff; background: #303b59; font-size: 13px; }
    .expanded { position: fixed !important; inset: 0 !important; z-index: 99999; border: 0; border-radius: 0; }
  </style>
</head>
<body>
  <div class="stage" id="stage">
    <iframe id="gameFrame" allow="autoplay; fullscreen; gamepad; microphone; clipboard-read; clipboard-write" title="${escapeHtml(title)}"></iframe>
    <div id="adStage"><video id="adVideo" playsinline muted></video><div id="adContainer"></div><p id="adStatus">Loading advertisement...</p></div>
    <div id="splash"><div id="splashBox"><h1>${escapeHtml(title)}</h1><p id="status">Click once to watch the ad and play.</p><button id="playBtn" type="button">PLAY NOW</button></div></div>
  </div>
  <div class="controls"><button id="fsBtn" type="button" disabled>Fullscreen</button></div>
  <script>
    (function () {
      'use strict';
      var VAST_TAG = ${JSON.stringify(vastTag)};
      var GAME_URL = ${JSON.stringify(gameUrl)};
      var stage = document.getElementById('stage');
      var splash = document.getElementById('splash');
      var playBtn = document.getElementById('playBtn');
      var status = document.getElementById('status');
      var adStage = document.getElementById('adStage');
      var adContainer = document.getElementById('adContainer');
      var adVideo = document.getElementById('adVideo');
      var adStatus = document.getElementById('adStatus');
      var gameFrame = document.getElementById('gameFrame');
      var fsBtn = document.getElementById('fsBtn');
      var finished = false;
      var activeManager = null;
      var adTimer = null;

      function startGame() {
        if (finished) return;
        finished = true;
        if (adTimer) { clearTimeout(adTimer); adTimer = null; }
        if (activeManager) { try { activeManager.destroy(); } catch (_) {} activeManager = null; }
        adStage.style.display = 'none';
        splash.style.display = 'none';
        gameFrame.src = GAME_URL;
        gameFrame.style.display = 'block';
        fsBtn.disabled = false;
        gameFrame.addEventListener('load', function () {
          try { gameFrame.focus(); } catch (_) {}
          try { gameFrame.contentWindow.postMessage('splash-v2:resume-audio', '*'); } catch (_) {}
          setTimeout(function () { try { gameFrame.contentWindow.postMessage('splash-v2:resize', '*'); } catch (_) {} }, 250);
        }, { once: true });
      }

      function failAd(error) {
        if (window.console && console.warn && error) {
          var details = {
            message: typeof error.getMessage === 'function' ? error.getMessage() : error.message,
            code: typeof error.getErrorCode === 'function' ? error.getErrorCode() : null,
            vastCode: typeof error.getVastErrorCode === 'function' ? error.getVastErrorCode() : null,
            type: typeof error.getType === 'function' ? error.getType() : null
          };
          console.warn('IMA ad error', details, error);
        }
        status.textContent = 'Ad unavailable. Starting game...';
        startGame();
      }

      function requestAd() {
        if (!window.google || !google.ima) return failAd(new Error('IMA SDK unavailable'));
        var display = new google.ima.AdDisplayContainer(adContainer, adVideo);
        var loader = new google.ima.AdsLoader(display);
        loader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, function (e) { failAd(e.getError ? e.getError() : e); });
        loader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, function (e) {
          var manager = e.getAdsManager(adVideo);
          activeManager = manager;
          manager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, function (x) { failAd(x.getError ? x.getError() : x); });
          manager.addEventListener(google.ima.AdEvent.Type.STARTED, function () { adStatus.style.display = 'none'; });
          manager.addEventListener(google.ima.AdEvent.Type.COMPLETE, startGame);
          manager.addEventListener(google.ima.AdEvent.Type.SKIPPED, startGame);
          manager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, startGame);
          manager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, startGame);
          try { manager.init(adStage.clientWidth, adStage.clientHeight, google.ima.ViewMode.NORMAL); manager.start(); }
          catch (error) { failAd(error); }
        });
        display.initialize();
        var request = new google.ima.AdsRequest();
        request.adTagUrl = VAST_TAG + Date.now();
        request.linearAdSlotWidth = adStage.clientWidth;
        request.linearAdSlotHeight = adStage.clientHeight;
        request.nonLinearAdSlotWidth = adStage.clientWidth;
        request.nonLinearAdSlotHeight = Math.round(adStage.clientHeight * .25);
        // Some wrappers/creatives fail to emit a terminal event; never block the game forever.
        adTimer = setTimeout(function () {
          failAd(new Error('IMA ad timeout'));
        }, 120000);
        loader.requestAds(request);
      }

      playBtn.addEventListener('click', function () {
        playBtn.disabled = true;
        status.textContent = 'Loading advertisement...';
        splash.style.display = 'none';
        adStatus.style.display = 'block';
        adStage.style.display = 'grid';
        requestAd();
      });
      fsBtn.addEventListener('click', function () {
        if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
        else if (stage.requestFullscreen) stage.requestFullscreen().catch(function () { stage.classList.add('expanded'); });
        else stage.classList.add('expanded');
      });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Save player progress. Called from game frame via google.script.run.saveGameProgress(playerId, data).
 * Caches in CacheService (6h) and persists small payloads to ScriptProperties.
 */
function saveGameProgress(playerId, data) {
  const key = normalizePlayerKey_(playerId);
  if (!key) return { ok: false, error: 'invalid player id' };
  let json;
  try { json = JSON.stringify(data); } catch (err) { return { ok: false, error: 'serialize failed' }; }
  if (!json || json.length > APP_CONFIG.SAVE_MAX_CHARS) return { ok: false, error: 'payload too large' };
  try {
    CacheService.getScriptCache().put('save_' + key, json, 21600);
    if (json.length <= 9000) PropertiesService.getScriptProperties().setProperty('save_' + key, json);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  }
}

/**
 * Load player progress. Returns parsed object or null.
 */
function loadGameProgress(playerId) {
  const key = normalizePlayerKey_(playerId);
  if (!key) return null;
  let json = null;
  try { json = CacheService.getScriptCache().get('save_' + key); } catch (_) {}
  if (!json) {
    try { json = PropertiesService.getScriptProperties().getProperty('save_' + key); } catch (_) {}
  }
  if (!json) return null;
  try { return JSON.parse(json); } catch (_) { return null; }
}

function normalizePlayerKey_(playerId) {
  const s = String(playerId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return s.length >= 8 && s.length <= 64 ? s : '';
}
