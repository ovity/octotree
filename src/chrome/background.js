chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    chrome.tabs.executeScript(tabId, {
      code  : 'chrome.runtime.sendMessage({ loaded: window.octotreeLoaded, tabId: ' + tabId + ' })',
      runAt : 'document_start'
    })
  }
})

chrome.runtime.onMessage.addListener(function(req) {
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
})