function Storage() {}

Storage.prototype.set = function(key, val, local, cb) {
  if (typeof local === 'function') cb = local

  localStorage.setItem(key, JSON.stringify(val))
  if (cb) cb()
}

Storage.prototype.get = function(key, local, cb) {
  if (typeof local === 'function') cb = local

  var val = parse(localStorage.getItem(key))
  if (cb) cb(val)
  else return val

  function parse(val) {
    try {
      return JSON.parse(val)
    } catch (e) {
      return val
    }
  }
}