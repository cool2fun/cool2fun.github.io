/**
 * IMA wrapper — CS Dust (Unity WebGL)
 * Cấu hình đồng bộ tag với Apps Script test (appscript-ads-video + cool2fun description_url).
 */

(function () {
  "use strict";

  // ============== CONFIG (sửa tại đây) ==============
  var CONFIG = {
    /** Đường dẫn ad unit GAM — khớp test-ima-vast.gs / code.gs */
    adUnitPath: "/23136362493/appscript-ads-video",
    /**
     * description_url chuỗi tuyệt đối (Google khuyến nghị HTTPS).
     * Đặt true để dùng trang hiện tại: encodeURIComponent(location.href)
     */
    usePageAsDescriptionUrl: false,
    descriptionUrl: "https://cool2fun.github.io/",
    sz: "640x480",
    ciu_szs: "160x600%2C300x600",
    tfcd: "0",
    npa: "0",
    /** Khớp Linear slot trong IMA AdsRequest với tham số sz trên tag */
    linearAdSlotWidth: 640,
    linearAdSlotHeight: 480,
    nonLinearAdSlotWidth: 300,
    nonLinearAdSlotHeight: 600,
    vastLoadTimeout: 60000,
    loadVideoTimeout: 60000,
    /** insecure | enabled | disabled — trang thường (GitHub Pages) thường dùng insecure */
    vpaidMode: "insecure",
    numRedirects: 10
  };

  function getAdTagBase() {
    var descParam = encodeURIComponent(
      CONFIG.usePageAsDescriptionUrl
        ? String(window.location.href || "").split("#")[0]
        : CONFIG.descriptionUrl
    );
    return (
      "https://pubads.g.doubleclick.net/gampad/ads" +
      "?iu=" +
      encodeURIComponent(CONFIG.adUnitPath) +
      "&description_url=" +
      descParam +
      "&tfcd=" +
      CONFIG.tfcd +
      "&npa=" +
      CONFIG.npa +
      "&sz=" +
      CONFIG.sz +
      "&ciu_szs=" +
      CONFIG.ciu_szs +
      "&gdfp_req=1" +
      "&unviewed_position_start=1" +
      "&output=vast" +
      "&env=vp" +
      "&impl=s" +
      "&correlator="
    );
  }

  function getAdTagUrl() {
    return getAdTagBase() + Date.now();
  }

  function applyVpaidMode() {
    try {
      var VP = google.ima.ImaSdkSettings && google.ima.ImaSdkSettings.VpaidMode;
      if (!VP || !google.ima.settings.setVpaidMode) return;
      var vm = String(CONFIG.vpaidMode || "insecure").toLowerCase();
      if (vm === "disabled" && VP.DISABLED != null) {
        google.ima.settings.setVpaidMode(VP.DISABLED);
      } else if (vm === "insecure" && VP.INSECURE != null) {
        google.ima.settings.setVpaidMode(VP.INSECURE);
      } else {
        google.ima.settings.setVpaidMode(VP.ENABLED);
      }
    } catch (e) {}
  }

  // ============== IMA state ==============
  var adContainer = null;
  var adDisplayContainer = null;
  var adsLoader = null;
  var adsManager = null;
  var adVideo = null;
  var adDoneCallback = null;

  function slotSize() {
    return {
      w: window.innerWidth || CONFIG.linearAdSlotWidth,
      h: window.innerHeight || CONFIG.linearAdSlotHeight
    };
  }

  function teardownIma() {
    if (adsManager) {
      try { adsManager.destroy(); } catch (e) {}
      adsManager = null;
    }
    if (adDisplayContainer) {
      try { adDisplayContainer.destroy(); } catch (e) {}
      adDisplayContainer = null;
    }
    adsLoader = null;
  }

  function initIMA() {
    if (typeof google === "undefined" || !google.ima) {
      console.warn("[Ads] IMA SDK not loaded");
      return false;
    }

    adContainer = document.getElementById("adContainer");
    adVideo = document.getElementById("adVideo");

    if (!adContainer || !adVideo) {
      console.warn("[Ads] adContainer or adVideo element not found");
      return false;
    }

    teardownIma();

    adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, adVideo);
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);

    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false
    );
    adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false
    );

    return true;
  }

  function requestAd() {
    if (!adsLoader && !initIMA()) {
      adDone();
      return;
    }

    google.ima.settings.setNumRedirects(CONFIG.numRedirects);
    applyVpaidMode();

    var adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = getAdTagUrl();
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
      console.error("[Ads] requestAds error:", e);
      adDone();
    }
  }

  function onAdsManagerLoaded(adsManagerLoadedEvent) {
    var ars = new google.ima.AdsRenderingSettings();
    ars.loadVideoTimeout = CONFIG.loadVideoTimeout;

    try {
      adsManager = adsManagerLoadedEvent.getAdsManager(adVideo, ars);
    } catch (err) {
      console.error("[Ads] getAdsManager:", err);
      adDone();
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
      adContainer.style.display = "block";
      adsManager.init(sz.w, sz.h, google.ima.ViewMode.FULLSCREEN);
      adsManager.start();
    } catch (err) {
      console.error("[Ads] adsManager start error:", err);
      adDone();
    }
  }

  function onAdError(adErrorEvent) {
    try {
      var er = adErrorEvent.getError && adErrorEvent.getError();
      var code = er && er.getErrorCode ? er.getErrorCode() : null;
      var msg = er && er.getMessage ? er.getMessage() : String(er || adErrorEvent);
      if (code != null) {
        console.warn("[Ads] AdError " + code + ":", msg);
      } else {
        console.warn("[Ads] Ad error:", msg);
      }
    } catch (e) {
      console.warn("[Ads] Ad error (raw):", adErrorEvent);
    }
    adDone();
  }

  function onAdComplete() {
    adDone();
  }

  function adDone() {
    teardownIma();

    if (adContainer) {
      adContainer.style.display = "none";
    }

    if (typeof adDoneCallback === "function") {
      var cb = adDoneCallback;
      adDoneCallback = null;
      cb();
    }
  }

  window.addEventListener("resize", function () {
    if (!adsManager) return;
    try {
      var sz = slotSize();
      adsManager.resize(sz.w, sz.h, google.ima.ViewMode.FULLSCREEN);
    } catch (e) {}
  });

  // ============== Public API ==============
  window.AdsManager = {
    showPreroll: function (callback) {
      adDoneCallback = callback || function () {};
      if (!initIMA()) {
        adDone();
        return;
      }
      requestAd();
    }
  };

  // ============== Unity bridge ==============
  window.showNextAd = function () {
    console.log("[Ads] showNextAd");
    passBeforeAdData();
    AdsManager.showPreroll(function () {
      adBreakDoneData();
    });
  };

  window.showReward = function () {
    console.log("[Ads] showReward");
    passBeforeAdData();
    AdsManager.showPreroll(function () {
      gainReward();
    });
  };

  window.noRewardAdsAvailable = function () {
    if (window.myGameInstance) {
      window.myGameInstance.SendMessage("Canvas", "NoRewardedAdsTryLater");
    }
  };

  window.cancelReward = function () {
    if (window.myGameInstance) {
      window.myGameInstance.SendMessage("Canvas", "resumeGameRewarded");
      window.myGameInstance.SendMessage("Canvas", "rewardAdsCanceled");
    }
  };

  window.gainReward = function () {
    if (window.myGameInstance) {
      window.myGameInstance.SendMessage("Canvas", "resumeGameRewarded");
      window.myGameInstance.SendMessage("Canvas", "rewardAdsCompleted");
    }
  };

  window.passBeforeAdData = function () {
    if (window.myGameInstance) {
      window.myGameInstance.SendMessage("Canvas", "pauseGame");
    }
  };

  window.adBreakDoneData = function () {
    if (window.myGameInstance) {
      window.myGameInstance.SendMessage("Canvas", "resumeGame");
    }
  };

})();
