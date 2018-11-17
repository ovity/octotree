class ErrorView {
  constructor($dom, store) {
    this.store = store;
    this.$this = $(this);
    this.$view = $dom.find('.octotree_errorview').submit((event) => {
      event.preventDefault();

      const $goToSetting = this.getGoToSettingButton();
      if ($goToSetting.is(':visible')) {
        this.$this.trigger(EVENT.VIEW_CLOSE, {optionView: true});
      }
    });
  }

  show(err) {
    const $goToSetting = this.getGoToSettingButton();
    const $help = $goToSetting.next();

    this.$view.find('.octotree_view_header').html(err.error);
    this.$view.find('.message').html(err.message);

    if (err.needAuth) {
      $goToSetting.show();
      $help.show();
    }
    else {
      $goToSetting.hide();
      $help.hide();
    }

    this.$this.trigger(EVENT.VIEW_READY);
  }

  getGoToSettingButton() {
    return this.$view.find('button[type="submit"]');
  }
}
