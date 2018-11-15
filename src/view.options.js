class OptionsView {
  constructor($dom, store) {
    this.$this = $(this);
    this.store = store;
    this.$view = $dom.find('.octotree_optsview');
    this.$toggler = $dom.find('.octotree_opts').click(this._toggle.bind(this));
    this.elements = this.$view.find('[data-store]').toArray();
    this.optionChanges = {};

    // Hide options view when sidebar is hidden
    $(document).on(EVENT.TOGGLE, (event, visible) => {
      if (!visible) this._toggle(false);
    });
  }

  _toggle(visibility) {
    if (visibility !== undefined) {
      if (this.$view.hasClass('current') === visibility) return;
      return this._toggle();
    }

    if (this.$toggler.hasClass('selected')) {
      this.$toggler.removeClass('selected');

      // The close event of option view is a hint that options don't change any more.
      // Broadcasts the event so that other places can response with new option values
      this.$this.trigger(EVENT.OPTS_CHANGE, this.optionChanges);

      this.$this.trigger(EVENT.VIEW_CLOSE);
    } else {
      this._load();
    }
  }

  _load() {
    this._eachOption(
      ($elm, key, value, cb) => {
        const checkboxElement = $elm.is(':checkbox')

        if (checkboxElement) $elm.prop('checked', value);
        else $elm.val(value);

        // Attaches (once) on value change event
        if (!$elm.data('octotree-on-change-event-attached')) {
          $elm.data('octotree-on-change-event-attached', true);
          const boundOnChange = this._saveOption.bind(this, $elm, key);

          if (checkboxElement) {
            $elm.change(boundOnChange);
          }
          else {
            $elm.blur(() => {
              /*
               * Certainly not a good place to put this logic but Chrome requires
               * permissions to be requested only in response of user input. So...
               */
              // @ifdef SUPPORT_GHE
              if ($elm.data('store') === 'GHEURLS') {
                const $ta = this.$view.find('[data-store$=EURLS]').filter(':visible');
                if ($ta.length > 0) {
                  const storeKey = $ta.data('store');
                  const urls = $ta
                    .val()
                    .split(/\n/)
                    .filter((url) => url !== '');

                  if (urls.length > 0) {
                    chrome.runtime.sendMessage({type: 'requestPermissions', urls: urls}, (granted) => {
                      if (!granted) {
                        // Permissions not granted (by user or error), reset value
                        $ta.val(this.store.get(STORE[storeKey]));
                      }

                      boundOnChange();
                    });

                    return;
                  }
                }
              }
              // @endif

              boundOnChange();
            });
          }
        }

        cb();
      },
      () => {
        this.optionChanges = {}; // begins recording changes
        this.$toggler.addClass('selected');
        this.$this.trigger(EVENT.VIEW_READY);
      }
    );
  }

  _saveOption($elm, key) {
    this.store.get(key, (value) => {
      const newValue = $elm.is(':checkbox') ? $elm.is(':checked') : $elm.val();

      if (value === newValue) return;

      this.optionChanges[key] = [value, newValue] // saves the latest change of an option

      this.store.set(key, newValue, () => {
        this.$this.trigger(EVENT.OPT_ITEM_CHANGE, {key, value, newValue});
      });
    });
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
