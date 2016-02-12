class HelpPopup {
  constructor($dom, store) {
    this.$view = $dom.find('.popup')
    this.store = store
  }

  init() {
    const $view = this.$view
    const store = this.store
    const popupShown = store.get(STORE.POPUP)
    const sidebarVisible = $('html').hasClass(SHOW_CLASS)

    if (popupShown || sidebarVisible) {
      return hideAndDestroy()
    }

    $(document).one(EVENT.TOGGLE, hideAndDestroy)

    setTimeout(() => {
      setTimeout(hideAndDestroy, 6000)
      $view
        .addClass('show')
        .click(hideAndDestroy)
    }, 500)

    function hideAndDestroy() {
      store.set(STORE.POPUP, true)
      if ($view.hasClass('show')) {
        $view.removeClass('show').one('transitionend', () => $view.remove())
      }
      else {
        $view.remove()
      }
    }
  }
}
