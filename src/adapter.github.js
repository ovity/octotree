const
    GH_RESERVED_USER_NAMES = [
      'settings', 'orgs', 'organizations',
      'site', 'blog', 'about', 'explore',
      'styleguide', 'showcases', 'trending',
      'stars', 'dashboard', 'notifications',
      'search', 'developer', 'account'
    ]
  , GH_RESERVED_REPO_NAMES = ['followers', 'following', 'repositories']
  , GH_BRANCH_SEL  = '[aria-label="Switch branches or tags"]'
  , GH_404_SEL          = '#parallax_wrapper'
  , GH_PJAX_SEL         = '#js-repo-pjax-container'
  , GH_CONTAINERS       = '.container'

function GitHub() {
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
 * Selects a submodule.
 */
GitHub.prototype.selectSubmodule = function(path) {
  window.location.href = path
}

/**
 * Downloads the file at the given
 */
GitHub.prototype.downloadFile = function(path, fileName) {
  var link = document.createElement('a')
  link.setAttribute('href', path.replace(/\/blob\//, '/raw/'))
  link.setAttribute('download', fileName)
  link.click()
}

/**
 * Selects a path.
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
 * Updates page layout based on visibility status and width of the Octotree sidebar.
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
 * Returns the repository information if user is at a repository URL. Returns `null` otherwise.
 */
GitHub.prototype.getRepoFromPath = function(showInNonCodePage, currentRepo) {
  // 404 page, skip
  if ($(GH_404_SEL).length) return false

  // (username)/(reponame)[/(type)]
  var match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/)
  if (!match) return false

  // not a repository, skip
  if (~GH_RESERVED_USER_NAMES.indexOf(match[1])) return false
  if (~GH_RESERVED_REPO_NAMES.indexOf(match[2])) return false

  // skip non-code page unless showInNonCodePage is true
  if (!showInNonCodePage && match[3] && !~['tree', 'blob'].indexOf(match[3])) return false

  // get branch by inspecting page, quite fragile so provide multiple fallbacks
  var branch =
    $(GH_BRANCH_SEL).data('ref') ||
    $(GH_BRANCH_SEL).children('.js-select-button').text() ||
    (currentRepo.username === match[1] && currentRepo.reponame === match[2] && currentRepo.branch) ||
    'master'

  return {
    username : match[1],
    reponame : match[2],
    branch   : branch
  }
}

/**
 * Fetches data of a particular repository.
 * @param opts: { repo: repository, recursive: opt-in lazy load, node(optional): selected node (null for resursively loading), token (optional): user access token, apiUrl (optional): base API URL }
 * @param cb(err: error, tree: array (of arrays) of items)
 */
GitHub.prototype.fetchData = function(opts, cb) {
  var self = this
    , repo = opts.repo
    , folders = { '': [] }
    , encodedBranch = encodeURIComponent(decodeURIComponent(repo.branch))
    , $dummyDiv = $('<div/>')

  $.extend(opts, {branch: encodedBranch})
  var param = ((opts.node && opts.node.sha) || opts.branch) 
  param += (opts.recursive ? '?recursive=1' : '')
  
  getTree(param, function(err, tree) {
    if (err) return cb(err)

    fetchSubmodules(function(err, submodules) {
      if (err) return cb(err)
      submodules = submodules || {}

      function convertPath(path) {
        // Concats child path to parent's
        if (opts.node) return opts.node.path + '/' + path
        return path
      }

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

          item.path = convertPath(item.path)
          path  = item.path
          type  = item.type
          index = path.lastIndexOf('/')
          name  = $dummyDiv.text(path.substring(index + 1)).html() // sanitizes, closes #9

          item.id   = PREFIX + path
          item.text = name
          item.icon = type // use `type` as class name for tree node
          if (opts.recursive)
            folders[path.substring(0, index)].push(item)
          else // no hierarchy in lazy loading
            folders[''].push(item)

          if (type === 'tree') {
            folders[item.path] = item.children = []
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

  function getTree(param, cb) {
    get('/git/trees/' + param, function(err, res) {
      if (err) return cb(err)
      cb(null, res.tree)
    })
  }

  function getBlob(sha, cb) {
    get('/git/blobs/' + sha, function(err, res) {
      if (err) return cb(err)
      cb(null, atob(res.content.replace(/\n/g,'')))
    })
  }

  function get(path, cb) {
    var token = opts.token
      , host  = (location.host === 'github.com' ? 'api.github.com' : (location.host + '/api/v3'))
      , base  = location.protocol + '//' + host + '/repos/' + repo.username + '/' + repo.reponame
      , cfg   = { method: 'GET', url: base + path, cache: false }

    if (token) cfg.headers = { Authorization: 'token ' + token }
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
}
