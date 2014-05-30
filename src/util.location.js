$(document).ready(function() {
  // When navigating from non-code pages (i.e. Pulls, Issues) to code page
  // GitHub doesn't reload the page but uses pjax. Need to detect and load Octotree.
  var href, hash
  function detectLocationChange() {
    if (location.href !== href || location.hash !== hash) {
      href = location.href
      hash = location.hash
      $(document).trigger(EVENT.LOC_CHANGE, href, hash)
    }
    setTimeout(detectLocationChange, 200)
  }
  detectLocationChange()
})