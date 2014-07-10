$(function() {
  const KEY = 'octotree.gheurls'

  var $addBtn = $('#addurl')
    , $urlTxt = $('#newurl')
    , $urlList = $('#added_urls')

chrome.permissions.onAdded.addListener(function(permissions){
    console.log("Added permissions:")
    console.log(permissions)
  })

  chrome.storage.sync.get(KEY, function(item) {
    console.log(item)
    var urls = item[KEY] || []
    urls.forEach(function(url) {
      console.log(url)
      var $url = $('<div><div>' + url + '</div><button>-</button></div>')
      $url.appendTo($urlList)
    })
  })

  $urlTxt.keyup(function() {
    if ($urlTxt.val()) $addBtn.removeAttr('disabled')
    else $addBtn.attr('disabled', 'disabled')
  })

  $addBtn.click(function() {
    var url = $urlTxt.val()
      , $url = $('<div><div>' + url + '</div><button>-</button></div>')
    chrome.permissions.request({ origins: [url] }, function(granted) {
      console.log(granted)
      if (!granted) return
      $url.appendTo($urlList)

      chrome.storage.sync.get(KEY, function(item) {
        var urls = item[KEY] || []
        if (~urls.indexOf(url)) return
        item[KEY] = urls.concat([url])
        chrome.storage.sync.set(item)
      })
    })
  })

  $urlList.on('click', 'button', function() {
    var $parent = $(this).parent()
      , url = $(this).prev().text()

    chrome.permissions.remove({ origins: [url] }, function(removed) {
      if (!removed) return
      $parent.remove()

      chrome.storage.sync.get(KEY, function(item) {
        var urls = item[KEY] || []
          , index = urls.indexOf(url)
        if (!~index) return
        urls.splice(index, 1)
        item[KEY] = urls
        chrome.storage.sync.set(item)
      })
    })
  })
})