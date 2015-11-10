function OptionsView($dom, adapter, store) {
  adapter.filterOption($dom)
  var self     = this
    , $view    = $dom.find('.octotree_optsview').submit(save)
    , $toggler = $dom.find('.octotree_opts').click(toggle)
    , elements = $view.find('[data-store]').toArray()

  this.$view = $view

  $(document).ready(function() {
    function triggerChange(checkbox) {
      var store     = $(checkbox).data('store')
        , checkboxs = $view.find('[data-trigger-disable=' + store + ']')
      checkboxs.prop('disabled', !checkbox.checked).closest('label').toggleClass('disabled', !checkbox.checked)
    }

    eachOption(
      function($elm) {
        // triggers to disable all checkboxs having data-trigger-disable
        $elm.change(function(event) {
          triggerChange(event.target)
        })
      }
    )
  })

  // hide options view when sidebar is hidden
  $(document).on(EVENT.TOGGLE, function(event, visible) {
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
          // Original jQuery prop function doesn't trigger change event
          if ($elm.is(':checkbox')) $elm.prop('checked', value).trigger("change")
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

    /*
     * Certainly not a good place to put this logic but Chrome requires
     * permissions to be requested only in response of user input. So...
     */
    // @ifdef CHROME
    var $ta = $view.find('[data-store$=EURLS]')
      , storeKey = $ta.data('store')
      , urls  = $ta.val().split(/\n/).filter(function (url) { return url !== '' })

    if (urls.length > 0) {
      chrome.runtime.sendMessage({type: 'requestPermissions', urls: urls}, function (granted) {
        if (granted) saveOptions()
        else {
          // permissions not granted (by user or error), reset value
          $ta.val(store.get(STORE[storeKey]))
          saveOptions()
        }
      })
      return
    }
    // @endif

    return saveOptions()

    function saveOptions() {
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
  }

  function eachOption(processFn, completeFn) {
    parallel(elements,
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
