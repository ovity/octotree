function ErrorView($dom, store) {
  var self = this
  this.$view = $dom.find('.octotree_errorview').submit(saveToken)
  this.store = store

  function saveToken(event) {
    event.preventDefault()
    var $view = self.$view
      , $error = $view.find('.error').text('')
      , $token = $view.find('[name="token"]')
      , oldToken = store.get(STORE.TOKEN)
      , newToken = $token.val()
      , changes = {}
    if (!newToken) return $error.text('Token is required')
    $token.val('')
    changes[STORE.TOKEN] = [oldToken, newToken]
    store.set(STORE.TOKEN, newToken)
    $(self).trigger(EVENT.OPTS_CHANGE, changes)
  }
}

ErrorView.prototype.show = function(err) {
  var $view = this.$view
    , token = this.store.get(STORE.TOKEN)
    , $token = $view.find('input[name="token"]')
    , $submit = $view.find('button[type="submit"]')
    , $help = $submit.next()

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
  $(this).trigger(EVENT.VIEW_READY)
}