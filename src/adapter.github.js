const
    GH_RESERVED_USER_NAMES = [
      'settings', 'orgs', 'organizations',
      'site', 'blog', 'about', 'explore',
      'styleguide', 'showcases', 'trending',
      'stars', 'dashboard', 'notifications',
      'search', 'developer', 'account'
    ]
  , GH_RESERVED_REPO_NAMES = ['followers', 'following', 'repositories']
  , GH_404_SEL = '#parallax_wrapper'
  , GH_PJAX_SEL = '#js-repo-pjax-container'
  , GH_CONTAINERS = '.container'

function GitHub() {
  this._defaultBranch = {}

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
 * Selects a file.
 * @param {String} path - the file path.
 * @param {Number} tabSize - the tab size to use.
 */
GitHub.prototype.selectFile = function(path, tabSize) {
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
 * Downloads a file
 * @param {String} path - the file path.
 * @param {String} fileName - the file name.
 */
GitHub.prototype.downloadFile = function(path, fileName) {
  var link = document.createElement('a')
  link.setAttribute('href', path.replace(/\/blob\//, '/raw/'))
  link.setAttribute('download', fileName)
  link.click()
}

/**
 * Selects a submodule
 * @param {String} path - the submodule path.
 */
GitHub.prototype.selectSubmodule = function(path) {
  window.location.href = path
}

/**
 * Updates page layout based on visibility status and width of the Octotree sidebar.
 * @param {Boolean} sidebarVisible - current visibility of the sidebar.
 * @param {Number} sidebarWidth - current width of the sidebar.
 */
GitHub.prototype.updateLayout = function(sidebarVisible, sidebarWidth) {
  var $containers = $(GH_CONTAINERS)
    , spacing = 10
    , autoMarginLeft
    , shouldPushLeft

  if ($containers.length === 4) {
    autoMarginLeft = ($('body').width() - $containers.width()) / 2
    shouldPushLeft = sidebarVisible && (autoMarginLeft <= sidebarWidth + spacing)
    $containers.css('margin-left', shouldPushLeft ? sidebarWidth + spacing : '')
  }

  // falls-back if GitHub DOM has been updated
  else $('html').css('margin-left', sidebarVisible ? sidebarWidth + spacing : '')
}

/**
 * Retrieves the repository info at the current location.
 * @param {Boolean} showInNonCodePage - if false, should not return data in non-code pages.
 * @param {Object} currentRepo - current repo being shown by Octotree.
 * @param {String} token - the personal access token.
 * @param {Function} cb - the callback function.
 */
GitHub.prototype.getRepoFromPath = function(showInNonCodePage, currentRepo, token, cb) {

  // 404 page, skip
  if ($(GH_404_SEL).length) {
    return cb()
  }

  // (username)/(reponame)[/(type)]
  var match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/)
  if (!match) {
    return cb()
  }

  var username = match[1]
  var reponame = match[2]

  // not a repository, skip
  if (~GH_RESERVED_USER_NAMES.indexOf(username) ||
      ~GH_RESERVED_REPO_NAMES.indexOf(reponame)) {
    return cb()
  }

  // skip non-code page unless showInNonCodePage is true
  if (!showInNonCodePage && match[3] && !~['tree', 'blob'].indexOf(match[3])) {
    return cb()
  }

  // get branch by inspecting page, quite fragile so provide multiple fallbacks
  var GH_BRANCH_SEL_1 = '[aria-label="Switch branches or tags"]'
  var GH_BRANCH_SEL_2 = '.repo-root a[data-branch]'
  var GH_BRANCH_SEL_3 = '.repository-sidebar a[aria-label="Code"]'

  var branch =
    // Code page
    $(GH_BRANCH_SEL_1).attr('title') || $(GH_BRANCH_SEL_2).data('branch') ||
    // Non-code page
    ($(GH_BRANCH_SEL_3).attr('href') || '').match(/([^\/]+)/g)[3] ||
    // Assume same with previously
    (currentRepo.username === username && currentRepo.reponame === reponame && currentRepo.branch) ||
    // Default from cache
    this._defaultBranch[username + '/' + reponame]

  var repo = {username: username, reponame: reponame, branch: branch}

  if (repo.branch) {
    cb(null, repo)
  }
  else {
    this._get(repo, null, token, function (err, data) {
      if (err) return cb(err)
      repo.branch = this._defaultBranch[username + '/' + reponame] = data.default_branch || 'master'
      cb(null, repo)
    }.bind(this))
  }
}

/**
 * Retrieves the code tree of a repository.
 * @param {Object} opts: { repo: repository, node(optional): selected node (null for resursively loading), token (optional): user access token, apiUrl (optional): base API URL }
 * @param {Function} cb(err: error, tree: array (of arrays) of items)
 */
GitHub.prototype.getCodeTree = function(opts, cb) {
  var self          = this
    , folders       = { '': [] }
    , repo          = opts.repo
    , token         = opts.token
    , encodedBranch = encodeURIComponent(decodeURIComponent(repo.branch))
    , $dummyDiv     = $('<div/>')

  var treePath = (opts.node && (opts.node.sha || encodedBranch)) || (encodedBranch + '?recursive=1')
  getTree(treePath, function(err, tree) {
    if (err) return cb(err)

    fetchSubmodules(function(err, submodules) {
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
            item.a_attr = { href: '/' + repo.username + '/' + repo.reponame + '/' + type + '/' + repo.branch + '/' + encodeURIComponent(path) /* closes #97 */ }
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

    function fetchSubmodules(cb) {
      var item = tree.filter(function(item) { return /^\.gitmodules$/i.test(item.path) })[0]
      if (!item) return cb()

      getBlob(item.sha, function(err, data) {
        if (err || !data) return cb(err)
        parseGitmodules(data, cb)
      })
    }
  })

  function getTree(tree, cb) {
    self._get(repo, '/git/trees/' + tree, token, function(err, res) {
      if (err) return cb(err)
      cb(null, res.tree)
    })
  }

  function getBlob(sha, cb) {
    self._get(repo, '/git/blobs/' + sha, token, function(err, res) {
      if (err) return cb(err)
      cb(null, atob(res.content.replace(/\n/g,'')))
    })
  }
}

GitHub.prototype._get = function(repo, path, token, cb) {
  var host  = (location.host === 'github.com' ? 'api.github.com' : (location.host + '/api/v3'))
    , base  = location.protocol + '//' + host + '/repos/' + repo.username + '/' + repo.reponame
    , cfg   = { method: 'GET', url: base + (path || ''), cache: false }

  if (token) {
    cfg.headers = { Authorization: 'token ' + token }
  }

  $.ajax(cfg)
    .done(function(data) {
      cb(null, data)
    })
    .fail(function(jqXHR) {
      var createTokenUrl = location.protocol + '//' + location.host + '/settings/tokens/new'
        , error
        , message
        , needAuth

      switch (jqXHR.status) {
        case 0:
          error = 'Connection error'
          message = 'Cannot connect to GitHub. If your network connection to GitHub is fine, maybe there is an outage of the GitHub API. Please try again later.'
          needAuth = false
          break
        case 401:
          error = 'Invalid token'
          message = 'The token is invalid. Follow <a href="' + createTokenUrl + '" target="_blank">this link</a> to create a new token and paste it below.'
          needAuth = true
          break
        case 409:
          error = 'Empty repository'
          message = 'This repository is empty.'
          break
        case 404:
          error = 'Private repository'
          message = 'Accessing private repositories requires a GitHub access token. Follow <a href="' + createTokenUrl + '" target="_blank">this link</a> to create one and paste it below.'
          needAuth = true
          break
        case 403:
          if (~jqXHR.getAllResponseHeaders().indexOf('X-RateLimit-Remaining: 0')) {
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
    })
}
