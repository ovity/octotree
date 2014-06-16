function OptionsView($dom, store) {
  var self     = this
    , $view    = $dom.find('.octotree_optsview').submit(save)
    , $toggler = $dom.find('.octotree_opts').click(toggle)

  this.$view = $view
  if (store.get(STORE.COLLAPSE) == null) store.set(STORE.COLLAPSE, false)
  if (store.get(STORE.REMEMBER) == null) store.set(STORE.REMEMBER, false)
  if (!store.get(STORE.HOTKEYS)) store.set(STORE.HOTKEYS, '⌘+b, ⌃+b')

  $(document).on(EVENT.TOGGLE, function(event, visible) {
    // hide options view when sidebar is hidden
    if (!visible) toggle(false)
  })

  function toggle(visibility) {
    if (visibility !== undefined) {
      if ($view.hasClass('current') === visibility) return
      return toggle()
    }
    if ($toggler.hasClass('selected')) {
      $toggler.removeClass('selected')
      $(self).trigger(EVENT.VIEW_CLOSE)
    }
    else {
      $toggler.addClass('selected')
      $view.find('[data-store]').each(function() {
        var $elm = $(this)
          , storeKey = STORE[$elm.data('store')]
          , value = store.get(storeKey)
        if ($elm.is(':checkbox')) $elm.prop('checked', value)
        else $elm.val(value)
      })
      $(self).trigger(EVENT.VIEW_READY)
    }
  }

  function save(event) {
    event.preventDefault()
    var changes = {}
    $view.find('[data-store]').each(function() {
      var $elm = $(this)
        , storeKey = STORE[$elm.data('store')]
        , oldValue = store.get(storeKey)
        , newValue = $elm.is(':checkbox') ? $elm.is(':checked') : $elm.val()
      if (oldValue !== newValue) {
        changes[storeKey] = [oldValue, newValue]
        store.set(storeKey, newValue)
      }
    })

    toggle()
    if (Object.keys(changes).length) $(self).trigger(EVENT.OPTS_CHANGE, changes)
  }
}