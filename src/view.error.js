function ErrorView($dom, store) {
  var self = this
  this.$view = $dom.find('.octotree_errorview').submit(saveToken)
  this.store = store

  function saveToken(event) {
    event.preventDefault()
    var $view = self.$view
      , $error = $view.find('.error').text('')
      , $token = $view.find('[name="token"]')
      , oldToken = store.get(STORE.TOKEN, true)
      , newToken = $token.val()

    if (!newToken) return $error.text('Token is required')

    store.set(STORE.TOKEN, newToken, true, function() {
      var changes = {}
      changes[STORE.TOKEN] = [oldToken, newToken]
      $(self).trigger(EVENT.OPTS_CHANGE, changes)
      $token.val('')
    })
  }
}

ErrorView.prototype.show = function(err) {
  var self = this
    , $view = this.$view
    , $token = $view.find('input[name="token"]')
    , $submit = $view.find('button[type="submit"]')
    , $help = $submit.next()
    , token = self.store.get(STORE.TOKEN, true)

  $view.find('.octotree_view_header').html(err.error)
  $view.find('.message').html(err.message)
  if (err.needAuth) {
    $submit.show()
    $token.show()
    $help.show()
    if (token) $token.val(token)
  }
  else {
    $submit.hide()
    $token.hide()
    $help.hide()
  }
  $(self).trigger(EVENT.VIEW_READY)
}