(() => {
  const oldSet = Storage.prototype.set
  Storage.prototype.set = function (key, val, cb) {
    this._cache = this._cache || {}
    this._cache[key] = val

    const shared = ~key.indexOf('.shared')
    if (shared) chrome.storage.local.set({[key]: val}, cb || Function())
    else oldSet.call(this, key, val, cb)
  }

  const oldGet = Storage.prototype.get
  Storage.prototype.get = function (key, cb) {
    this._cache = this._cache || {}
    if (!cb) return this._cache[key]

    const shared = ~key.indexOf('.shared')
    if (shared) chrome.storage.local.get(key, (item) => cb(item[key]))
    else oldGet.call(this, key, cb)
  }
})()
