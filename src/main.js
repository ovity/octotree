$(document).ready(() => {
  loadExtension();

  async function loadExtension() {
    const $html = $('html');
    const $document = $(document);
    const $dom = $(TEMPLATE);
    const $sidebar = $dom.find('.octotree-sidebar');
    const $toggler = $sidebar.find('.octotree-toggle');
    const $views = $sidebar.find('.octotree-view');
    const $spinner = $sidebar.find('.octotree-spin');
    const $pinner = $sidebar.find('.octotree-pin');
    const adapter = new GitHub(store);
    const treeView = new TreeView($dom, store, adapter);
    const optsView = new OptionsView($dom, store, adapter);
    const helpPopup = new HelpPopup($dom, store);
    const errorView = new ErrorView($dom, store);
    const footerView = new FooterView($dom);

    let currRepo = false;
    let hasError = false;

    $pinner.click(togglePin);
    setupSidebarFloatingBehaviors();
    setHotkeys(store.get(STORE.HOTKEYS));

    $html.hasClass(ADDON_CLASS) ? helpPopup.setShowInstallationWarning() : $html.addClass(ADDON_CLASS);

    $(window).resize((event) => {
      if (event.target === window) layoutChanged();
    });

    for (const view of [treeView, errorView, optsView]) {
      $(view)
        .on(EVENT.VIEW_READY, function(event) {
          if (this !== optsView) {
            $document.trigger(EVENT.REQ_END);

            if (adapter.isOnPRPage) {
              treeView.$tree.jstree('open_all');
            }
          }
          showView(this);
        })
        .on(EVENT.VIEW_CLOSE, (event, data) => {
          if (data && data.showSettings) {
            optsView.toggle(true);
          } else {
            showView(hasError ? errorView : treeView);
          }
        })
        .on(EVENT.OPTS_CHANGE, optionsChanged)
        .on(EVENT.FETCH_ERROR, (event, err) => showError(err));
    }

    $document
      .on(EVENT.REQ_START, () => $spinner.addClass('octotree-spin--loading'))
      .on(EVENT.REQ_END, () => $spinner.removeClass('octotree-spin--loading'))
      .on(EVENT.LAYOUT_CHANGE, layoutChanged)
      .on(EVENT.TOGGLE_PIN, layoutChanged)
      .on(EVENT.LOC_CHANGE, () => tryLoadRepo());

    $sidebar
      .addClass(adapter.getCssClass())
      .width(Math.min(parseInt(store.get(STORE.WIDTH)), 1000))
      .resize(() => layoutChanged(true))
      .appendTo($('body'));

    adapter.init($sidebar);
    helpPopup.init();
    footerView.init();

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
        const [oldValue, newValue] = changes[storeKey];

        switch (storeKey) {
          case STORE.TOKEN:
          case STORE.LOADALL:
          case STORE.ICONS:
          case STORE.PR:
            reload = true;
            break;
          case STORE.HOVEROPEN:
            handleHoverOpenOption(newValue);
            break;
          case STORE.HOTKEYS:
            setHotkeys(newValue, oldValue);
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
      const token = octotree.getAccessToken();
      adapter.getRepoFromPath(currRepo, token, (err, repo) => {
        if (err) {
          showError(err);
        } else if (repo) {
          if (store.get(STORE.PINNED) && !isSidebarVisible()) {
            // If we're in pin mode but sidebar doesn't show yet, show it.
            // Note if we're from another page back to code page, sidebar is "pinned", but not visible.
            if (isSidebarPinned()) toggleSidebar();
            else togglePin();
          } else if (isSidebarVisible()) {
            const replacer = ['username', 'reponame', 'branch', 'pullNumber'];
            const repoChanged = JSON.stringify(repo, replacer) !== JSON.stringify(currRepo, replacer);
            if (repoChanged || reload === true) {
              hasError = false;
              $document.trigger(EVENT.REQ_START);
              currRepo = repo;
              treeView.show(repo, token);
            } else {
              treeView.syncSelection(repo);
            }
          } else {
            // Sidebar not visible (because it's not pinned), show the toggler
            $toggler.show();
          }
        } else {
          // Not a repo or not to be shown in this page
          $toggler.hide();
          toggleSidebar(false);
        }
        layoutChanged();
      });
    }

    function showView(view) {
      $views.removeClass('current');
      view.$view.addClass('current');
      $(view).trigger(EVENT.VIEW_SHOW);
    }

    function showError(err) {
      hasError = true;
      errorView.show(err);

      if (store.get(STORE.PINNED)) togglePin(true);
    }

    function toggleSidebar(visibility) {
      if (visibility !== undefined) {
        if (isSidebarVisible() === visibility) return;
        toggleSidebar();
      } else {
        $html.toggleClass(SHOW_CLASS);
        $document.trigger(EVENT.TOGGLE, isSidebarVisible());

        // Ensure the repo is loaded when the sidebar shows after being hidden.
        // Note that tryLoadRepo() already takes care of not reloading if nothing changes.
        if (isSidebarVisible()) {
          $toggler.show();
          tryLoadRepo();
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
      $pinner.find('.tooltipped').attr('aria-label', `${sidebarPinned ? 'Unpin' : 'Pin'} this sidebar`);
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
      const MOUSE_LEAVE_DELAY = 500;
      const KEY_PRESS_DELAY = 4000;
      let isMouseInSidebar = false;

      handleHoverOpenOption(this.store.get(STORE.HOVEROPEN));

      // Immediately closes if click outside the sidebar.
      $document.on('click', () => {
        if (!isMouseInSidebar && !isSidebarPinned() && isSidebarVisible()) {
          toggleSidebar(false);
        }
      });

      $document.on('mouseover', () => {
        // Ensure startTimer being executed only once when mouse is moving outside the sidebar
        if (!timerId) {
          isMouseInSidebar = false;
          startTimer(MOUSE_LEAVE_DELAY);
        }
      });

      let timerId = null;

      const startTimer = (delay) => {
        if (!isMouseInSidebar && !isSidebarPinned()) {
          clearTimer();
          timerId = setTimeout(() => toggleSidebar(isSidebarPinned()), delay);
        }
      };
      const clearTimer = () => {
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
      };

      $sidebar
        .on('keyup', () => startTimer(KEY_PRESS_DELAY))
        .on('mouseover', (event) => {
          // Prevent mouseover from propagating to document
          event.stopPropagation();
        })
        .on('focusin mousemove', (event) => {
          // Don't do anything while hovering on Toggler
          const isHoveringToggler = $toggler.is(event.target) || $toggler.has(event.target).length;

          if (isHoveringToggler) return;

          /**
           * Use 'focusin' instead of 'mouseenter' to handle the case when clicking a file in the
           * sidebar then move outside -> 'mouseenter' is triggered in sidebar, clear the timer
           * and keep sidebar open.
           */
          isMouseInSidebar = true;
          clearTimer();

          if (event.type === 'mousemove' && !isSidebarVisible()) toggleSidebar(true);
        });
    }

    function onTogglerHovered() {
      toggleSidebar(true);
    }

    function onTogglerClicked(event) {
      event.stopPropagation();
      toggleSidebar(true);
    }

    function handleHoverOpenOption(enableHoverOpen) {
      if (enableHoverOpen) {
        $toggler.off('click', onTogglerClicked);
        $toggler.on('mouseenter', onTogglerHovered);
      } else {
        $toggler.off('mouseenter', onTogglerHovered);
        $toggler.on('click', onTogglerClicked);
      }
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
  }
});
