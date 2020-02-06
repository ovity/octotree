$(document).ready(() => {
  octotree.load(loadExtension);

  async function loadExtension(activationOpts = {}) {
    const $html = $('html');
    const $document = $(document);
    const $dom = $(TEMPLATE);
    const $sidebar = $dom.find('.octotree-sidebar');
    const $toggler = $sidebar.find('.octotree-toggle').hide();
    const $views = $sidebar.find('.octotree-view');
    const $spinner = $sidebar.find('.octotree-spin');
    const $pinner = $sidebar.find('.octotree-pin');
    const adapter = new GitHub();
    const treeView = new TreeView($dom, adapter);
    const optsView = new OptionsView($dom, adapter);
    const helpPopup = new HelpPopup($dom);
    const errorView = new ErrorView($dom);

    let currRepo = false;
    let hasError = false;

    $pinner.click(togglePin);
    await setupSidebarFloatingBehaviors();
    setHotkeys(await extStore.get(STORE.HOTKEYS));

    if (!$html.hasClass(ADDON_CLASS)) $html.addClass(ADDON_CLASS);

    $(window).resize((event) => {
      if (event.target === window) layoutChanged();
    });

    for (const view of [treeView, errorView, optsView]) {
      $(view)
        .on(EVENT.VIEW_READY, async function(event) {
          if (this !== optsView) {
            $document.trigger(EVENT.REQ_END);

            optsView.$toggler.removeClass('selected');

            if (adapter.isOnPRPage && await extStore.get(STORE.PR)) {
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
        .on(EVENT.FETCH_ERROR, (event, err) => showError(err));
    }

    $(extStore)
      .on(EVENT.STORE_CHANGE, optionsChanged);

    $document
      .on(EVENT.REQ_START, () => $spinner.addClass('octotree-spin--loading'))
      .on(EVENT.REQ_END, () => $spinner.removeClass('octotree-spin--loading'))
      .on(EVENT.LAYOUT_CHANGE, layoutChanged)
      .on(EVENT.TOGGLE_PIN, layoutChanged)
      .on(EVENT.LOC_CHANGE, (event, reload = false) => tryLoadRepo(reload));

    $sidebar
      .addClass(adapter.getCssClass())
      .width(Math.min(parseInt(await extStore.get(STORE.WIDTH)), 1000))
      .resize(() => layoutChanged(true))
      .appendTo($('body'));

    $document.trigger(EVENT.SIDEBAR_HTML_INSERTED);

    adapter.init($sidebar);
    await helpPopup.init();

    await octotree.activate(
      {
        adapter,
        $document,
        $dom,
        $sidebar,
        $toggler,
        $views,
        treeView,
        optsView,
        errorView
      },
      activationOpts
    );

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
          case STORE.LAZYLOAD:
          case STORE.ICONS:
            reload = true;
            break;
          case STORE.PR:
            reload = adapter.isOnPRPage;
            break;
          case STORE.HOVEROPEN:
            handleHoverOpenOption(newValue);
            break;
          case STORE.HOTKEYS:
            setHotkeys(newValue, oldValue);
            break;
          case STORE.PINNED:
            onPinToggled(newValue);
            break;
        }
      });

      if (await octotree.applyOptions(changes)) {
        reload = true;
      }

      if (reload) {
        await tryLoadRepo(true);
      }
    }

    async function tryLoadRepo(reload) {
      const token = await octotree.getAccessToken();
      await adapter.getRepoFromPath(currRepo, token, async (err, repo) => {
        if (err) {
          // Error making API, likely private repo but no token
          await showError(err);
          if (!isSidebarVisible()) {
            $toggler.show();
          }
        } else if (repo) {
          if (await extStore.get(STORE.PINNED) && !isSidebarVisible()) {
            // If we're in pin mode but sidebar doesn't show yet, show it.
            // Note if we're from another page back to code page, sidebar is "pinned", but not visible.
            if (isSidebarPinned()) await toggleSidebar();
            else await onPinToggled(true);
          } else if (isSidebarVisible()) {
            const replacer = ['username', 'reponame', 'branch', 'pullNumber'];
            const repoChanged = JSON.stringify(repo, replacer) !== JSON.stringify(currRepo, replacer);
            if (repoChanged || reload === true) {
              hasError = false;
              $document.trigger(EVENT.REQ_START);
              currRepo = repo;
              treeView.show(repo, token);
            } else {
              await treeView.syncSelection(repo);
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
        await layoutChanged();
      });
    }

    function showView(view) {
      $views.removeClass('current');
      view.$view.addClass('current');
      $(view).trigger(EVENT.VIEW_SHOW);
    }

    async function showError(err) {
      hasError = true;
      errorView.show(err);

      if (await extStore.get(STORE.PINNED)) await togglePin(true);
    }

    async function toggleSidebar(visibility) {
      if (visibility !== undefined) {
        if (isSidebarVisible() === visibility) return;
        await toggleSidebar();
      } else {
        $html.toggleClass(SHOW_CLASS);
        $document.trigger(EVENT.TOGGLE, isSidebarVisible());

        // Ensure the repo is loaded when the sidebar shows after being hidden.
        // Note that tryLoadRepo() already takes care of not reloading if nothing changes.
        if (isSidebarVisible()) {
          $toggler.show();
          await tryLoadRepo();
        }
      }

      return visibility;
    }

    async function togglePin(isPinned) {
      if (isPinned !== undefined) {
        if (isSidebarPinned() === isPinned) return;
        return togglePin();
      }

      const sidebarPinned = !isSidebarPinned();
      await extStore.set(STORE.PINNED, sidebarPinned);
      return sidebarPinned;
    }

    async function onPinToggled(isPinned) {
      if (isPinned === isSidebarPinned()) {
        return;
      }

      $pinner.toggleClass(PINNED_CLASS);

      const sidebarPinned = isSidebarPinned();
      $pinner.find('.tooltipped').attr('aria-label', `${sidebarPinned ? 'Unpin' : 'Pin'} this sidebar`);
      $document.trigger(EVENT.TOGGLE_PIN, sidebarPinned);
      await toggleSidebar(sidebarPinned);
    }

    async function layoutChanged(save = false) {
      const width = $sidebar.outerWidth();
      adapter.updateLayout(isSidebarPinned(), isSidebarVisible(), width);
      if (save === true) {
        await extStore.set(STORE.WIDTH, width);
      }
    }

    /**
     * Controls how the sidebar behaves in float mode (i.e. non-pinned).
     */
    async function setupSidebarFloatingBehaviors() {
      const MOUSE_LEAVE_DELAY = 400;
      const KEY_PRESS_DELAY = 4000;
      let isMouseInSidebar = false;

      handleHoverOpenOption(await extStore.get(STORE.HOVEROPEN));

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
        .on('mousemove', (event) => {
          // Don't do anything while hovering on Toggler
          const isHoveringToggler = $toggler.is(event.target) || $toggler.has(event.target).length;
          if (isHoveringToggler) return;

          isMouseInSidebar = true;
          clearTimer();

          if (!isSidebarVisible()) {
            toggleSidebar(true);
          }
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
      key(newKeys, async () => {
        if (await togglePin()) treeView.focus();
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
