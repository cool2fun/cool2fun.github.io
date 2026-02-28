// ad-manager.js - Host trên GitHub
// https://cool2fun.github.io/js/ad-manager.js

(function() {
  // Load GPT script
  var gpt = document.createElement('script');
  gpt.async = true;
  gpt.crossOrigin = 'anonymous';
  gpt.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
  document.head.appendChild(gpt);

  // Define ad slot sau khi GPT load
  gpt.onload = function() {
    window.googletag = window.googletag || {cmd: []};
    googletag.cmd.push(function() {
      googletag.defineSlot(
        '/23136362493/Autu',
        [[728, 90], [970, 250]],
        'div-gpt-ad-1772288025543-0'
      ).addService(googletag.pubads());

      googletag.pubads().enableSingleRequest();
      googletag.pubads().collapseEmptyDivs();
      googletag.enableServices();
      googletag.display('div-gpt-ad-1772288025543-0');
    });
  };
})();