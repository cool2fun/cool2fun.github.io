/**
 * Stub quảng cáo — không còn IMA; Unity gọi API cũ thì resume ngay.
 */
(function () {
  "use strict";

  window.AdsManager = {
    showPreroll: function (callback) {
      (typeof callback === "function" ? callback : function () {})();
    }
  };

  window.showNextAd = function () {
    passBeforeAdData();
    adBreakDoneData();
  };

  window.showReward = function () {
    passBeforeAdData();
    gainReward();
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
