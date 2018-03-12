class PjaxAdapter extends Adapter {
  constructor(store) {
    super(['jquery.pjax.js'], store)

    $(document)
      .on('pjax:start', () => $(document).trigger(EVENT.REQ_START))
      .on('pjax:end', () => $(document).trigger(EVENT.REQ_END))
      .on('pjax:timeout', (e) => e.preventDefault())
  }

  // @override
  // @param {Object} opts - {pjaxContainer: the specified pjax container}
  // @api public
  init($sidebar, opts) {
    super.init($sidebar)

    opts = opts || {}
    const pjaxContainer = opts.pjaxContainer

    if (!window.MutationObserver) return

    // Some host switch pages using pjax. This observer detects if the pjax container
    // has been updated with new contents and trigger layout.
    const pageChangeObserver = new window.MutationObserver(() => {
      // Trigger location change, can't just relayout as Octotree might need to
      // hide/show depending on whether the current page is a code page or not.
      return $(document).trigger(EVENT.LOC_CHANGE)
    })

    if (pjaxContainer) {
      pageChangeObserver.observe(pjaxContainer, {
        childList: true,
      })
    }
    else { // Fall back if DOM has been changed
      let firstLoad = true, href, hash

      function detectLocChange() {
        if (location.href !== href || location.hash !== hash) {
          href = location.href
          hash = location.hash

          // If this is the first time this is called, no need to notify change as
          // Octotree does its own initialization after loading options.
          if (firstLoad) {
            firstLoad = false
          }
          else {
            setTimeout(() => {
              $(document).trigger(EVENT.LOC_CHANGE)
            }, 300) // Wait a bit for pjax DOM change
          }
        }
        setTimeout(detectLocChange, 200)
      }

      detectLocChange()
    }
  }

  // @override
  // @param {Object} opts - {$pjax_container: jQuery object}
  // @api public
  selectFile(path, opts) {
    opts = opts || {}
    const $pjaxContainer = opts.$pjaxContainer

    // if we're on the same page and just navigating to a different anchor
    // don't bother fetching the page with pjax
    const pathWithoutAnchor = path.replace(/#.*$/, '')
    const isSamePage = location.pathname === pathWithoutAnchor
    const loadWithPjax = $pjaxContainer.length && !isSamePage

    if (loadWithPjax) {
      $.pjax({
        // needs full path for pjax to work with Firefox as per cross-domain-content setting
        url: location.protocol + '//' + location.host + path,
        container: $pjaxContainer,
        timeout: 0 // global timeout doesn't seem to work, use this instead
      })
    }
    else {
      super.selectFile(path)
    }
  }
}
