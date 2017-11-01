class Storage {
  set(key, val, cb) {
    try {
      localStorage.setItem(key, JSON.stringify(val))
    }
    catch (e) {
      const msg = 'Octotree cannot save its settings. ' +
                  'If the local storage for this domain is full, please clean it up and try again.'
      console.error(msg, e)
    }
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
