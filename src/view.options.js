const browser = chrome || browser;
const ads = [
  {
    url: browser.runtime.getURL('images/4b43f36.png'),
    title: 'Multiple themes',
    duration: 2000,
  },
  {
    url: browser.runtime.getURL('images/8cf16fd.png'),
    title: 'Change sidebar docking',
    duration: 2000,
  },
  {
    url: browser.runtime.getURL('images/b08f126.gif'),
    title: 'GitHub on steroids',
    duration: 2000,
  },
];

class OptionsView {
  constructor($dom, store, adapter) {
    this.store = store;
    this.adapter = adapter;
    this.$adSlides = $dom.find('.octotree-ad-slides').click(this._handleNextSlide.bind(this));
    this.currentSlideIndex = 0;
    this.currentSlideTime;
    this.$toggler = $dom.find('.octotree-settings').click(this.toggle.bind(this));
    this.$view = $dom.find('.octotree-settings-view').submit((event) => {
      event.preventDefault();
      this.toggle(false);
    });
    this.$view.find('a.octotree-create-token').attr('href', this.adapter.getCreateTokenUrl());

    this.loadElements();
    this._handleSliderShow();

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

  _handleSliderShow() {
    $(this)
      .on(EVENT.VIEW_CLOSE, this._clearSlideTimeOut)
      .on(EVENT.VIEW_READY, this._nextSlide);
  }

  _nextSlide() {
    this.$adSlides.find('img').attr('src', ads[this.currentSlideIndex].url);
    this.$adSlides.find('.octotree-feature-text').text(ads[this.currentSlideIndex].title);
    this.currentSlideTime = setTimeout(() => {
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
    clearTimeout(this.currentSlideTime);
  }
}
