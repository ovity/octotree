function Storage() {}

Storage.prototype.set = function(key, val, local, cb) {
  if (typeof local === 'function') {
    cb = local
    local = false
  }

  cb = cb || function() {}

  localStorage.setItem(key, JSON.stringify(val))
  cb()
}

Storage.prototype.get = function(key, local, cb) {
  if (typeof local === 'function') {
    cb = local
    local = false
  }

  cb = cb || function() {}

  cb(parse(localStorage.getItem(key)))

  function parse(val) {
    try {
      return JSON.parse(val)
    } catch (e) {
      return val
    }
  }
}