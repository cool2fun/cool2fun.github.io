(function () {
  var UNITS = {
    leaderboard: {
      src: 'https://script.google.com/macros/s/AKfycby0NyvZW0TAogOkUh-P5Knwe2PrFhplDyYtRkr7-dM3OxAuqOoHVd44EbhNasboVQy79w/exec',
      w: 970, h: 90
    },
    sidebar: {
      src: 'https://script.google.com/macros/s/AKfycbyPT-YXxEPg_av-B0yJlvR9BSGVsmcaQdFGJl0fDpb6RbuHk6YaepHswQzkl1iNZTAC1Q/exec',
      w: 300, h: 600
    }
  };

  function injectAd(el, key) {
    var u = UNITS[key];
    if (!u) return;

    var iframe = document.createElement('iframe');
    iframe.src = u.src + '?topUrl=' + encodeURIComponent(window.location.href);
    iframe.width = u.w;
    iframe.height = u.h;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.style.cssText = 'display:block;border:none;overflow:hidden;';

    el.innerHTML = '';
    el.appendChild(iframe);
    el.classList.add('ad-live');
  }

  function fillAll() {
    var containers = document.querySelectorAll('[data-ad]');
    for (var i = 0; i < containers.length; i++) {
      var el = containers[i];
      if (!el.classList.contains('ad-live')) {
        injectAd(el, el.getAttribute('data-ad'));
      }
    }
  }

  window.C2FAds = { refresh: fillAll, isConfigured: function () { return true; } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fillAll);
  } else {
    fillAll();
  }
})();
