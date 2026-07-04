/*
 * Home page grid: fetches games.json, renders cards, supports
 * category filtering via ?cat= and a "Load more" button.
 */
(function () {
  "use strict";

  var PAGE_SIZE = 40;
  var ICONS = {
    Cooking: "🍔", Strategy: "♟️", Action: "⚔️", Platform: "🏃",
    Puzzle: "🧩", Adventure: "🗺️", Arcade: "🕹️",
  };

  var grid = document.getElementById("game-grid");
  var heading = document.getElementById("grid-heading");
  var moreWrap = document.getElementById("load-more-wrap");
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
      applyFilter();
    })
    .catch(function () {
      grid.innerHTML = '<p class="grid-empty">Could not load the game list.</p>';
    });
})();
