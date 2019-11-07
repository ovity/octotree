
class ExtStore {
  constructor(values, defaults) {
    this._isInit = false;

    this._init = async function () {
      if (this._isInit) return;
  
      await Promise.all(Object.keys(values).map((key) => {
        return this.setIfNull(values[key], defaults[key]);
      }));
  
      this._isInit = true;
    }

    this._removeLocal = promisify(window.localStorage, 'removeItem');

    // Safari hasn't supported storage at extension level yet. Fallback to localstorage
    if (isSafari()) {
      this._setAsync = this._setLocal;
      this._getAsync = this._getLocal;
      this._removeAsync = this._removeLocal;
    } else {
      this._setAsync = promisify(chrome.storage.local, 'set');
      this._getAsync = promisify(chrome.storage.local, 'get');
      this._removeAsync = promisify(chrome.storage.local, 'remove');
    }
  }

  _getLocal (key) {
    return new Promise(function (resolve) {
      var value = parse(localStorage.getItem(key));
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
    return new Promise(function (resolve) {
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

  async _innerGet (key) {
    const result = key.endsWith('local')
      ? await this._getLocal(key)
      : await this._getAsync(key);

    return result[key];
  }

  _innerSet (key, value) {
    const payload = {[key]: value};
    return key.endsWith('local')
      ? this._setLocal(payload)
      : this._setAsync(payload);
  }

  async set(key, value) {
    if (!this._isInit) await this._init();

    return this._innerSet(key, value);
  }

  async get(key) {
    if (!this._isInit) await this._init();

    return this._innerGet(key);
  }

  remove(key) {
    return this._removeAsync(key);
  }

  async setIfNull(key, val) {
    const existingVal = await this._innerGet(key);
    if (existingVal == null) {
      await this._innerSet(key, val);
    }
  }
}

/**
 *
 * @param {context function} fn
 * @param {method in context function} method
 *
 * Passing method to call context function in order to remain the context execution
 */
function promisify(fn, method) {
  if (typeof fn[method] !== 'function') {
    throw new Error(`promisify: fn does not have ${method} method`);
  }

  return function(...args) {
    return new Promise(function(resolve, reject) {
      fn[method](...args, function(res) {
        // No method for detecting error in Safari extension
        if (isSafari()) {
          return resolve(res);
        }

        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(res);
        }
      });
    });
  };
}

function isSafari() {
  return typeof safari !== 'undefined' && safari.self && typeof safari.self.addEventListener === 'function';
}

window.extStore = new ExtStore(STORE, DEFAULTS)
