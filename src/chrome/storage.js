function Storage() {}

Storage.prototype.set = function(key, val, local, cb) {
  if (typeof local === 'function') {
    cb = local
    local = false
  }
  if (local) {
    localStorage.setItem(key, JSON.stringify(val))
    cb()
  }
  else {
    var item = {}
    item[key] = val
    chrome.storage.local.set(item, cb)
  }
}

Storage.prototype.get = function(key, local, cb) {
  if (typeof local === 'function') {
    cb = local
    local = false
  }
  if (local) cb(parse(localStorage.getItem(key)))
  else chrome.storage.local.get(key, function(item) {
    cb(item[key])
  })

  function parse(val) {
    try {
      return JSON.parse(val)
    } catch (e) {
      return val
    }
  }
}