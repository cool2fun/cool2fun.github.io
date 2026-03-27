/**
 * IMA preroll — GAM VAST trực tiếp (không qua tpc/ima3vpaid → vpaid_adapter).
 * Giảm lỗi 901/402 và TypeError dispose trên một số creative/line item.
 */
(function () {
  'use strict';

  /**
   * Tag GAM video (ADS-VIDEO-Cool2fun) — khớp inventory mới.
   * correlator= để trống trong base; luôn nối timestamp khi request.
   */
  function buildGamAdTagBase() {
    return (
      'https://pubads.g.doubleclick.net/gampad/ads?iu=/23136362493/ADS-VIDEO-Cool2fun' +
      '&description_url=' +
      encodeURIComponent('https://cool2fun.github.io/') +
      '&tfcd=0&npa=0&sz=640x480&gdfp_req=1&unviewed_position_start=1&output=vast&env=vp&impl=s&correlator='
    );
  }

  /** adTagUrl đầy đủ gửi IMA (correlator chống cache). */
  function buildDirectAdTagUrl() {
    return buildGamAdTagBase() + Date.now();
  }

  /** Bọc ima3vpaid (ít dùng). inner = URL pubads đầy đủ hoặc base. */
  function vastWrapperUrl(innerTag) {
    var inner = innerTag || buildGamAdTagBase() + Date.now();
    return (
      'https://tpc.googlesyndication.com/ima3vpaid?vad_format=linear&correlator=' +
      Date.now() +
      '&adtagurl=' +
      encodeURIComponent(inner)
    );
  }

  var CONFIG = {
    linearAdSlotWidth: 640,
    linearAdSlotHeight: 480,
    nonLinearAdSlotWidth: 300,
    nonLinearAdSlotHeight: 600,
    vastLoadTimeout: 120000,
    /** Ms — tránh 402 “8 seconds” mặc định trên đường tải media */
    loadVideoTimeout: 120000,
    /** false = adTagUrl trực tiếp pubads (khuyến nghị). true = ima3vpaid wrapper. */
    useImaVpaidWrapper: false,
    /**
     * VPAID: insecure thường ổn định hơn với mix creative; tránh dispose lỗi khi timeout.
     */
    vpaidMode: 'insecure',
    /** Giới hạn chuỗi VAST wrapper — google.ima.settings.setNumRedirects (tối đa 5 lớp). */
    numRedirects: 5,
    maxPrerollMs: 120000,
    startMuted: true
  };

  var overlayEl = null;
  var adContainer = null;
  var adVideo = null;
  var adDisplayContainer = null;
  var adsLoader = null;
  var adsManager = null;
  var finishCb = null;
  var safetyTimer = null;
  /** Trạng thái request hiện tại */
  var requestMuted = true;
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
      if (adVideo && CONFIG.startMuted) {
        adVideo.muted = true;
        adVideo.defaultMuted = true;
      }
      return;
    }
    overlayEl = document.createElement('div');
    overlayEl.id = 'cool2funImaPreroll';
    overlayEl.className = 'ima-preroll-overlay';
    overlayEl.setAttribute('aria-hidden', 'true');
    overlayEl.innerHTML =
      '<div id="cool2funAdContainer" class="ima-ad-container">' +
      '<video id="cool2funAdVideo" class="ima-ad-video" playsinline webkit-playsinline muted></video>' +
      '</div>' +
      '<p class="ima-preroll-hint">Advertisement</p>';
    wrapper.appendChild(overlayEl);
    adContainer = document.getElementById('cool2funAdContainer');
    adVideo = document.getElementById('cool2funAdVideo');
    if (adVideo && CONFIG.startMuted) {
      adVideo.muted = true;
      adVideo.defaultMuted = true;
    }
  }

  function logAdError(er, prefix) {
    var parts = [prefix || '[Cool2FunPreroll]'];
    if (!er) {
      console.warn(parts.join(' '));
      return;
    }
    if (er.getMessage) parts.push(er.getMessage());
    if (er.getErrorCode) parts.push('code=' + er.getErrorCode());
    if (er.getErrorType) parts.push('type=' + er.getErrorType());
    if (typeof er.getInnerError === 'function') {
      try {
        var inner = er.getInnerError();
        if (inner) {
          parts.push(
            'inner=' +
              (inner.getMessage
                ? inner.getMessage()
                : inner.toString && inner.toString())
          );
        }
      } catch (ie) {}
    }
    console.warn(parts.join(' '));
  }

  function onAdError(adErrorEvent) {
    try {
      var er = adErrorEvent.getError && adErrorEvent.getError();
      logAdError(er, '[Cool2FunPreroll] Ad error');
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
      ars.restoreCustomPlaybackStateOnAdBreakComplete = true;
    } catch (e) {}

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
    try {
      google.ima.settings.setNumRedirects(CONFIG.numRedirects);
    } catch (e) {}
    applyVpaidMode();

    var adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl =
      CONFIG.useImaVpaidWrapper === true
        ? vastWrapperUrl(buildGamAdTagBase() + Date.now())
        : buildDirectAdTagUrl();
    adsRequest.linearAdSlotWidth = CONFIG.linearAdSlotWidth;
    adsRequest.linearAdSlotHeight = CONFIG.linearAdSlotHeight;
    adsRequest.nonLinearAdSlotWidth = CONFIG.nonLinearAdSlotWidth;
    adsRequest.nonLinearAdSlotHeight = CONFIG.nonLinearAdSlotHeight;
    adsRequest.vastLoadTimeout = CONFIG.vastLoadTimeout;
    adsRequest.adWillAutoPlay = true;
    adsRequest.adWillPlayMuted = requestMuted;
    adsRequest.continuousPlayback = false;

    try {
      if (adDisplayContainer && adDisplayContainer.initialize) {
        adDisplayContainer.initialize();
      }
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
    requestMuted = CONFIG.startMuted !== false;
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
    getVastAdTagUrl: function () {
      return buildDirectAdTagUrl();
    },
    getGamAdTagBase: function () {
      return buildGamAdTagBase();
    },
    getWrappedVastAdTagUrl: function () {
      return vastWrapperUrl(buildGamAdTagBase() + Date.now());
    }
  };
})();
