// ============================================================
// COOL2FUN - Main App Engine
// URL scheme: slope.html, run-3.html (slug = filename)
// ============================================================
(function () {
  'use strict';

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }
  function getParam(key) { return new URLSearchParams(window.location.search).get(key); }
  function shuffle(arr) { return arr.slice().sort(function () { return Math.random() - 0.5; }); }

  // Slug = tên file HTML (vd: slope.html -> "slope")
  function currentSlug() {
    return window.location.pathname.split('/').pop().replace('.html', '');
  }

  // ── NAV ──────────────────────────────────────────────────
  function buildNav() {
    var ul = qs('#categoryList');
    if (!ul || !window.CATEGORIES) return;
    var cur = window.location.pathname.split('/').pop();
    ul.innerHTML = window.CATEGORIES.map(function (c) {
      var isActive = cur === c.link.split('?')[0] ? ' class="active"' : '';
      return '<li><a href="' + c.link + '"' + isActive + '>' +
        '<i class="fas ' + c.icon + '"></i> <span>' + c.name + '</span></a></li>';
    }).join('');
  }

  // ── GAME CARD ─────────────────────────────────────────────
  function gameCard(g, sidebar) {
    return '<article class="game-card' + (sidebar ? ' game-card--sidebar' : '') + '">' +
      '<a href="' + g.slug + '.html" aria-label="Play ' + g.name + ' unblocked">' +
        '<div class="card-thumb">' +
          '<img src="image/' + g.slug + '.png" alt="' + g.name + ' unblocked" ' +
            'loading="lazy" width="' + (sidebar ? 100 : 220) + '" height="' + (sidebar ? 70 : 150) + '" ' +
            'onerror="this.src=\'image/slope.png\'">' +
          '<span class="card-badge">' + g.cat[0] + '</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<h3>' + g.name + '</h3>' +
          '<p>' + g.desc + '</p>' +
          '<span class="play-btn"><i class="fas fa-play"></i> Play Now</span>' +
        '</div>' +
      '</a></article>';
  }

  // ── GRID (homepage + category) ────────────────────────────
  function renderGrid() {
    var grid = qs('#gameGrid');
    if (!grid || !window.GAMES) return;

    var cat = getParam('cat');
    var filtered = cat
      ? window.GAMES.filter(function (g) { return g.cat.indexOf(cat) !== -1; })
      : window.GAMES;

    var title = qs('#categoryTitle');
    if (title) title.textContent = cat ? cat + ' Games' : 'All Unblocked Games';

    if (cat) {
      document.title = cat + ' Games Unblocked - Cool2Fun';
      var desc = qs('meta[name="description"]');
      if (desc) desc.content = 'Play free ' + cat + ' unblocked games on Cool2Fun. No downloads!';
    }

    grid.innerHTML = filtered.length
      ? filtered.map(function (g) { return gameCard(g, false); }).join('')
      : '<p class="no-games">No games in this category yet.</p>';
  }

  // ── SEARCH ────────────────────────────────────────────────
  function initSearch() {
    var input = qs('#searchInput');
    if (!input) return;
    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().trim();
      qsa('.game-card').forEach(function (card) {
        var name = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = (!q || name.indexOf(q) !== -1) ? '' : 'none';
      });
    });
  }

  // ── GAME PAGE ─────────────────────────────────────────────
  function renderGamePage() {
    // Chỉ chạy nếu trang có #gameFrame
    var frame = qs('#gameFrame');
    if (!frame || !window.GAMES) return;

    var slug = currentSlug();
    var game = window.GAMES.filter(function (g) { return g.slug === slug; })[0];

    if (!game) {
      qs('main').innerHTML = '<div class="not-found">' +
        '<h1>404</h1><p>Game not found.</p>' +
        '<a href="index.html" class="play-btn" style="max-width:180px;margin:0 auto">' +
        '<i class="fas fa-home"></i> Back to Games</a></div>';
      return;
    }

    // SEO
    document.title = game.name + ' Unblocked - Play Free on Cool2Fun';
    var metaDesc = qs('meta[name="description"]');
    if (metaDesc) metaDesc.content = 'Play ' + game.name + ' unblocked online for free. ' + game.desc + '. No downloads needed!';
    var canonical = qs('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://cool2fun.github.io/' + slug + '.html';

    // JSON-LD
    var sd = document.createElement('script');
    sd.type = 'application/ld+json';
    sd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "VideoGame",
      "name": game.name,
      "description": game.desc + '. Play ' + game.name + ' unblocked for free on Cool2Fun!',
      "url": 'https://cool2fun.github.io/' + slug + '.html',
      "genre": game.cat,
      "gamePlatform": "Web Browser",
      "applicationCategory": "Game",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.5", "ratingCount": "1500" }
    });
    document.head.appendChild(sd);

    // Fill content
    var nameEl = qs('#gameName');
    if (nameEl) nameEl.textContent = game.name + ' Unblocked';

    var descEl = qs('#gameDesc');
    if (descEl) descEl.textContent = game.desc + '. Play instantly in your browser — no downloads, no installs!';

    var catsEl = qs('#gameCats');
    if (catsEl) catsEl.innerHTML = game.cat.map(function (c) {
      return '<a href="category.html?cat=' + c + '" class="cat-tag">' + c + '</a>';
    }).join('');

    // Load game iframe
    frame.src = game.src;

    // Sidebar
    var sidebar = qs('#otherGamesList');
    if (sidebar) {
      sidebar.innerHTML = shuffle(window.GAMES)
        .filter(function (g) { return g.slug !== slug; })
        .slice(0, 8)
        .map(function (g) { return gameCard(g, true); })
        .join('');
    }
  }

  // ── FULLSCREEN ────────────────────────────────────────────
  function initFullscreen() {
    var btn = qs('#fullscreenBtn');
    var wrapper = qs('#gameWrapper');
    if (!btn || !wrapper) return;
    btn.addEventListener('click', function () {
      if (!document.fullscreenElement) {
        (wrapper.requestFullscreen || wrapper.webkitRequestFullscreen).call(wrapper);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      }
    });
    document.addEventListener('fullscreenchange', function () {
      btn.innerHTML = document.fullscreenElement
        ? '<i class="fas fa-compress"></i> Exit'
        : '<i class="fas fa-expand"></i> Fullscreen';
    });
  }

  // ── ADS ───────────────────────────────────────────────────
  function loadAds() {
    fetch('js/ad-config.json')
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6556788076088846';
        s.crossOrigin = 'anonymous';
        s.onload = function () {
          qsa('.ad-slot').forEach(function (el) {
            var id = el.dataset.slot;
            if (!cfg[id]) return;
            var ins = document.createElement('ins');
            ins.className = 'adsbygoogle';
            ins.style.cssText = 'display:inline-block;width:' + cfg[id].width + 'px;height:' + cfg[id].height + 'px';
            ins.dataset.adClient = cfg[id].adClient;
            ins.dataset.adSlot = cfg[id].adSlot;
            el.appendChild(ins);
            try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
          });
        };
        document.head.appendChild(s);
      })
      .catch(function () {});
  }

  // ── INIT ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    buildNav();
    renderGrid();
    renderGamePage();
    initSearch();
    initFullscreen();
    loadAds();
  });

})();
