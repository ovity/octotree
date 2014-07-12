chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status !== 'loading') return

  chrome.tabs.executeScript(tabId, {
    code  : 'var injected = window.octotreeInjected; window.octotreeInjected = true; injected;',
    runAt : 'document_start'
  }, function(res) {
    if (chrome.runtime.lastError || // don't continue if error (i.e. page isn't in permission list)
        res[0]) // value of `injected` above: don't inject twice
      return

    var cssFiles = [
      'jstree.css',
      'octotree.css'
    ]

    var jsFiles = [
      'jquery.js',
      'jquery-ui.js',
      'jquery.pjax.js',
      'jstree.js',
      'keymaster.js',
      'async.js',
      'octotree.js'
    ]

    eachTask([
      function(cb) {
        eachItem(cssFiles, inject('insertCSS'), cb)
      },
      function(cb) {
        eachItem(jsFiles, inject('executeScript'), cb)
      }
    ])

    function inject(fn) {
      return function(file, cb) {
        chrome.tabs[fn](tabId, { file: file, runAt: 'document_start' }, cb)
      }
    }
  })
})

chrome.runtime.onMessage.addListener(function(req, sender, sendRes) {
  var handler = {
    requestPermissions: function() {
      var urls = (req.urls || [])
        .filter(function(url) { return url.trim() !== '' })
        .map(function(url) {
          if (url.slice(-2) === '/*') return url
          if (url.slice(-1) === '/') return url + '*'
          return url + '/*'
        })

      if (urls.length === 0) {
        sendRes(true)
        removeUnnecessaryPermissions()
      }
      else {
        chrome.permissions.request({ origins: urls }, function(granted) {
          sendRes(granted)
          removeUnnecessaryPermissions()
        })
      }
      return true

      function removeUnnecessaryPermissions() {
        chrome.permissions.getAll(function(permissions) {
          var toBeRemovedUrls = permissions.origins.filter(function(url) {
            return url !== 'https://github.com/*' && !~urls.indexOf(url)
          })
          if (toBeRemovedUrls.length) chrome.permissions.remove({ origins: toBeRemovedUrls })
        })
      }
    }
  }

  return handler[req.type]()
})

function eachTask(tasks, done) {
  next(0)
  function next(index) {
    if (index === tasks.length) done && done()
    else tasks[index](function() { next(index + 1) })
  }
}

function eachItem(arr, iter, done) {
  var tasks = arr.map(function(item) {
    return function(next) {
      iter(item, next)
    }
  })
  return eachTask(tasks, done)
}