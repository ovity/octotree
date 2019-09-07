const browser = chrome || browser;
const ads = [
  {
    url: browser.runtime.getURL('images/pro-themes.gif'),
    title: 'Multiple themes',
    duration: 10000
  },
  {
    url: browser.runtime.getURL('images/pro-pr.gif'),
    title: 'Enhanced pull request review',
    duration: 20000
  },
  {
    url: browser.runtime.getURL('images/pro-overview.gif'),
    title: 'Dock and search',
    duration: 10000
  }
];

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

    this.$adSlides = $dom.find('.octotree-pro-feature').click(this._handleNextSlide.bind(this));
    this.currentSlideIndex = 0;
    this.currentSlideTimer;

    this.loadElements();
    this._initSlides();

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
        } else if ($elm.is('select')) {
          $elm.find(`option[value="${value}"]`).prop('selected', 'selected');
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
      ($elm, key, value, cb) => {
        if ($elm.is(':radio') && !$elm.is(':checked')) {
          return cb();
        }
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

  _initSlides() {
    $(this)
      .on(EVENT.VIEW_CLOSE, () => this._clearSlideTimeOut())
      .on(EVENT.VIEW_READY, () => this._nextSlide());
  }

  _nextSlide() {
    this.$adSlides.find('img').attr('src', ads[this.currentSlideIndex].url);
    this.$adSlides.find('.octotree-pro-feature-desc').text(ads[this.currentSlideIndex].title);
    this.currentSlideTimer = setTimeout(() => {
      this._handleNextSlide();
    }, ads[this.currentSlideIndex].duration);
  }

  _handleNextSlide() {
    if (this.currentSlideIndex === ads.length - 1) {
      this.currentSlideIndex = 0;
    } else {
      this.currentSlideIndex++;
    }
    this._clearSlideTimeOut();
    this._nextSlide();
  }

  _clearSlideTimeOut() {
    clearTimeout(this.currentSlideTimer);
  }
}
