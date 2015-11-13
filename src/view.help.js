class HelpPopup {
  constructor($dom, store) {
    this.$view = $dom.find('.octotree_popup')
    this.store = store
  }

  show() {
    const store = this.store
    const popupShown = store.get(STORE.POPUP)
    const sidebarVisible = $('html').hasClass(PREFIX)

    if (popupShown || sidebarVisible) {
      store.set(STORE.POPUP, true)
      return
    }

    const $view = this.$view
    const $toggler = $('.octotree_toggle')
    const offset = $toggler.offset()
    const height = $toggler.outerHeight()

    $view
      .css({
        display: 'block',
        top: offset.top + height + 2,
        left: offset.left
      })
      $view.appendTo($('body'))

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
