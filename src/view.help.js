function HelpPopup($dom, store) {
  this.$view = $dom.find('.octotree_popup')
  this.store = store
}

HelpPopup.prototype.show = function() {
  var $view = this.$view
    , $sidebar = this.$sidebar
    , store = this.store

  if (!store.get(STORE.POPUP)) {
    $view.css('display', 'block').appendTo($('body'))

    setTimeout(function() {
      store.set(STORE.POPUP, true)
      $view.addClass('show').click(hide)
      setTimeout(hide, 12000)
      $(document).one(EVENT.TOGGLE, hide)
    }, 500)

    function hide() {
      if ($view.hasClass('show')) {
        $view.removeClass('show').one('transitionend', function() { $view.remove() })
      }
    }
  }
}