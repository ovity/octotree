;(function() {
  var $html      = $('html')
    , $document  = $(document)
    , $dom       = $(TEMPLATE)
    , $sidebar   = $dom.find('.octotree_sidebar')
    , $toggleBtn = $sidebar.find('.octotree_toggle')
    , $views     = $sidebar.find('.octotree_view')
    , store      = new Storage()
    , adapter    = new GitHub()
    , currRepo   = false
    , hasError   = false
    , helpPopup  = new HelpPopup($dom, store)
    , treeView   = new TreeView($dom, store, adapter)
    , errorView  = new ErrorView($dom, store)
    , optsView   = new OptionsView($dom, store)

  $document.ready(function() {
    $sidebar
      .appendTo($('body'))
      .width(store.get(STORE.WIDTH) || 250)
      .resizable({ handles: 'e', minWidth: 200 })
      .resize(sidebarResized)

    $toggleBtn.click(toggleSidebarAndSave)
    key.filter = function() { return $toggleBtn.is(':visible') }
    key(store.get(STORE.SHORTKEY), toggleSidebarAndSave)

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
        $toggleBtn.addClass('loading')
      })
      .on('pjax:end ' + EVENT.REQ_END, function() {
        $toggleBtn.removeClass('loading')
      })
      .on('pjax:timeout', function(event) {
        event.preventDefault()
      })
      .on(EVENT.LOC_CHANGE, tryLoadRepo)
      .on(EVENT.TOGGLE, sidebarResized)

    $(window).resize(function() {
      $(GH_CONTAINERS).addClass('notransition')
      sidebarResized()
      setTimeout(function() {
        $(GH_CONTAINERS).removeClass('notransition')
      }, 300)
    })
    function optionsChanged(event, changes) {
      var reload = false
      Object.keys(changes).forEach(function(storeKey) {
        var value = changes[storeKey]
        switch (storeKey) {
          case STORE.COLLAPSE:
          case STORE.TOKEN:
            reload = true
            break
          case STORE.SHORTKEY:
            key.unbind(value[0])
            key(value[1], toggleSidebar)
            break
        }
      })
      if (reload) tryLoadRepo(true)
    }

    function tryLoadRepo(reload) {
      var repo = adapter.getRepoFromPath()
        , repoChanged = JSON.stringify(repo) !== JSON.stringify(currRepo)
      if (repo) {
        helpPopup.show()
        $toggleBtn.show()
        if (store.get(STORE.REMEMBER) && store.get(STORE.SHOWN)) toggleSidebar(true)
        if (repoChanged || reload === true) {
          $document.trigger(EVENT.REQ_START)
          currRepo = repo
          treeView.showHeader(repo)
          adapter.fetchData({ repo: repo, token: store.get(STORE.TOKEN) }, function(err, tree) {
            hasError = !!err
            if (err) errorView.show(err)
            else treeView.show(repo, tree)
          })
        }
        else treeView.syncSelection()
      }
      else {
        $toggleBtn.hide()
        toggleSidebar(false)
      }
    }

    function showView(view) {
      $views.removeClass('current')
      view.addClass('current')
    }

    function toggleSidebarAndSave() {
      toggleSidebar()
      store.set(STORE.SHOWN, $html.hasClass(PREFIX))
    }

    function toggleSidebar(visibility) {
      if (visibility !== undefined) {
        if ($html.hasClass(PREFIX) === visibility) return
        toggleSidebar()
      }
      else {
        $html.toggleClass(PREFIX)
        $document.trigger(EVENT.TOGGLE, $html.hasClass(PREFIX))
      }
    }

    function sidebarResized() {
      var width = $sidebar.width()
      adapter.updateLayout($html.hasClass(PREFIX), width)
      store.set(STORE.WIDTH, width)
    }
  })
})()