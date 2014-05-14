(function(){
  const INTERVAL = 200
  var href = location.href
    , hash = location.hash

  function checkLocation(){
    if(location.href !== href || location.hash != hash){
      $(location).trigger('change')
      href = location.href
      hash = location.hash
    }

    window.setTimeout(checkLocation, INTERVAL)
  }

  checkLocation()
})()