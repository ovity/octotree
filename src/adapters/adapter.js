function Adapter() {}

Adapter.prototype.observe = function () {
  if (!window.MutationObserver) return

  // Fix #151 by detecting when page layout is updated.
  // In this case, split-diff page has a wider layout, so need to recompute margin.
  // Note that couldn't do this in response to URL change, since new DOM via pjax might not be ready.
  var observer = new window.MutationObserver(function(mutations) {
    for (var i = 0, len = mutations.length; i < len; i++) {
      var mutation = mutations[i]
      if (~mutation.oldValue.indexOf('split-diff') ||
          ~mutation.target.className.indexOf('split-diff')) {
        return $(document).trigger(EVENT.LAYOUT_CHANGE)
      }
    }
  })

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true
  })
}

/**
 * Get unchangable value of key.
 * @param {String} key - the key to check if it's unchangable.
 * @return value for unchangable value or null for changable value.
 */
Adapter.prototype.getValue = function(key) {
  var item = this.unchangableKeys.find(function(item) {
    return (item.key === key)
  })
  if (item) return item.value
  return this.store.get(key)
}

/**
 * Selects a file.
 * @param {String} path - the file path.
 * @param {Number} tabSize - the tab size to use.
 */
Adapter.prototype.selectFile = function(path, tabSize) {
  var container = $(GH_PJAX_SEL)
    , qs = tabSize ? ('?ts=' + tabSize) : ''

  if (container.length) {
    $.pjax({
      // needs full path for pjax to work with Firefox as per cross-domain-content setting
      url : location.protocol + '//' + location.host + path + qs,
      container : container
    })
  }
  else window.location.href = path + qs // falls back if no container (i.e. GitHub DOM has changed or is not yet available)
}

/**
 * Selects a submodule.
 * @param {String} path - the submodule path.
 */
Adapter.prototype.selectSubmodule = function(path) {
  window.location.href = path
}

/**
 * Downloads a file.
 * @param {String} path - the file path.
 * @param {String} fileName - the file name.
 */
Adapter.prototype.downloadFile = function(path, fileName) {
  var link = document.createElement('a')
  link.setAttribute('href', path.replace(/\/blob\//, '/raw/'))
  link.setAttribute('download', fileName)
  link.click()
}

/**
 * Retrieves the code tree of a repository.
 * @param {Object} opts: { repo: repository, node(optional): selected node (null for resursively loading), token (optional): user access token, apiUrl (optional): base API URL }
 * @param {Function} cb(err: error, tree: array (of arrays) of items)
 */
Adapter.prototype._getCodeTree = function(opts, modify, cb) {
   var self          = this
     , folders       = { '': [] }
     , $dummyDiv     = $('<div/>')

   this.repo          = opts.repo
   this.token         = opts.token
   this.treePath      = opts.treePath
   this.encodedBranch = encodeURIComponent(decodeURIComponent(this.repo.branch))

   this.getTree(this.treePath, function(err, tree) {
     if (err) return cb(err)

     self.fetchSubmodules(tree, function(err, submodules) {
       if (err) return cb(err)
       submodules = submodules || {}

       // split work in chunks to prevent blocking UI on large repos
       nextChunk(0)
       function nextChunk(iteration) {
         var chunkSize = 300
           , baseIndex = iteration * chunkSize
           , i
           , item, path, type, index, name, moduleUrl

         for (i = 0; i < chunkSize; i++) {
           item = tree[baseIndex + i]

           // we're done
           if (item === undefined) return cb(null, folders[''])
           if (modify) modify(item) // modify item for corresponding adapter
           // includes parent path
           if (opts.node && opts.node.path)
             item.path = opts.node.path + '/' + item.path

           path  = item.path
           type  = item.type
           index = path.lastIndexOf('/')
           name  = $dummyDiv.text(path.substring(index + 1)).html() // sanitizes, closes #9

           item.id   = PREFIX + path
           item.text = name
           item.icon = type // use `type` as class name for tree node

           if (opts.node) {
             // no hierarchy in lazy loading
             folders[''].push(item)
           }
           else
             folders[path.substring(0, index)].push(item)

           if (type === 'tree') {
             if (opts.node) item.children = true
             else folders[item.path] = item.children = []
             item.a_attr = { href: '#' }
           }
           else if (type === 'blob') {
             item.a_attr = { href: '/' + self.repo.username + '/' + self.repo.reponame + '/' + type + '/' + self.repo.branch + '/' + encodeURIComponent(path) /* closes #97 */ }
           }
           else if (type === 'commit') {
             moduleUrl = submodules[item.path]
             if (moduleUrl) { // fix #105
               // special handling for submodules hosted in GitHub
               if (~moduleUrl.indexOf('github.com')) {
                 moduleUrl = moduleUrl.replace(/^git(:\/\/|@)/, window.location.protocol + '//')
                                      .replace('github.com:', 'github.com/')
                                      .replace(/.git$/, '')
                 item.text = '<a href="' + moduleUrl + '" class="jstree-anchor">' + name + '</a>' +
                             '<span>@ </span>' +
                             '<a href="' + moduleUrl + '/tree/' + item.sha + '" class="jstree-anchor">' + item.sha.substr(0, 7) + '</a>'
               }
               item.a_attr = { href: moduleUrl }
             }
           }
         }

         setTimeout(function() {
           nextChunk(iteration + 1)
         }, 0)
       }
     })
   })
 }

/**
 * Handle request error code.
 * @param {Object} jqXHR - XHR response from Ajax called.
 * @param {Function} cb - Done callback.
 */

Adapter.prototype.handleErrorStatus = function(jqXHR, cb) {
  var error
    , message
    , needAuth

  switch (jqXHR.status) {
    case 0:
      error = 'Connection error'
      message = 'Cannot connect to website. If your network connection to this website is fine, maybe there is an outage of the API. Please try again later.'
      needAuth = false
      break
    case 401:
      error = 'Invalid token'
      message = 'The token is invalid. Follow <a href="' + this.createTokenUrl + '" target="_blank">this link</a> to create a new token and paste it below.'
      needAuth = true
      break
    case 409:
      error = 'Empty repository'
      message = 'This repository is empty.'
      break
    case 404:
      error = 'Private repository'
      message = 'Accessing private repositories requires a access token. Follow <a href="' + createTokenUrl + '" target="_blank">this link</a> to create one and paste it below.'
      needAuth = true
      break
    case 403:
      if (~jqXHR.getAllResponseHeaders().indexOf('X-RateLimit-Remaining: 0')) {
        // It's kinda specific for GitHub
        error = 'API limit exceeded'
        message = 'You have exceeded the GitHub API hourly limit and need GitHub access token to make extra requests. Follow <a href="' + createTokenUrl + '" target="_blank">this link</a> to create one and paste it below.'
        needAuth = true
        break
      }
      else {
        error = 'Forbidden'
        message = 'You are not allowed to access the API. You might need to provide an access token. Follow <a href="' + createTokenUrl + '" target="_blank">this link</a> to create one and paste it below.'
        needAuth = true
        break
      }
    default:
      error = message = jqXHR.statusText
      needAuth = false
      break
  }
  cb({
    error    : 'Error: ' + error,
    message  : message,
    needAuth : needAuth,
  })
}

/**
 * Pick corresponding Adapter basing on current domain.
 * @param {Object} store - object to get/set value from storage.
 * @return New adapter object, can be GitHub or GitLab.
 */
function initAdapter(store) {
  if (detectRepoHost(store) == REPOS.GITHUB)
    return new GitHub(store)
  return new GitLab(store)
}
