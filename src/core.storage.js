class ExtStore {
  constructor(values, defaults) {
    this._isSafari = isSafari();
    this._siteDomain = this._getCurrentSiteDomain();
    this._tempChanges = {};

    if (!this._isSafari) {
      this._setInExtensionStorage = promisify(chrome.storage.local, 'set');
      this._getInExtensionStorage = promisify(chrome.storage.local, 'get');
      this._removeInExtensionStorage = promisify(chrome.storage.local, 'remove');
    }

    // Initialize default values
    this._init = Promise.all(
      Object.keys(values).map(async (key) => {
        const existingVal = await this._innerGet(values[key]);
        if (existingVal === undefined || existingVal === null) {
          await this._innerSet(values[key], defaults[key]);
        }
      })
    ).then(() => {
      this._init = null;
      this._setupOnChangeEvent();
    });
  }

  _setupOnChangeEvent() {
    window.addEventListener('storage', (evt) => {
      if (this._isOctotreeKey(evt.key)) {
        this._notifyChange(evt.key, _parse(evt.oldValue), _parse(evt.newValue));
      }
    });

    if (!this._isSafari) {
      chrome.storage.onChanged.addListener((changes) => {
        Object.entries(changes).forEach(([key, change]) => {
          if (this._isOctotreeKey(key)) {
            this._notifyChange(key, change.oldValue, change.newValue);
          }
        });
      });
    }
  }

  _isOctotreeKey(key) {
    return key.startsWith('octotree');
  }

  // Debounce and group the trigger of EVENT.STORE_CHANGE because the
  // changes are all made one by one
  _notifyChange(key, oldVal, newVal) {
    this._tempTimer && clearTimeout(this._tempTimer);
    this._tempChanges[key] = [oldVal, newVal];
    this._tempTimer = setTimeout(() => {
      $(this).trigger(EVENT.STORE_CHANGE, this._tempChanges);
      this._tempTimer = null;
      this._tempChanges = {};
    }, 50);
  }

  // Public
  async set(key, value) {
    if (this._init) await this._init;
    return this._innerSet(key, value);
  }

  async get(key) {
    if (this._init) await this._init;
    const value = await this._innerGet(key);
    
    if (this._isPerHost(key)) {
      return value[this._siteDomain];
    }

    return value;
  }

  async remove(key) {
    if (this._init) await this._init;
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
    const result = this._isSafari
      ? await this._getLocal(key)
      : await this._getInExtensionStorage(key);
      
    return result[key];
  }

  async _innerSet (key, value) {
    const currentStore = await this._innerGet(key);
    const payload = {[key]: value};

    if (this._isPerHost(key) && currentStore) {
      currentStore[this._siteDomain] = value;
      payload[key] = currentStore;  
    }

    return this._isSafari 
      ? this._setLocal(payload) 
      : this._setInExtensionStorage(payload);
  }

  _innerRemove (key) {
    return this._isSafari 
      ? this._removeLocal(key) 
      : this._removeInExtensionStorage(key);
  }

  _getLocal (key) {
    return new Promise((resolve) => {
      const value = _parse(localStorage.getItem(key));
      resolve({[key]: value});
    });
  }

  _setLocal (obj) {
    return new Promise(async (resolve) => {
      const entries = Object.entries(obj);

      if (entries.length > 0) {
        const [key, newValue] = entries[0];
        try {
          const value = JSON.stringify(newValue);
          if (!this._init) {
            // Need to notify the changes programmatically since window.onstorage event only
            // get triggerred if the changes are from other tabs
            const oldValue = (await this._getLocal(key))[key];
            this._notifyChange(key, oldValue, newValue);
          }
          localStorage.setItem(key, value);
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

  _getCurrentSiteDomain() {
    return location.protocol + '//' + location.host;
  }

  _isPerHost(key) {
    return key.endsWith('perhost');
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

function _parse (val) {
  try {
    return JSON.parse(val);
  } catch (_) {
    return val
  }
}

window.extStore = new ExtStore(STORE, DEFAULTS)
