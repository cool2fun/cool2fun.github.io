/*
 * Centralized AdSense manager for Cool2Fun.
 * Shared by every page (home + game + content pages).
 *
 * HOW TO GO LIVE:
 *   1. Set CLIENT to your AdSense publisher ID (ca-pub-XXXXXXXXXXXXXXXX).
 *   2. Put each ad unit's slot ID into SLOTS below.
 *   3. In your HTML, ad containers are marked up like:
 *        <div class="ad-slot"   data-ad="sidebar"></div>
 *        <div class="ad-banner" data-ad="leaderboard"></div>
 *      The data-ad value must match a key in SLOTS.
 *
 * While CLIENT is empty, the placeholder boxes stay as-is (nothing is loaded),
 * so the layout looks correct during development.
 */
(function () {
  "use strict";

  // ---- CONFIG ----
  var CLIENT = "ca-pub-6556788076088846";
  var SLOTS = {
    sidebar: "3928608236",     // 300x600 rail unit
    leaderboard: "7979200749", // 970x250 banner under the game
    overlay: "9406916186",     // 300x250 pre-roll overlay unit
    banner90: "5424355442",    // 970x90 (spare)
  };
  // ----------------

  function isConfigured() {
    return CLIENT.indexOf("ca-pub-") === 0;
  }

  function loadLoaderOnce() {
    if (document.querySelector('script[data-adsbygoogle-loader]')) return;
    var s = document.createElement("script");
    s.async = true;
    s.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(CLIENT);
    s.crossOrigin = "anonymous";
    s.setAttribute("data-adsbygoogle-loader", "1");
    document.head.appendChild(s);
  }

  function fillUnit(container) {
    var key = container.getAttribute("data-ad");
    var slot = SLOTS[key];
    if (!slot) return;

    // Remove the visual placeholder text/content.
    container.innerHTML = "";
    container.classList.add("ad-live");

    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", CLIENT);
    ins.setAttribute("data-ad-slot", slot);
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    container.appendChild(ins);

    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  function fillAll(scope) {
    if (!isConfigured()) return;
    loadLoaderOnce();
    var root = scope || document;
    var units = root.querySelectorAll("[data-ad]");
    for (var i = 0; i < units.length; i++) {
      if (!units[i].classList.contains("ad-live")) fillUnit(units[i]);
    }
  }

  // Exposed so dynamically-inserted ad containers (e.g. the pre-roll overlay
  // rebuilt on Restart) can be filled after ads.js has already initialized.
  window.C2FAds = { refresh: fillAll, isConfigured: isConfigured };

  function init() {
    fillAll(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
