class _DeXss {
  constructor() {
    this._$dummyDiv = $('<div/>');
  }

  deXss = (str) => this._$dummyDiv.text(str).html();
}

// Singleton
window.deXss = new _DeXss().deXss;
