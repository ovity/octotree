class HelpPopup {
  constructor($dom, store) {
    this.$view = $dom.find('.popup');
    this.store = store;
    this.showInstallationWarning = false;
  }

  init() {
    const $view = this.$view;
    const store = this.store;
    const popupShown = store.get(STORE.POPUP);
    const sidebarVisible = $('html').hasClass(SHOW_CLASS);

    if (this.showInstallationWarning) {
      $view
        .find('.content')
        .text('You currently have 2 versions of Octotree installed. Please uninstall one of the them.');
    } else if (popupShown || sidebarVisible) {
      return hideAndDestroy();
    }

    $(document).one(EVENT.TOGGLE, hideAndDestroy);

    setTimeout(() => {
      setTimeout(hideAndDestroy, 10000);
      $view.addClass('show').click(hideAndDestroy);
    }, 500);

    function hideAndDestroy() {
      store.set(STORE.POPUP, true);
      if ($view.hasClass('show')) {
        $view.removeClass('show').one('transitionend', () => $view.remove());
      } else {
        $view.remove();
      }
    }
  }

  setShowInstallationWarning() {
    this.showInstallationWarning = true;
  }
}
