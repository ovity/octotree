class Storage {
  set(key, val, cb) {
    localStorage.setItem(key, JSON.stringify(val))
    if (cb) cb()
  }

  get(key, cb) {
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
}
