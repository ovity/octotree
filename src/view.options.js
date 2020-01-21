class OptionsView {
  constructor($dom, adapter) {
    this.adapter = adapter;
    this.$toggler = $dom.find('.octotree-settings').click(this.toggle.bind(this));
    this.$view = $dom.find('.octotree-settings-view').submit((event) => {
      event.preventDefault();
      this.toggle(false);
    });

    this.$view.find('a.octotree-create-token').attr('href', this.adapter.getCreateTokenUrl());

    this.loadElements();

    // Hide options view when sidebar is hidden
    $(document).on(EVENT.TOGGLE, (event, visible) => {
      if (!visible) this.toggle(false);
    });
  }

  /**
   * Load elements with [data-store] attributes & attach enforeShowInRule to the
   * elements in the show in section. Invoke this if there are dynamically added
   * elements, so that they can be loaded and saved.
   */
  loadElements() {
    this.elements = this.$view.find('[data-store]').toArray();
  }

  /**
   * Toggles the visibility of this screen.
   */
  toggle(visibility) {
    if (visibility !== undefined) {
      if (this.$view.hasClass('current') === visibility) return;
      return this.toggle();
    }

    if (this.$toggler.hasClass('selected')) {
      this._save();
      this.$toggler.removeClass('selected');
      $(this).trigger(EVENT.VIEW_CLOSE);
    } else {
      this._load();
    }
  }

  _load() {
    this._eachOption(
      ($elm, key, value, cb) => {
        if ($elm.is(':checkbox')) {
          $elm.prop('checked', value);
        } else if ($elm.is(':radio')) {
          $elm.prop('checked', $elm.val() === value);
        } else {
          $elm.val(value);
        }
        cb();
      },
      () => {
        this.$toggler.addClass('selected');
        $(this).trigger(EVENT.VIEW_READY);
      }
    );
  }

  _save() {
    const changes = {};
    this._eachOption(
      async ($elm, key, value, cb) => {
        if ($elm.is(':radio') && !$elm.is(':checked')) {
          return cb();
        }
        const newValue = $elm.is(':checkbox') ? $elm.is(':checked') : $elm.val();
        if (value === newValue) return cb();
        changes[key] = [value, newValue];
        await extStore.set(key, newValue);
        cb();
      },
      () => {}
    );
  }

  _eachOption(processFn, completeFn) {
    parallel(
      this.elements,
      async (elm, cb) => {
        const $elm = $(elm);
        const key = STORE[$elm.data('store')];
        const value = await extStore.get(key);

        processFn($elm, key, value, () => cb());
      },
      completeFn
    );
  }
}
