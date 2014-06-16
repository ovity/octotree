function Storage() {
  this.get = function(key) {
    var val = localStorage.getItem(key)
    try {
      return JSON.parse(val)
    } catch (e) {
      return val
    }
  }
  this.set = function(key, val) {
    return localStorage.setItem(key, JSON.stringify(val))
  }
}