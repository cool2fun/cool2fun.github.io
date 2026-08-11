(function () {
  var UNITS = {
    leaderboard: { src: '/ads/970x90.html',  w: 970, h: 90  },
    sidebar:     { src: '/ads/300x600.html', w: 300, h: 600 }
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
