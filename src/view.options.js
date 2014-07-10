function OptionsView($dom, store) {
  var self     = this
    , $view    = $dom.find('.octotree_optsview').submit(save)
    , $toggler = $dom.find('.octotree_opts').click(toggle)
    , elements = $view.find('[data-store]').toArray()

  this.$view = $view

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
      eachOption(
        function($elm, key, local, value, cb) {
          if ($elm.is(':checkbox')) $elm.prop('checked', value)
          else $elm.val(value)
          cb()
        },
        function() {
          $toggler.addClass('selected')
          $(self).trigger(EVENT.VIEW_READY)
        }
      )
    }
  }

  function save(event) {
    event.preventDefault()
    var changes = {}
    eachOption(
      function($elm, key, local, value, cb) {
        var newValue = $elm.is(':checkbox') ? $elm.is(':checked') : $elm.val()
        if (value === newValue) return cb()
        changes[key] = [value, newValue]
        store.set(key, newValue, local, cb)
      },
      function() {
        toggle(false)
        if (Object.keys(changes).length) $(self).trigger(EVENT.OPTS_CHANGE, changes)
      }
    )
  }

  function eachOption(processFn, completeFn) {
    async.each(elements,
      function(elm, cb) {
        var $elm  = $(elm)
          , key   = STORE[$elm.data('store')]
          , local = !!$elm.data('perhost')
        store.get(key, local, function(value) {
          processFn($elm, key, local, value, function() { cb() })
        })
      },
      completeFn
    )
  }
}