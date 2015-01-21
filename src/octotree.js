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
      , $dom      = $(TEMPLATE)
      , $sidebar  = $dom.find('.octotree_sidebar')
      , $toggler  = $sidebar.find('.octotree_toggle')
      , $views    = $sidebar.find('.octotree_view')
      , adapter   = new GitHub()
      , optsView  = new OptionsView($dom, store)
      , helpPopup = new HelpPopup($dom, store)
      , treeView  = new TreeView($dom, store, adapter)
      , errorView = new ErrorView($dom, store)
      , currRepo  = false
      , hasError  = false

    $sidebar
      .appendTo($('body'))
      .width(parseFloat(store.get(STORE.WIDTH)))
      .resizable({ handles: 'e', minWidth: 200 })
      .resize(layoutChanged)

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
    })

    $document
      .on('pjax:send ' + EVENT.REQ_START, function() {
        $toggler.addClass('loading')
      })
      .on('pjax:end ' + EVENT.REQ_END, function() {
        $toggler.removeClass('loading')
      })
      .on('pjax:timeout', function(event) {
        event.preventDefault()
      })
      .on(EVENT.LOC_CHANGE, tryLoadRepo)
      .on(EVENT.TOGGLE, layoutChanged)

    var MutationObserver = window.MutationObserver;
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (((mutation.oldValue.indexOf('split-diff') === -1) ^ (mutation.target.className.indexOf('split-diff') === -1)) === 1) {
            layoutChanged();
        }
      });
    });

    var config = {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true
    };

    observer.observe(document.body, config);

    return tryLoadRepo()

    function optionsChanged(event, changes) {
      var reload = false
      Object.keys(changes).forEach(function(storeKey) {
        var value = changes[storeKey]
        switch (storeKey) {
          case STORE.COLLAPSE:
          case STORE.TOKEN:
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
        , repo = adapter.getRepoFromPath(showInNonCodePage, currRepo)

      if (repo) {
        $toggler.show()
        helpPopup.show()

        if (remember && shown) toggleSidebar(true)

        if (!lazyload || isSidebarVisible()) {
          var repoChanged = JSON.stringify(repo) !== JSON.stringify(currRepo)
          if (repoChanged || reload === true) {
            $document.trigger(EVENT.REQ_START)
            currRepo = repo
            treeView.showHeader(repo)

            adapter.fetchData({ repo: repo, token: token }, function(err, tree) {
              if (err) errorView.show(err)
              else treeView.show(repo, tree)
            })
          }
          else treeView.syncSelection()
        }
      }
      else {
        $toggler.hide()
        toggleSidebar(false)
      }
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
  }
})