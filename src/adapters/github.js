const
    GH_RESERVED_USER_NAMES = [
      'settings', 'orgs', 'organizations',
      'site', 'blog', 'about', 'explore',
      'styleguide', 'showcases', 'trending',
      'stars', 'dashboard', 'notifications',
      'search', 'developer', 'account',
      'pulls', 'issues', 'features', 'contact',
      'security', 'join', 'login', 'watching',
      'new', 'integrations'
    ]
  , GH_RESERVED_REPO_NAMES = ['followers', 'following', 'repositories']
  , GH_404_SEL = '#parallax_wrapper'
  , GH_PJAX_SEL = '#js-repo-pjax-container'
  , GH_CONTAINERS = '.container'

GitHub.prototype = Object.create(Adapter.prototype)
GitHub.prototype.constructor = GitHub
GitHub.prototype.super = Adapter.prototype

function GitHub(store) {
  this.store = store
  this._defaultBranch = {}
  this.unchangableKeys = [
    {key: STORE.COLLAPSE, value: true}
  ]
  this.createTokenUrl = location.protocol + '//' + location.host + '/settings/tokens/new'
  this.observe()
}

/**
 * Appends sidebar to corresponding place
 */
GitHub.prototype.appendSidebar = function(sidebar) {
  sidebar
    .addClass('octotree_github_sidebar')
    .appendTo($('body'))
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
 * Filter particular options for current adapter
 * @param {DOM Object} dom - the template which needs to be filtered
 */
GitHub.prototype.filterOption = function(dom) {
  dom.find('.octotree_github_hidden').remove()
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
  var encodedBranch = encodeURIComponent(decodeURIComponent(opts.repo.branch))
    , treePath = (opts.node && (opts.node.sha || encodedBranch)) || (encodedBranch + '?recursive=1')

  opts.treePath = treePath
  this._getCodeTree(opts, null, cb)
}

GitHub.prototype.fetchSubmodules = function(tree, cb) {
  var item = tree.filter(function(item) { return /^\.gitmodules$/i.test(item.path) })[0]
  if (!item) return cb()

  this.getBlob(item.sha, function(err, data) {
    if (err || !data) return cb(err)
    parseGitmodules(data, cb)
  })
}

GitHub.prototype.getTree = function(tree, cb) {
  this._get(this.repo, '/git/trees/' + tree, this.token, function(err, res) {
    if (err) return cb(err)
    cb(null, res.tree)
  })
}

GitHub.prototype.getBlob = function(sha, cb) {
  this._get(this.repo, '/git/blobs/' + sha, this.token, function(err, res) {
    if (err) return cb(err)
    cb(null, atob(res.content.replace(/\n/g,'')))
  })
}

GitHub.prototype._get = function(repo, path, token, cb) {
  var host  = (location.host === 'github.com' ? 'api.github.com' : (location.host + '/api/v3'))
    , base  = location.protocol + '//' + host + '/repos/' + repo.username + '/' + repo.reponame
    , cfg   = { method: 'GET', url: base + (path || ''), cache: false }
    , self  = this
  if (token) {
    cfg.headers = { Authorization: 'token ' + token }
  }

  $.ajax(cfg)
    .done(function(data) {
      cb(null, data)
    })
    .fail(function(jqXHR) {
      self.handleErrorStatus(jqXHR, cb)
    })
}
