class OptionsView {
  constructor($dom, store, adapter) {
    this.store = store;
    this.adapter = adapter;
    this.$toggler = $dom.find('.octotree_opts').click(this.toggle.bind(this));
    this.$view = $dom.find('.octotree_optsview').submit((event) => {
      event.preventDefault();
      this.toggle(false);
    });

    this.loadElements();

    // Hide options view when sidebar is hidden
    $(document).on(EVENT.TOGGLE, (event, visible) => {
      if (!visible) this.toggle(false);
    });
  }

  /**
   * Load elements with [data-store] attributes. Invoke this if there are dynamically
   * added elements, so that they can be loaded and saved.
   */
  loadElements() {
    this.elements = this.$view.find('[data-store]').toArray();
  }

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
    const getTokenLink = this.$view.find('a[data-id="getLinkGenToken"]');
    getTokenLink.attr("href", this.adapter.getCreateTokenUrl());

    this._eachOption(
      ($elm, key, value, cb) => {
        if ($elm.is(':checkbox')) $elm.prop('checked', value);
        else $elm.val(value);
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
      ($elm, key, value, cb) => {
        const newValue = $elm.is(':checkbox') ? $elm.is(':checked') : $elm.val();
        if (value === newValue) return cb();
        changes[key] = [value, newValue];
        this.store.set(key, newValue, cb);
      },
      () => {
        if (Object.keys(changes).length) {
          $(this).trigger(EVENT.OPTS_CHANGE, changes);
        }
      }
    );
  }

  _eachOption(processFn, completeFn) {
    parallel(
      this.elements,
      (elm, cb) => {
        const $elm = $(elm);
        const key = STORE[$elm.data('store')];

        this.store.get(key, (value) => {
          processFn($elm, key, value, () => cb());
        });
      },
      completeFn
    );
  }
}
