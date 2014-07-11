chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    chrome.tabs.executeScript(tabId, {
      code  : 'chrome.runtime.sendMessage({ loaded: window.octotreeLoaded, tabId: ' + tabId + ' })',
      runAt : 'document_start'
    })
  }
})

chrome.runtime.onMessage.addListener(function(req) {
  if (req.type === 'perms') {
    var urls = req.urls
    if (urls.length === 0) { // TODO: remove only

    }
    else {
      console.log(1, urls)
      urls = urls.map(function(url) {
        if (url.slice(-1) !== '/') url += '/'
        url += '*'
        return url
      })
      console.log(2, urls)
      chrome.permissions.request({ origins: urls }, function() {
        chrome.permissions.getAll(function(permissions) {
          var allUrls = permissions.origins
            , toRemove = []
          console.log('all', allUrls)
          allUrls.forEach(function(url) {
            if (url !== 'https://github.com/*' && !~urls.indexOf(url)) toRemove.push(url)
          })
          console.log('remove: ' + toRemove)
          if (toRemove.length) chrome.permissions.remove({ origins: toRemove })
        })
      })
    }
  }
  else {
    var loaded = req.loaded
      , tabId  = req.tabId

    if (loaded) return

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

    async.series([
      function(cb) {
        async.eachSeries(cssFiles, inject('insertCSS'), cb)
      },
      function(cb) {
        async.eachSeries(jsFiles, inject('executeScript'), cb)
      }
    ], function() {
      chrome.tabs.executeScript(tabId, { code: 'var octotreeLoaded = true', runAt: 'document_start' })
    })

    function inject(fn) {
      return function(file, cb) {
        chrome.tabs[fn](tabId, { file: file, runAt: 'document_start' }, function() { cb() })
      }
    }
  }
})