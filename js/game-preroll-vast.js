/**
 * IMA preroll for Cool2Fun play pages — VAST qua ima3vpaid + adtag GAM (appscript-ads-video).
 * Tag khớp: tpc.googlesyndication.com/ima3vpaid … cool2fun.github.io …
 */
(function () {
  'use strict';

  var INNER_AD_TAG =
    'https://pubads.g.doubleclick.net/gampad/ads?iu=/23136362493/appscript-ads-video' +
    '&description_url=' + encodeURIComponent('https://cool2fun.github.io/') +
    '&tfcd=0&npa=0&sz=640x480&ciu_szs=' + encodeURIComponent('160x600,300x600') +
    '&gdfp_req=1&unviewed_position_start=1&output=vast&env=vp&vpos=preroll&vpmute=0&vpa=click&type=js&vad_type=linear';

  function vastWrapperUrl() {
    return (
      'https://tpc.googlesyndication.com/ima3vpaid?vad_format=linear&correlator=' +
      Date.now() +
      '&adtagurl=' +
      encodeURIComponent(INNER_AD_TAG)
    );
  }

  var CONFIG = {
    linearAdSlotWidth: 640,
    linearAdSlotHeight: 480,
    nonLinearAdSlotWidth: 300,
    nonLinearAdSlotHeight: 600,
    vastLoadTimeout: 60000,
    loadVideoTimeout: 60000,
    vpaidMode: 'insecure',
    numRedirects: 10,
    /** Nếu quá lâu không xong preroll, vẫn mở game */
    maxPrerollMs: 90000
  };

  var overlayEl = null;
  var adContainer = null;
  var adVideo = null;
  var adDisplayContainer = null;
  var adsLoader = null;
  var adsManager = null;
  var finishCb = null;
  var safetyTimer = null;

  function slotSize() {
    var w = document.getElementById('gameWrapper');
    if (w) {
      var r = w.getBoundingClientRect();
      if (r.width >= 2 && r.height >= 2) {
        return { w: Math.floor(r.width), h: Math.floor(r.height) };
      }
    }
    return {
      w: CONFIG.linearAdSlotWidth,
      h: CONFIG.linearAdSlotHeight
    };
  }

  function applyVpaidMode() {
    try {
      var VP = google.ima.ImaSdkSettings && google.ima.ImaSdkSettings.VpaidMode;
      if (!VP || !google.ima.settings.setVpaidMode) return;
      var vm = String(CONFIG.vpaidMode || 'insecure').toLowerCase();
      if (vm === 'disabled' && VP.DISABLED != null) {
        google.ima.settings.setVpaidMode(VP.DISABLED);
      } else if (vm === 'insecure' && VP.INSECURE != null) {
        google.ima.settings.setVpaidMode(VP.INSECURE);
      } else {
        google.ima.settings.setVpaidMode(VP.ENABLED);
      }
    } catch (e) {}
  }

  function teardownIma() {
    if (adsManager) {
      try {
        adsManager.destroy();
      } catch (e) {}
      adsManager = null;
    }
    if (adDisplayContainer) {
      try {
        adDisplayContainer.destroy();
      } catch (e) {}
      adDisplayContainer = null;
    }
    adsLoader = null;
  }

  function hideOverlay() {
    if (overlayEl) {
      overlayEl.classList.remove('is-active');
      overlayEl.setAttribute('aria-hidden', 'true');
    }
    teardownIma();
    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
  }

  function finish() {
    hideOverlay();
    if (typeof finishCb === 'function') {
      var f = finishCb;
      finishCb = null;
      f();
    } else {
      finishCb = null;
    }
  }

  function ensureDom(wrapper) {
    overlayEl = document.getElementById('cool2funImaPreroll');
    if (overlayEl) {
      adContainer = document.getElementById('cool2funAdContainer');
      adVideo = document.getElementById('cool2funAdVideo');
      return;
    }
    overlayEl = document.createElement('div');
    overlayEl.id = 'cool2funImaPreroll';
    overlayEl.className = 'ima-preroll-overlay';
    overlayEl.setAttribute('aria-hidden', 'true');
    overlayEl.innerHTML =
      '<div id="cool2funAdContainer" class="ima-ad-container">' +
      '<video id="cool2funAdVideo" class="ima-ad-video" playsinline webkit-playsinline></video>' +
      '</div>' +
      '<p class="ima-preroll-hint">Advertisement</p>';
    wrapper.appendChild(overlayEl);
    adContainer = document.getElementById('cool2funAdContainer');
    adVideo = document.getElementById('cool2funAdVideo');
  }

  function onAdError(adErrorEvent) {
    try {
      var er = adErrorEvent.getError && adErrorEvent.getError();
      var msg = er && er.getMessage ? er.getMessage() : String(er || adErrorEvent);
      console.warn('[Cool2FunPreroll] Ad error:', msg);
    } catch (e) {}
    finish();
  }

  function onAdComplete() {
    finish();
  }

  function onAdsManagerLoaded(adsManagerLoadedEvent) {
    var ars = new google.ima.AdsRenderingSettings();
    ars.loadVideoTimeout = CONFIG.loadVideoTimeout;

    try {
      adsManager = adsManagerLoadedEvent.getAdsManager(adVideo, ars);
    } catch (err) {
      console.warn('[Cool2FunPreroll] getAdsManager:', err);
      finish();
      return;
    }

    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdComplete);
    adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdComplete);
    adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, onAdComplete);

    var sz = slotSize();

    try {
      if (adDisplayContainer && adDisplayContainer.initialize) {
        adDisplayContainer.initialize();
      }
      if (overlayEl) {
        overlayEl.classList.add('is-active');
        overlayEl.setAttribute('aria-hidden', 'false');
      }
      adsManager.init(sz.w, sz.h, google.ima.ViewMode.NORMAL);
      adsManager.start();
    } catch (err) {
      console.warn('[Cool2FunPreroll] start:', err);
      finish();
    }
  }

  function initLoader() {
    if (typeof google === 'undefined' || !google.ima) return false;
    if (!adContainer || !adVideo) return false;

    teardownIma();

    adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, adVideo);
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);

    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false
    );
    adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);

    return true;
  }

  function requestAd() {
    google.ima.settings.setNumRedirects(CONFIG.numRedirects);
    applyVpaidMode();

    var adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = vastWrapperUrl();
    adsRequest.linearAdSlotWidth = CONFIG.linearAdSlotWidth;
    adsRequest.linearAdSlotHeight = CONFIG.linearAdSlotHeight;
    adsRequest.nonLinearAdSlotWidth = CONFIG.nonLinearAdSlotWidth;
    adsRequest.nonLinearAdSlotHeight = CONFIG.nonLinearAdSlotHeight;
    adsRequest.vastLoadTimeout = CONFIG.vastLoadTimeout;
    adsRequest.adWillAutoPlay = true;
    adsRequest.adWillPlayMuted = false;
    adsRequest.continuousPlayback = false;

    try {
      adsLoader.requestAds(adsRequest);
    } catch (e) {
      console.warn('[Cool2FunPreroll] requestAds:', e);
      finish();
    }
  }

  window.addEventListener('resize', function () {
    if (!adsManager) return;
    try {
      var sz = slotSize();
      adsManager.resize(sz.w, sz.h, google.ima.ViewMode.NORMAL);
    } catch (e) {}
  });

  /**
   * Gọi sau khi đã biết URL game; callback chạy khi preroll xong hoặc lỗi / timeout.
   */
  function runAfterPreroll(done) {
    finishCb = typeof done === 'function' ? done : function () {};
    var wrapper = document.getElementById('gameWrapper');
    if (!wrapper) {
      finishCb();
      finishCb = null;
      return;
    }

    if (typeof google === 'undefined' || !google.ima) {
      console.warn('[Cool2FunPreroll] IMA SDK not loaded — bỏ qua preroll');
      finishCb();
      finishCb = null;
      return;
    }

    ensureDom(wrapper);

    safetyTimer = setTimeout(function () {
      console.warn('[Cool2FunPreroll] timeout — mở game');
      finish();
    }, CONFIG.maxPrerollMs);

    if (!initLoader()) {
      finish();
      return;
    }

    overlayEl.classList.add('is-active');
    overlayEl.setAttribute('aria-hidden', 'false');
    requestAd();
  }

  window.Cool2FunPreroll = {
    runAfterPreroll: runAfterPreroll,
    /** Dùng nội bộ / đồng bộ với Unity ads.js */
    getVastAdTagUrl: vastWrapperUrl,
    getInnerGamTag: function () {
      return INNER_AD_TAG;
    }
  };
})();
