class OptionsView {
  constructor($dom, store, adapter) {
    this.store = store;
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

    this.showInCheckboxes = this.$view.find('#settings-showin [data-store]')
      .toArray()
      .map(el => $(el))

    this.showInCheckboxes.forEach($el => $el.change(() => this._enforceShowInRule()))
  }

  /**
   * Make sure there's always at least 1 option in the show in section is checked
   * so that the octotree would not totally vanish.
   */
  _enforceShowInRule() {
    let numberOfChecked = 0;
    let theOnlyChecked = null;
    for (const checkbox of this.showInCheckboxes) {
      if (checkbox.attr('disabled')) {
        checkbox.removeAttr('disabled');
      }

      if (!checkbox.is(':checked')) continue;

      if (++numberOfChecked === 1) {
        theOnlyChecked = checkbox;
      } else {
        theOnlyChecked = null;
        break;
      }
    }

    if (!numberOfChecked) {
      this.showInCheckboxes[0].prop('checked', true);
    }

    if (theOnlyChecked) {
      theOnlyChecked.attr('disabled', true);
    }
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
        if ($elm.is(':checkbox')) $elm.prop('checked', value);
        else $elm.val(value);
        cb();
      },
      () => {
        this._enforceShowInRule();
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
