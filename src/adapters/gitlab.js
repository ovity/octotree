const
    GL_RESERVED_USER_NAMES = [
      'u', 'dashboard', 'projects', 'users', 'help',
      'explore', 'profile', 'public', 'groups', 'abuse_reports'
    ]
  , GL_RESERVED_REPO_NAMES = []
  , GL_CONTAINERS = '.sidebar-wrapper, .toggle-nav-collapse'
  , GL_HEADER = '.navbar-gitlab'
  , GL_SIDEBAR = '.sidebar-wrapper'
  , GL_SHIFTED = 'h1.title'
  , GL_PROJECT_ID = '#project_id'

GitLab.prototype = Object.create(Adapter.prototype)
GitLab.prototype.constructor = GitLab
GitLab.prototype.super = Adapter.prototype

function GitLab(store) {
  this.store = store
  this._defaultBranch = {}
  this.unchangableKeys = [
    {key: STORE.RECURSIVE, value: false},
    {key: STORE.COLLAPSE, value: false}
  ]
  this.createTokenUrl = location.protocol + '//' + location.host + '/profile/account'
  this.observe()
  // HACK GL enterprise still uses legacy design so we need someway to detect that
  this.newGitLabDesign = $('.navbar-gitlab.header-collapsed, .navbar-gitlab.header-expanded').length > 0

  $('.toggle-nav-collapse').click(function() {
    setTimeout(function () {
      $(document).trigger(EVENT.LAYOUT_CHANGE)
    }, 10)
  })
}

/**
 * Appends sidebar to corresponding place.
 * @param {DOM Object} sidebar - Octotree sidebar.
 */
GitLab.prototype.appendSidebar = function(sidebar) {
  sidebar
    .addClass('octotree_gitlab_sidebar')
    .appendTo($('body'))
}

/**
 * Updates page layout based on visibility status and width of the Octotree sidebar.
 * @param {Boolean} sidebarVisible - current visibility of the sidebar.
 * @param {Number} sidebarWidth - current width of the sidebar.
 */
GitLab.prototype.updateLayout = function(sidebarVisible, sidebarWidth) {
  var $containers = $(GL_CONTAINERS)

  $(GL_HEADER).css('z-index', 3)

  if ($containers.length === 2) {
    var glSidebarExpanded = $('.page-with-sidebar').hasClass('page-sidebar-expanded')
      , glSidebarWidth = glSidebarExpanded ? 230 : 62

    if (this.newGitLabDesign) {
      $(GL_SHIFTED).css('margin-left', 36)
      $('.octotree_toggle').css('right', sidebarVisible ? '' : -(glSidebarWidth + 50))
    } else {
      glSidebarWidth = glSidebarExpanded ? 230 : 52
      $(GL_HEADER).css('z-index', 3)
      $(GL_SIDEBAR).css('z-index', 1)
      $(GL_SHIFTED).css('margin-left', 56)
      $('.octotree_toggle').css('right', sidebarVisible ? '' : -102)
      $('.octotree_toggle').css('top', sidebarVisible ? '' : 8)
    }

    $containers.css('margin-left', sidebarVisible ? sidebarWidth : '')
    $(GL_HEADER).css('padding-left', sidebarVisible ? sidebarWidth : '')
    $('.page-with-sidebar').css('padding-left', sidebarVisible ? glSidebarWidth + sidebarWidth : '')
  }
  // falls-back if GitLab DOM has been updated (not really sure what it will change)
  else $('html').css('margin-left', sidebarVisible ? sidebarWidth : '')
}

/**
 * Filters particular options for current adapter.
 * @param {DOM Object} dom - the template which needs to be filtered.
 */
GitLab.prototype.filterOption = function(dom) {
  dom.find('.octotree_gitlab_hidden').remove()
}

/**
 * Retrieves the repository info at the current location.
 * @param {Boolean} showInNonCodePage - if false, should not return data in non-code pages.
 * @param {Object} currentRepo - current repo being shown by Octotree.
 * @param {String} token - the personal access token.
 * @param {Function} cb - the callback function.
 */
GitLab.prototype.getRepoFromPath = function(showInNonCodePage, currentRepo, token, cb) {

  // 404 page, skip - GitLab doesn't have specific element for Not Found page
  if ($(document).find("title").text() === 'The page you\'re looking for could not be found (404)') {
    return cb()
  }

  // No project id no way to fetch project files
  if (!$(GL_PROJECT_ID).length) {
    return cb()
  }

  // (username)/(reponame)[/(type)]
  var match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/)
  if (!match) {
    return cb()
  }

  var username = match[1]
    , reponame = match[2]


  // not a repository, skip
  if (~GL_RESERVED_USER_NAMES.indexOf(username) ||
      ~GL_RESERVED_REPO_NAMES.indexOf(reponame)) {
    return cb()
  }

  // skip non-code page unless showInNonCodePage is true
  // with GitLab /username/repo is non-code page
  if (!showInNonCodePage &&
    (!match[3] || (match[3] && !~['tree', 'blob'].indexOf(match[3])))) {
    return cb()
  }

  // get branch by inspecting page, quite fragile so provide multiple fallbacks
  var GL_BRANCH_SEL_1 = '#repository_ref'
  var GL_BRANCH_SEL_2 = '.select2-container.project-refs-select.select2 .select2-chosen'
  var GL_BRANCH_SEL_3 = '.nav.nav-sidebar .shortcuts-tree'

  var branch =
    // Code page
    $(GL_BRANCH_SEL_1).val() || $(GL_BRANCH_SEL_2).text() ||
    // Non-code page
    ($(GL_BRANCH_SEL_3).attr('href') || '').match(/([^\/]+)/g)[3] ||
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
GitLab.prototype.getCodeTree = function(opts, cb) {
  opts.treePath = opts.node.path
  this._getCodeTree(opts, function(item) {
    item.sha = item.id // jstree and gitlab use the same id property
    item.path = item.name
  }, cb)
}

GitLab.prototype.fetchSubmodules = function(tree, cb) {
  var item = tree.filter(function(item) { return /^\.gitmodules$/i.test(item.name) })[0]
  if (!item) return cb()
  this.getBlob(encodedBranch, item.name, function(err, data) {
    if (err || !data) return cb(err)
    parseGitmodules(data, cb)
  })
}

GitLab.prototype.getTree = function(tree, cb) {
  this._get(this.repo, '/repository/tree' + '?path=' + tree + '&ref_name=' + this.encodedBranch, this.token, function(err, res) {
    if (err) return cb(err)
    cb(null, res)
  })
}

GitLab.prototype.getBlob = function(sha, path, cb) {
  this._get(this.repo, '/repository/blobs/' + sha + '?filepath=' + path, this.token, function(err, res) {
    if (err) return cb(err)
    cb(null, res)
  })
}

GitLab.prototype._get = function(repo, path, token, cb) {
  var host      = location.host + '/api/v3'
    , projectID = $(GL_PROJECT_ID).val()
    , base      = location.protocol + '//' + host + '/projects/' + projectID + path + '&private_token=' + token
    , cfg       = { method: 'GET', url: base, cache: false }
    , self      = this

  $.ajax(cfg)
    .done(function(data) {
      cb(null, data)
    })
    .fail(function(jqXHR) {
      self.handleErrorStatus(jqXHR, cb)
    })
}
