$(document).ready(() => {
  loadExtension();

  async function loadExtension() {
    const $html = $('html');
    const $document = $(document);
    const $dom = $(TEMPLATE);
    const $sidebar = $dom.find('.octotree-sidebar');
    const $toggler = $sidebar.find('.octotree_toggle');
    const $views = $sidebar.find('.octotree_view');
    const $spinner = $sidebar.find('.octotree_spin');
    const $pinner = $sidebar.find('.octotree_pin');
    const adapter = new GitHub(store);
    const treeView = new TreeView($dom, store, adapter);
    const optsView = new OptionsView($dom, store, adapter);
    const helpPopup = new HelpPopup($dom, store);
    const errorView = new ErrorView($dom, store);
    let currRepo = false;
    let hasError = false;

    $pinner.click(togglePin);
    setupSidebarFloatingBehaviors();
    setHotkeys(store.get(STORE.HOTKEYS));

    $html.addClass(ADDON_CLASS);

    $(window).resize((event) => {
      if (event.target === window) layoutChanged();
    });

    for (const view of [treeView, errorView, optsView]) {
      $(view)
        .on(EVENT.VIEW_READY, function(event) {
          if (this !== optsView) {
            $document.trigger(EVENT.REQ_END);
          }
          showView(this.$view);
        })
        .on(EVENT.VIEW_CLOSE, (event, data) => {
          if (data && data.showSettings) {
            optsView.toggle(true);
          } else {
            showView(hasError ? errorView.$view : treeView.$view);
          }
        })
        .on(EVENT.OPTS_CHANGE, optionsChanged)
        .on(EVENT.FETCH_ERROR, (event, err) => showError(err));
    }

    $document
      .on(EVENT.REQ_START, () => $spinner.addClass('octotree_loading'))
      .on(EVENT.REQ_END, () => $spinner.removeClass('octotree_loading'))
      .on(EVENT.LAYOUT_CHANGE, layoutChanged)
      .on(EVENT.TOGGLE_PIN, layoutChanged)
      .on(EVENT.LOC_CHANGE, () => tryLoadRepo());

    $sidebar
      .addClass(adapter.getCssClass())
      .width(parseInt(store.get(STORE.WIDTH)))
      .resize(() => layoutChanged(true))
      .appendTo($('body'));

    adapter.init($sidebar);

    await pluginManager.activate({
      adapter,
      $document,
      $dom,
      $sidebar,
      $toggler,
      $views,
      treeView,
      optsView,
      errorView
    });

    return tryLoadRepo();

    /**
     * Invoked when the user saves the option changes in the option view.
     * @param {!string} event
     * @param {!Object<!string, [(string|boolean), (string|boolean)]>} changes
     */
    async function optionsChanged(event, changes) {
      let reload = false;

      Object.keys(changes).forEach((storeKey) => {
        const [oldKeys, newKeys] = changes[storeKey];

        switch (storeKey) {
          case STORE.TOKEN:
          case STORE.LOADALL:
          case STORE.ICONS:
          case STORE.PR:
            reload = true;
            break;
          case STORE.HOTKEYS:
            setHotkeys(newKeys, oldKeys);
            break;
        }
      });

      if (await pluginManager.applyOptions(changes)) {
        reload = true;
      }

      if (reload) {
        tryLoadRepo(true);
      }
    }

    function tryLoadRepo(reload) {
      const pinned = store.get(STORE.PINNED);
      const token = octotree.getAccessToken();

      adapter.getRepoFromPath(currRepo, token, (err, repo) => {
        if (err) {
          showError(err);
        } else if (repo) {
          if (pinned) togglePin(true);

          if (isSidebarVisible()) {
            const replacer = ['username', 'reponame', 'branch', 'pullNumber'];
            const repoChanged = JSON.stringify(repo, replacer) !== JSON.stringify(currRepo, replacer);
            if (repoChanged || reload === true) {
              hasError = false;
              $document.trigger(EVENT.REQ_START);
              currRepo = repo;
              treeView.show(repo, token);
            } else {
              treeView.syncSelection();
            }
          }
        } else {
          $toggler.hide();
          toggleSidebar(false);
        }
        helpPopup.init();
        layoutChanged();
      });
    }

    function showView(view) {
      $views.removeClass('current');
      view.addClass('current');
    }

    function showError(err) {
      hasError = true;
      errorView.show(err);
      toggleSidebar(true);
    }

    function toggleSidebar(visibility) {
      if (visibility !== undefined) {
        if (isSidebarVisible() === visibility) return;
        toggleSidebar();
      } else {
        $html.toggleClass(SHOW_CLASS);
        $document.trigger(EVENT.TOGGLE, isSidebarVisible());

        // Ensure the repo is loaded when the sidebar shows for the first time.
        // Note that tryLoadRepo() already takes care of not reloading if nothing changes.
        if (isSidebarVisible()) {
          $toggler.hide();
          tryLoadRepo();
        } else {
          $toggler.show();
        }
      }

      return visibility;
    }

    function togglePin(isPinned) {
      if (isPinned !== undefined) {
        if (isSidebarPinned() === isPinned) return;
        return togglePin();
      }

      $pinner.toggleClass(PINNED_CLASS);

      const sidebarPinned = isSidebarPinned();
      $pinner.find('.tooltipped').attr('aria-label', `${sidebarPinned ? 'Pin' : 'Unpin'} octotree to the page`);
      $document.trigger(EVENT.TOGGLE_PIN, sidebarPinned);
      store.set(STORE.PINNED, sidebarPinned);
      toggleSidebar(sidebarPinned);
      return sidebarPinned;
    }

    function layoutChanged(save = false) {
      const width = $sidebar.outerWidth();
      adapter.updateLayout(isSidebarPinned(), isSidebarVisible(), width);
      if (save === true) {
        store.set(STORE.WIDTH, width);
      }
    }

    /**
     * Controls how the sidebar behaves in float mode (i.e. non-pinned).
     */
    function setupSidebarFloatingBehaviors() {
      // Opens when mouse is over the handle.
      $toggler.mouseenter(() => toggleSidebar(true));

      // Immediately closes if click outside the sidebar.
      $document.on('click', (event) => {
        if (!isSidebarPinned() && isSidebarVisible() && isOutsideSidebar(event.target)) {
          toggleSidebar(false);
        }
      });

      // Starts a timer when users leave the sidebar or navigate the tree using keyboard.
      // Clear the timer when users move mouse on the sidebar (don't use mouse enter, won't work).
      let timerId = null;
      const resetTimer = (delay) => {
        if (!isSidebarPinned()) {
          clearTimer();
          timerId = setTimeout(() => toggleSidebar(isSidebarPinned()), delay);
        }
      };
      const clearTimer = () => timerId && clearTimeout(timerId);
      $sidebar.on('keyup mouseleave', () => resetTimer(SIDEBAR_HIDING_DELAY));
      $sidebar.on('mousemove', clearTimer);
    }

    /**
     * Set new hot keys to pin or unpin the sidebar.
     * @param {string} newKeys
     * @param {string?} oldKeys
     */
    function setHotkeys(newKeys, oldKeys) {
      key.filter = () => $sidebar.is(':visible');
      if (oldKeys) key.unbind(oldKeys);
      key(newKeys, () => {
        if (togglePin()) treeView.focus();
      });
    }

    function isSidebarVisible() {
      return $html.hasClass(SHOW_CLASS);
    }

    function isSidebarPinned() {
      return $pinner.hasClass(PINNED_CLASS);
    }

    function isOutsideSidebar(selector) {
      return !$(selector).closest($sidebar).length;
    }
  }
});
