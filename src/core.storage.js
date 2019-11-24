class ExtStore {
  constructor(values, defaults) {
    this._isInitialized = false;
    this._isSafari = isSafari();

    // Initialize default values
    this._init = async () => {
      if (this._isInitialized) return;

      await Promise.all(Object.keys(values).map(async (key) => {
        const existingVal = await this._innerGet(values[key]);
        if (existingVal == null) {
          await this._innerSet(values[key], defaults[key]);
        }
      }));

      this._isInitialized = true;
    }

    if (!this._isSafari) {
      this._setInExtensionStorage = promisify(chrome.storage.local, 'set');
      this._getInExtensionStorage = promisify(chrome.storage.local, 'get');
      this._removeInExtensionStorage = promisify(chrome.storage.local, 'remove');
    }
  }

  // Public
  async set(key, value) {
    if (!this._isInitialized) await this._init();
    return this._innerSet(key, value);
  }

  async get(key) {
    if (!this._isInitialized) await this._init();
    return this._innerGet(key);
  }

  async remove(key) {
    if (!this._isInitialized) await this._init();
    return this._innerRemove(key);
  }

  async setIfNull(key, val) {
    const existingVal = await this.get(key);
    if (existingVal == null) {
      await this.set(key, val);
    }
  }

  // Private
  async _innerGet (key) {
    const result = (key.endsWith('local') || this._isSafari)
      ? await this._getLocal(key)
      : await this._getInExtensionStorage(key);

    return result[key];
  }

  _innerSet (key, value) {
    const payload = {[key]: value};
    return (key.endsWith('local') || this._isSafari)
      ? this._setLocal(payload)
      : this._setInExtensionStorage(payload);
  }

  _innerRemove (key) {
    return (key.endsWith('local') || this._isSafari)
      ? this._removeLocal(key)
      : this._removeInExtensionStorage(key);
  }

  _getLocal (key) {
    return new Promise((resolve) => {
      const value = parse(localStorage.getItem(key));
      resolve({[key]: value});
    });

    function parse(val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    }
  }

  _setLocal (obj) {
    return new Promise((resolve) => {
      const entries = Object.entries(obj);

      if (entries.length > 0) {
        const [key, value] = entries[0];
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          const msg =
            'Octotree cannot save its settings. ' +
            'If the local storage for this domain is full, please clean it up and try again.';
          console.error(msg, e);
        }
        resolve();
      }
    });
  }

  _removeLocal (key) {
    return new Promise((resolve) => {
      localStorage.removeItem(key);
      resolve();
    });
  }
}

function promisify(fn, method) {
  if (typeof fn[method] !== 'function') {
    throw new Error(`promisify: fn does not have ${method} method`);
  }

  return function(...args) {
    return new Promise(function(resolve, reject) {
      fn[method](...args, function(res) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(res);
        }
      });
    });
  };
}

window.extStore = new ExtStore(STORE, DEFAULTS)
