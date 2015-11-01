$(document).ready(function() {
  // When navigating from non-code pages (i.e. Pulls, Issues) to code page
  // GitHub doesn't reload the page but uses pjax. Need to detect and load Octotree.
  var firstLoad = true, href, hash
  
  function detectLocationChange() {
    if (location.href !== href || location.hash !== hash) {
      href = location.href
      hash = location.hash

      // If this is the first time this is called, no need to notify change as
      // Octotree does its own initialization after loading options.
      if (firstLoad) {
        firstLoad = false
      }
      else {
        setTimeout(function () {
          $(document).trigger(EVENT.LOC_CHANGE, href, hash)
        }, 200) // Waits a bit for pjax DOM change
      }
    }

    setTimeout(detectLocationChange, 200)
  }
  detectLocationChange()
})
