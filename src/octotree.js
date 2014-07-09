;(function() {
  var $html     = $('html')
    , $document = $(document)
    , $dom      = $(TEMPLATE)
    , $sidebar  = $dom.find('.octotree_sidebar')
    , $toggler  = $sidebar.find('.octotree_toggle')
    , $views    = $sidebar.find('.octotree_view')
    , store     = new Storage()
    , adapter   = false
    , helpPopup = new HelpPopup($dom, store)
    , treeView  = false
    , errorView = new ErrorView($dom, store)
    , optsView  = new OptionsView($dom, store)
    , currRepo  = false
    , hasError  = false

  $document.ready(function() {
    adapter = AdapterManager.getAdapter();
    if(adapter == null)
      return;
    treeView = new TreeView($dom, store, adapter);
    
    injectOctotreeSidebar();

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
      var repo = adapter.getRepoFromPath()
        , repoChanged = JSON.stringify(repo) !== JSON.stringify(currRepo)

       if(adapter.requiresReinject()) {
          injectOctotreeSidebar();
       }

      if (repo) {
        helpPopup.show()
        $toggler.show()
        if (store.get(STORE.REMEMBER) && store.get(STORE.SHOWN)) toggleSidebar(true)
        if (repoChanged || reload === true) {
          $document.trigger(EVENT.REQ_START)
          currRepo = repo
          treeView.showHeader(repo)
          adapter.fetchData({ repo: repo, token: store.get(STORE.TOKEN) }, function(err, tree) {
            hasError = !!err

            if (err && err.shouldShowSidebar == true)
            {
                errorView.show(err)
            }
            else if(err && err.shouldShowSidebar == false)
            {
                $toggler.hide()
                toggleSidebar(false)
            }
            else treeView.show(repo, tree)
          })
        }
        else treeView.syncSelection()
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

    function layoutChanged() {
      var width = $sidebar.width()
      adapter.updateLayout($html.hasClass(PREFIX), width)
      store.set(STORE.WIDTH, width)
    }

    function injectOctotreeSidebar()
    {
      if(chrome)
      {
        var $font = $("<style/>").text("@font-face {\
            font-family: 'octicons';\
            src: url('"+ chrome.extension.getURL('octicons/octicons.ttf') +"') format('truetype');\
            font-weight: normal;\
            font-style: normal;\
          }");
        $font.appendTo($('body'));
      }
      
      $(".octotree_content").remove();
      $sidebar
        .appendTo($('body'))
        .width(store.get(STORE.WIDTH) || 250)
        .resizable({ handles: 'e', minWidth: 200 })
        .resize(layoutChanged)
    }
  })
})()