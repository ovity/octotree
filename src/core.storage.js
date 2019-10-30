
class ExtStore {
  constructor() {
    this._setLocal = function (obj) {
      return new Promise(function (resolve) {
        const entries = Object.entries(obj);

        if (entries.length > 0) {
          const [key, value] = entries[0];
          window.localStorage.setItem(key, value);
          resolve();
        }
      });
    }

    this._getLocal = function (key) {
      return new Promise(function (resolve) {
        const value = window.localStorage.getItem(key);
        resolve({[key]: value});
      });
    };

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

  static create(values, defaults) {
    const store = new ExtStore();
    return Promise.all(Object.keys(values).map((key) => {
      return store.setIfNull(values[key], defaults[key]);
    }))
      .then(() => store);
  }

  set(key, value) {
    const payload = {[key]: value};
    return key === STORE.TOKEN
      ? this._setLocal(payload)
      : this._setAsync(payload);
  }

  async get(key) {
    const result = key === STORE.TOKEN
      ? await this._getLocal(key)
      : await this._getAsync(key);

    return result[key];
  }

  remove(key) {
    return this._removeAsync(key);
  }

  async setIfNull(key, val) {
    const existingVal = await this.get(key);
    if (existingVal == null) {
      await this.set(key, val);
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
