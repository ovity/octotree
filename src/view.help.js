class HelpPopup {
  constructor($dom, store) {
    this.$view = $dom.find('.popup')
    this.store = store
  }

  show() {
    const $view = this.$view
    const store = this.store
    const popupShown = store.get(STORE.POPUP)
    const sidebarVisible = $('html').hasClass(PREFIX)
    
    if (popupShown || sidebarVisible) {
      store.set(STORE.POPUP, true)
      return
    }

    $(document).one(EVENT.TOGGLE, hide)

    setTimeout(() => {
      store.set(STORE.POPUP, true)
      $view.addClass('show').click(hide)
      setTimeout(hide, 6000)
    }, 500)

    function hide() {
      if ($view.hasClass('show')) {
        $view.removeClass('show').one('transitionend', () => $view.remove())
      }
    }
  }
}
