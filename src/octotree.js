$(document).ready(function() {
  var store = new Storage()

  parallel(Object.keys(STORE), setDefault, loadExtension)

  function setDefault(key, cb) {
    var storeKey = STORE[key]
    var local = storeKey === STORE.TOKEN
    store.get(storeKey, local, function(val) {
      store.set(storeKey, val == null ? DEFAULTS[key] : val, local, cb)
    })
  }

  function loadExtension() {
    var $html     = $('html')
      , $document = $(document)
      , adapter   = initAdapter()
      , $dom      = $(TEMPLATE)
      , $sidebar  = $dom.find('.octotree_sidebar')
      , $toggler  = $sidebar.find('.octotree_toggle')
      , $views    = $sidebar.find('.octotree_view')
      , optsView  = new OptionsView($dom, adapter, store)
      , helpPopup = new HelpPopup($dom, store)
      , treeView  = new TreeView($dom, store, adapter)
      , errorView = new ErrorView($dom, store)
      , currRepo  = false
      , hasError  = false

    $sidebar
      .width(parseFloat(store.get(STORE.WIDTH)))
      .resizable({ handles: 'e', minWidth: 200 })
      .resize(layoutChanged)

    adapter.appendSidebar($sidebar)
    layoutChanged()
    if (detectRepoHost() == REPOS.GITLAB)
      fixGLSubmitButton()

    $(window).resize(function(event) { // handle zoom
      if (event.target === window) layoutChanged()
    })

    $toggler.click(toggleSidebarAndSave)
    key.filter = function() { return $toggler.is(':visible') }
    key(store.get(STORE.HOTKEYS), toggleSidebarAndSave)

    ;[treeView, errorView, optsView].forEach(function(view) {
      $(view)
        .on(EVENT.VIEW_READY, function(event) {
          if (this !== optsView) $document.trigger(EVENT.REQ_END)
          showView(this.$view)
        })
        .on(EVENT.VIEW_CLOSE, function() {
          showView(hasError ? errorView.$view : treeView.$view)
        })
        .on(EVENT.OPTS_CHANGE, optionsChanged)
        .on(EVENT.FETCH_ERROR, function(event, err) {
          errorView.show(err)
        })
    })

    $document
      .on('pjax:send ' + EVENT.REQ_START, function() {
        $toggler.addClass('octotree_loading')
      })
      .on('pjax:end ' + EVENT.REQ_END, function() {
        $toggler.removeClass('octotree_loading')
      })
      .on('pjax:timeout', function(event) {
        event.preventDefault()
      })
      .on(EVENT.LOC_CHANGE, function() {
        adapter.appendSidebar($sidebar)
        layoutChanged()
        tryLoadRepo()
      })
      .on(EVENT.LAYOUT_CHANGE, layoutChanged)
      .on(EVENT.TOGGLE, layoutChanged)

    return tryLoadRepo()

    function optionsChanged(event, changes) {
      var reload = false
      Object.keys(changes).forEach(function(storeKey) {
        var value = changes[storeKey]
        switch (storeKey) {
          case STORE.COLLAPSE:
          case STORE.TOKEN:
          case STORE.RECURSIVE:
            reload = true
            break
          case STORE.HOTKEYS:
            key.unbind(value[0])
            key(value[1], toggleSidebar)
            break
        }
      })
      if (reload) tryLoadRepo(true)
    }

    function tryLoadRepo(reload) {
      var remember = store.get(STORE.REMEMBER)
        , showInNonCodePage = store.get(STORE.NONCODE)
        , shown = store.get(STORE.SHOWN)
        , lazyload = store.get(STORE.LAZYLOAD)
        , token = store.get(STORE.TOKEN)

      adapter.getRepoFromPath(showInNonCodePage, currRepo, token, function(err, repo) {
        if (err) {
          errorView.show(err)
        }
        else if (repo) {
          $toggler.show()
          helpPopup.show()

          if (remember && shown) toggleSidebar(true)

          if (!lazyload || isSidebarVisible()) {
            var repoChanged = JSON.stringify(repo) !== JSON.stringify(currRepo)
            if (repoChanged || reload === true) {
              $document.trigger(EVENT.REQ_START)
              currRepo = repo
              treeView.show(repo, token)
            }
            else treeView.syncSelection()
          }
        }
        else {
          $toggler.hide()
          toggleSidebar(false)
        }
      })
    }

    function showView(view) {
      $views.removeClass('current')
      view.addClass('current')
    }

    function toggleSidebarAndSave() {
      store.set(STORE.SHOWN, !isSidebarVisible(), function() {
        toggleSidebar()
        if (isSidebarVisible()) {
          tryLoadRepo()
        }
      })
    }

    function toggleSidebar(visibility) {
      if (visibility !== undefined) {
        if (isSidebarVisible() === visibility) return
        toggleSidebar()
      }
      else {
        $html.toggleClass(PREFIX)
        $document.trigger(EVENT.TOGGLE, isSidebarVisible())
      }
    }

    function layoutChanged() {
      var width = $sidebar.width()
      adapter.updateLayout(isSidebarVisible(), width)
      store.set(STORE.WIDTH, width)
    }

    function isSidebarVisible() {
      return $html.hasClass(PREFIX)
    }

    // @HACK GL disables submit buttons after form submits
    function fixGLSubmitButton() {
      var submitButtons = $('.octotree_view_body button[type="submit"]')
      submitButtons.click(function(event) {
        setTimeout(function() {
          $(event.target).prop('disabled', false).removeClass('disabled')
        }, 30)
      })
    }

    /**
     * Pick corresponding Adapter basing on current domain.
     * @param {Object} store - object to get/set value from storage.
     * @return New adapter object, can be GitHub or GitLab.
     */
    function initAdapter() {
      if (detectRepoHost() == REPOS.GITHUB)
        return new GitHub(store)
      return new GitLab(store)
    }

    function detectRepoHost() {
      var urls  = store.get(STORE.GHEURLS).split(/\n/)
        , isGitHub = false

      urls.push(DOMAINS.GITHUB)
      urls.forEach(function(url) {
        if (location.origin === url)
          isGitHub = true
      })
      return isGitHub ? REPOS.GITHUB : REPOS.GITLAB
    }
  }
})
