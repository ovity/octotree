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
    const normalizeUrl = (url) => url.replace(/(.*?:\/\/[^/]+)(.*)/, '$1')

    const githubUrls = store.get(STORE.GHEURLS).split(/\n/)
      .map(normalizeUrl)
      .concat('https://github.com')

    const bitbucketUrls = ['https://bitbucket.org']
    const currentUrl = `${location.protocol}//${location.host}`

    if (~githubUrls.indexOf(currentUrl)) {
      return new GitHub(store)
    } else if (~bitbucketUrls.indexOf(currentUrl)) {
      return new Bitbucket(store)
    }
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

    $html.addClass(ADDON_CLASS)

    $(window).resize((event) => {
      if (event.target === window) layoutChanged()
    })

    $toggler.click(toggleSidebarAndSave)
    key.filter = () => $toggler.is(':visible')
    key(store.get(STORE.HOTKEYS), toggleSidebarAndSave)

    const views = [treeView, errorView, optsView]
    views.forEach((view) => {
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
      .on(EVENT.REQ_START, () => $toggler.addClass('octotree_loading'))
      .on(EVENT.REQ_END, () => $toggler.removeClass('octotree_loading'))
      .on(EVENT.LAYOUT_CHANGE, layoutChanged)
      .on(EVENT.TOGGLE, layoutChanged)
      .on(EVENT.LOC_CHANGE, () => tryLoadRepo())

    $sidebar
      .width(parseInt(store.get(STORE.WIDTH)))
      .resize(() => layoutChanged(true))
      .appendTo($('body'))

    adapter.init($sidebar)
    return tryLoadRepo()

    function optionsChanged(event, changes) {
      let reload = false

      Object.keys(changes).forEach((storeKey) => {
        const value = changes[storeKey]

        switch (storeKey) {
          case STORE.TOKEN:
          case STORE.LOADALL:
          case STORE.ICONS:
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
      const shown = store.get(STORE.SHOWN)
      const token = store.get(STORE.TOKEN)

      adapter.getRepoFromPath(currRepo, token, (err, repo) => {
        if (err) {
          showError(err)
        }
        else if (repo) {
          $toggler.show()

          if (remember && shown) {
            toggleSidebar(true)
          }

          if (isSidebarVisible()) {
            const replacer = ['username', 'reponame', 'branch', 'pullNumber']
            const repoChanged = JSON.stringify(repo, replacer) !== JSON.stringify(currRepo, replacer)
            if (repoChanged || reload === true) {
              $document.trigger(EVENT.REQ_START)
              currRepo = repo
              treeView.show(repo, token)
            }
            else {
              treeView.syncSelection()
            }
          }
        }
        else {
          $toggler.hide()
          toggleSidebar(false)
        }
        helpPopup.init()
        layoutChanged()
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
        $html.toggleClass(SHOW_CLASS)
        $document.trigger(EVENT.TOGGLE, isSidebarVisible())
      }
    }

    function layoutChanged(save = false) {
      const width = $sidebar.outerWidth()
      adapter.updateLayout(isTogglerVisible(), isSidebarVisible(), width)
      if (save === true) {
        store.set(STORE.WIDTH, width)
      }
    }

    function isSidebarVisible() {
      return $html.hasClass(SHOW_CLASS)
    }

    function isTogglerVisible() {
      return $toggler.is(':visible')
    }
  }
})
