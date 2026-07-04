/*
 * Home page grid: fetches games.json, renders cards, supports
 * category filtering via ?cat= and a "Load more" button.
 */
(function () {
  "use strict";

  var PAGE_SIZE = 40;
  var ICONS = {
    Action: "⚔️", Racing: "🏎️", Puzzle: "🧩", Sports: "⚽", Strategy: "♟️",
    Platform: "🏃", Adventure: "🗺️", Cooking: "🍔", Idle: "⏳", Arcade: "🕹️",
  };

  // Well-known titles surfaced in the "Popular" row (matched by slug).
  var POPULAR_SLUGS = [
    "among-us", "vex-6", "vex-5", "vex-4", "happy-wheels", "tank-trouble",
    "raze-3", "kingdom-rush", "plants-vs-zombies", "learn-to-fly-3",
    "papa-s-freezeria", "duck-life-4", "run-3", "bloons-tower-defense-4",
    "earn-to-die", "fireboy-and-watergirl", "2048-multiplayer", "cookie-clicker-2",
    "crossy-road", "doodle-jump", "8-ball-pool", "basketball-stars",
    "tomb-of-the-mask", "drift-boss", "moto-x3m", "slope",
  ];

  var grid = document.getElementById("game-grid");
  var heading = document.getElementById("grid-heading");
  var moreWrap = document.getElementById("load-more-wrap");
  var popularSection = document.getElementById("popular-section");
  var popularGrid = document.getElementById("popular-grid");
  if (!grid) return;

  var all = [];
  var filtered = [];
  var shown = 0;

  function getCategory() {
    var params = new URLSearchParams(location.search);
    return params.get("cat");
  }

  function cardHTML(g) {
    var icon = ICONS[g.category] || "🎮";
    // Show a real thumbnail if one exists; fall back to the category emoji.
    var src = g.thumb || "/thumbs/" + g.slug + ".jpg";
    var thumb =
      '<img class="thumb-img" src="' + src + '" alt="' + escAttr(g.title) +
      '" loading="lazy" width="300" height="225" onerror="this.parentNode.classList.add(\'no-img\');this.remove();">' +
      '<span class="thumb-emoji" aria-hidden="true">' + icon + "</span>";
    return (
      '<article class="game-card"><a href="/game/' + g.slug + '.html" aria-label="Play ' +
      escAttr(g.title) + '"><div class="game-thumb">' + thumb +
      '</div><div class="game-body"><h3>' + escHtml(g.title) +
      '</h3><span class="tag">' + escHtml(g.category) + "</span></div></a></article>"
    );
  }

  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escAttr(s) {
    return escHtml(s).replace(/"/g, "&quot;");
  }

  function renderMore() {
    var next = filtered.slice(shown, shown + PAGE_SIZE);
    grid.insertAdjacentHTML("beforeend", next.map(cardHTML).join(""));
    shown += next.length;
    updateMoreButton();
  }

  function updateMoreButton() {
    moreWrap.innerHTML = "";
    if (shown < filtered.length) {
      var btn = document.createElement("button");
      btn.className = "btn";
      btn.type = "button";
      btn.textContent = "Load more games";
      btn.addEventListener("click", renderMore);
      moreWrap.appendChild(btn);
    }
  }

  function renderPopular() {
    if (!popularSection || !popularGrid) return;
    var cat = getCategory();
    // Popular row only shows on the unfiltered home view.
    if (cat) {
      popularSection.hidden = true;
      return;
    }
    var bySlug = {};
    for (var i = 0; i < all.length; i++) bySlug[all[i].slug] = all[i];
    var picks = [];
    for (var j = 0; j < POPULAR_SLUGS.length && picks.length < 12; j++) {
      var g = bySlug[POPULAR_SLUGS[j]];
      if (g) picks.push(g);
    }
    // Top up with games that have real thumbnails if the list is short.
    for (var k = 0; k < all.length && picks.length < 12; k++) {
      if (all[k].thumb && picks.indexOf(all[k]) === -1) picks.push(all[k]);
    }
    if (picks.length === 0) {
      popularSection.hidden = true;
      return;
    }
    popularSection.hidden = false;
    popularGrid.innerHTML = picks.map(cardHTML).join("");
  }

  function applyFilter() {
    var cat = getCategory();
    filtered = cat ? all.filter(function (g) { return g.category === cat; }) : all;
    shown = 0;
    grid.innerHTML = "";
    if (heading) heading.textContent = cat ? cat + " Games" : "All Games";
    if (filtered.length === 0) {
      grid.innerHTML = '<p class="grid-empty">No games found in this category.</p>';
      moreWrap.innerHTML = "";
      return;
    }
    renderMore();
  }

  function markActiveCategory() {
    var cat = getCategory();
    var links = document.querySelectorAll(".cat-nav a");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href") || "";
      var isHome = href === "/" && !cat;
      var matchesCat = cat && href.indexOf("cat=" + encodeURIComponent(cat)) !== -1;
      if (isHome || matchesCat) links[i].classList.add("active");
      else links[i].classList.remove("active");
    }
  }

  fetch("/games.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      all = data;
      markActiveCategory();
      renderPopular();
      applyFilter();
    })
    .catch(function () {
      grid.innerHTML = '<p class="grid-empty">Could not load the game list.</p>';
    });
})();
