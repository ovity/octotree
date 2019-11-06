class HelpPopup {
  constructor($dom) {
    this.$view = $dom.find('.popup');
  }

  async init() {
    const $view = this.$view;
    const store = extStore;
    const popupShown = await extStore.get(STORE.POPUP);
    const sidebarVisible = $('html').hasClass(SHOW_CLASS);

    if (popupShown || sidebarVisible) {
      return hideAndDestroy();
    }

    $(document).one(EVENT.TOGGLE, hideAndDestroy);

    setTimeout(() => {
      setTimeout(hideAndDestroy, 10000);
      $view.addClass('show').click(hideAndDestroy);
    }, 500);

    async function hideAndDestroy() {
      await store.set(STORE.POPUP, true);
      if ($view.hasClass('show')) {
        $view.removeClass('show').one('transitionend', () => $view.remove());
      } else {
        $view.remove();
      }
    }
  }
}
