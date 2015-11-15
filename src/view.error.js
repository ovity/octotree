class ErrorView {
  constructor($dom, store) {
    this.store = store
    this.$view = $dom
      .find('.octotree_errorview')
      .submit(this._saveToken.bind(this))
  }

  show(err) {
    const $token = this.$view.find('input[name="token"]')
    const $submit = this.$view.find('button[type="submit"]')
    const $help = $submit.next()
    const token = this.store.get(STORE.TOKEN)

    this.$view.find('.octotree_view_header').html(err.error)
    this.$view.find('.message').html(err.message)

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

  _saveToken(event) {
    event.preventDefault()

    const $error = this.$view.find('.error').text('')
    const $token = this.$view.find('[name="token"]')
    const oldToken = this.store.get(STORE.TOKEN)
    const newToken = $token.val()

    if (!newToken) return $error.text('Token is required')

    this.store.set(STORE.TOKEN, newToken, () => {
      const changes = {[STORE.TOKEN]: [oldToken, newToken]}
      $(this).trigger(EVENT.OPTS_CHANGE, changes)
      $token.val('')
    })
  }
}
