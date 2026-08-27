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
  // Each unit is a FIXED-SIZE AdSense display unit: slot id + [width, height].
  var SLOTS = {
    sidebar: { slot: "3928608236", w: 300, h: 600 },     // 300x600 rail
    leaderboard: { slot: "7979200749", w: 970, h: 250 }, // 970x250 under game
    overlay: { slot: "9406916186", w: 300, h: 250 },     // 300x250 pre-roll
    banner90: { slot: "5424355442", w: 970, h: 90 },     // 970x90 (spare)
  };
  // ----------------

  function isConfigured() {
    return CLIENT.indexOf("ca-pub-") === 0;
  }

  function fillUnit(container) {
    var key = container.getAttribute("data-ad");
    var cfg = SLOTS[key];
    if (!cfg || !cfg.slot) return;

    // Remove the visual placeholder text/content.
    container.innerHTML = "";
    container.classList.add("ad-live");

    // Fixed-size display unit (matches the AdSense unit dimensions).
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "inline-block";
    ins.style.width = cfg.w + "px";
    ins.style.height = cfg.h + "px";
    ins.setAttribute("data-ad-client", CLIENT);
    ins.setAttribute("data-ad-slot", cfg.slot);
    container.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }

  function fillAll(scope) {
    if (!isConfigured()) return;
    // The adsbygoogle.js loader is included in each page's <head>.
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
