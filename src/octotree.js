$(document).ready(() => {
  const store = new Storage()

  parallel(Object.keys(STORE), setDefault, loadExtension)

  function setDefault(key, cb) {
    const storeKey = STORE[key]
    store.get(storeKey, (val) => {
      store.set(storeKey, val == null ? DEFAULTS[key] : val, cb)
    })
  }

  function createAdapter() {
    var githubUrls = store.get(STORE.GHEURLS).split(/\n/).concat('github.com')

    return ~githubUrls.indexOf(location.host)
      ? new GitHub(store)
      : new GitLab(store)
  }

  function loadExtension() {
    const $html = $('html')
    const $document = $(document)
    const $dom = $(TEMPLATE)
    const $sidebar = $dom.find('.octotree_sidebar')
    const $toggler = $sidebar.find('.octotree_toggle')
    const $views = $sidebar.find('.octotree_view')
    const adapter = createAdapter()
    const treeView = new TreeView($dom, store, adapter)
    const optsView = new OptionsView($dom, store)
    const helpPopup = new HelpPopup($dom, store)
    const errorView = new ErrorView($dom, store)
    let currRepo = false
    let hasError = false

    $sidebar
      .width(parseInt(store.get(STORE.WIDTH)))
      .resize(layoutChanged)
      .appendTo($('body'))

    adapter.init($sidebar)
    layoutChanged()

    $(window).resize((event) => { // handle zoom
      if (event.target === window) layoutChanged()
    })

    $toggler.click(toggleSidebarAndSave)
    key.filter = () => $toggler.is(':visible')
    key(store.get(STORE.HOTKEYS), toggleSidebarAndSave)

    ;[treeView, errorView, optsView].forEach((view) => {
      $(view)
        .on(EVENT.VIEW_READY, function (event) {
          if (this !== optsView) {
            $document.trigger(EVENT.REQ_END)
          }
          showView(this.$view)
        })
        .on(EVENT.VIEW_CLOSE, () => showView(hasError ? errorView.$view : treeView.$view))
        .on(EVENT.OPTS_CHANGE, optionsChanged)
        .on(EVENT.FETCH_ERROR, (event, err) => showError(err))
    })

    $document
      .on('pjax:send ' + EVENT.REQ_START, () => $toggler.addClass('octotree_loading'))
      .on('pjax:end ' + EVENT.REQ_END, () => $toggler.removeClass('octotree_loading'))
      .on('pjax:timeout', (event) => event.preventDefault())
      .on(EVENT.LAYOUT_CHANGE, layoutChanged)
      .on(EVENT.TOGGLE, layoutChanged)
      .on(EVENT.LOC_CHANGE, () => {
        layoutChanged()
        tryLoadRepo()
      })

    return tryLoadRepo()

    function optionsChanged(event, changes) {
      let reload = false

      Object.keys(changes).forEach((storeKey) => {
        const value = changes[storeKey]

        switch (storeKey) {
          case STORE.TOKEN:
          case STORE.LOADALL:
            reload = true
            break
          case STORE.HOTKEYS:
            key.unbind(value[0])
            key(value[1], toggleSidebar)
            break
        }
      })

      if (reload) {
        tryLoadRepo(true)
      }
    }

    function tryLoadRepo(reload) {
      hasError = false
      const remember = store.get(STORE.REMEMBER)
      const showInNonCodePage = store.get(STORE.NONCODE)
      const shown = store.get(STORE.SHOWN)
      const token = store.get(STORE.TOKEN)

      adapter.getRepoFromPath(showInNonCodePage, currRepo, token, (err, repo) => {
        if (err) {
          showError(err)
        }
        else if (repo) {
          $toggler.show()
          helpPopup.show()

          if (remember && shown) {
            toggleSidebar(true)
          }

          if (isSidebarVisible()) {
            const repoChanged = JSON.stringify(repo) !== JSON.stringify(currRepo)

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

    function showError(err) {
      hasError = true
      errorView.show(err)
    }

    function toggleSidebarAndSave() {
      store.set(STORE.SHOWN, !isSidebarVisible(), () => {
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
      const width = $sidebar.outerWidth()
      adapter.updateLayout(isSidebarVisible(), width)
      store.set(STORE.WIDTH, width)
    }

    function isSidebarVisible() {
      return $html.hasClass(PREFIX)
    }
  }
})
