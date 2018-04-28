const BB_RESERVED_USER_NAMES = [
  'account', 'dashboard', 'integrations', 'product',
  'repo', 'snippets', 'support', 'whats-new'
]
const BB_RESERVED_REPO_NAMES = []
const BB_RESERVED_TYPES = ['raw']
const BB_404_SEL = '#error.404'
const BB_PJAX_CONTAINER_SEL = '#source-container'

class Bitbucket extends PjaxAdapter {

  // @override
  init($sidebar) {
    const pjaxContainer = $(BB_PJAX_CONTAINER_SEL)[0]
    super.init($sidebar, {'pjaxContainer': pjaxContainer})
  }

  // @override
  _getCssClass() {
    return 'octotree_bitbucket_sidebar'
  }

  // @override
  getCreateTokenUrl() {
    return `${location.protocol}//${location.host}/account/admin/app-passwords/new`
  }

  // @override
  updateLayout(togglerVisible, sidebarVisible, sidebarWidth) {
    $('.octotree_toggle').css('right', sidebarVisible ? '' : -44)
    $('.aui-header').css('padding-left', sidebarVisible ? '' : 56)
    $('html').css('padding-left', sidebarVisible ? sidebarWidth : '')
    $('#adg3-navigation > div > div:first-child > div').css('left', sidebarVisible ? sidebarWidth : '')
  }

  // @override
  getRepoFromPath(currentRepo, token, cb) {

    // 404 page, skip
    if ($(BB_404_SEL).length) {
      return cb()
    }

    // (username)/(reponame)[/(type)]
    const match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/)
    if (!match) {
      return cb()
    }

    const username = match[1]
    const reponame = match[2]
    const type = match[3]

    // Not a repository, skip
    if (~BB_RESERVED_USER_NAMES.indexOf(username) ||
        ~BB_RESERVED_REPO_NAMES.indexOf(reponame) ||
        ~BB_RESERVED_TYPES.indexOf(type)) {
      return cb()
    }

    // Skip non-code page unless showInNonCodePage is true
    // with Bitbucket /username/repo is non-code page
    const showInNonCodePage = this.store.get(STORE.NONCODE)
    if (!showInNonCodePage && (!type || (type && type !== 'src'))) {
      return cb()
    }

    // Get branch by inspecting page, quite fragile so provide multiple fallbacks
    const BB_BRANCH_SEL_1 = '.branch-dialog-trigger'

    const branch =
      // Code page
      $(BB_BRANCH_SEL_1).attr('title') ||
      // Assume same with previously
      (currentRepo.username === username && currentRepo.reponame === reponame && currentRepo.branch) ||
      // Default from cache
      this._defaultBranch[username + '/' + reponame]

    const repo = {username: username, reponame: reponame, branch: branch}

    if (repo.branch) {
      cb(null, repo)
    }
    else {
      this._get('/main-branch', {repo, token}, (err, data) => {
        if (err) return cb(err)
        repo.branch = this._defaultBranch[username + '/' + reponame] = data.name || 'master'
        cb(null, repo)
      })
    }
  }

  // @override
  selectFile(path) {
    const $pjaxContainer = $(BB_PJAX_CONTAINER_SEL)
    super.selectFile(path, {'$pjaxContainer': $pjaxContainer})
  }

  // @override
  loadCodeTree(opts, cb) {
    opts.path = opts.node.path
    this._loadCodeTreeInternal(opts, (item) => {
      if (!item.type) {
        item.type = 'blob'
      }
    }, cb)
  }

  // @override
  _getTree(path, opts, cb) {
    this._get(`/src/${opts.repo.branch}/${path}`, opts, (err, res) => {
      if (err) return cb(err)
      const directories = res.directories.map((dir) => ({path: dir, type: 'tree'}))
      res.files.forEach((file) => {
        if (file.path.startsWith(res.path)) {
          file.path = file.path.substring(res.path.length)
        }
      })
      const tree = res.files.concat(directories)
      cb(null, tree)
    })
  }

  // @override
  _getSubmodules(tree, opts, cb) {
    if (opts.repo.submodules) {
      return this._getSubmodulesInCurrentPath(tree, opts, cb)
    }

    const item = tree.filter((item) => /^\.gitmodules$/i.test(item.path))[0]
    if (!item) return cb()

    this._get(`/src/${opts.encodedBranch}/${item.path}`, opts, (err, res) => {
      if (err) return cb(err)
      // Memoize submodules so that they will be inserted into the tree later.
      opts.repo.submodules = parseGitmodules(res.data)
      this._getSubmodulesInCurrentPath(tree, opts, cb)
    })
  }

  // @override
  _getSubmodulesInCurrentPath(tree, opts, cb) {
    const currentPath = opts.path
    const isInCurrentPath = currentPath
      ? (path) => path.startsWith(`${currentPath}/`)
      : (path) => path.indexOf('/') === -1

    const submodules = opts.repo.submodules
    const submodulesInCurrentPath = {}
    Object.keys(submodules).filter(isInCurrentPath).forEach((key) => {
      submodulesInCurrentPath[key] = submodules[key]
    })

    // Insert submodules in current path into the tree because submodules can not
    // be retrieved with Bitbucket API but can only by reading .gitmodules.
    Object.keys(submodulesInCurrentPath).forEach((path) => {
      if (currentPath) {
        // `currentPath` is prefixed to `path`, so delete it.
        path = path.substring(currentPath.length + 1)
      }
      tree.push({path: path, type: 'commit'})
    })
    cb(null, submodulesInCurrentPath)
  }

  // @override
  _get(path, opts, cb) {
    const host = location.protocol + '//' + 'api.bitbucket.org/1.0'
    const url = `${host}/repositories/${opts.repo.username}/${opts.repo.reponame}${path || ''}`
    const cfg  = { url, method: 'GET', cache: false }

    if (opts.token) {
      // Bitbucket App passwords can be used only for Basic Authentication.
      // Get username of logged-in user.
      let username = null, token = null

      // Or get username by spliting token.
      if (opts.token.includes(':')) {
        const result = opts.token.split(':')
        username =  result[0], token = result[1]
      }
      else {
        const currentUser = JSON.parse($('meta').attr('data-current-user'))
        if (!currentUser || !currentUser.username) {
          return cb({
            error: 'Error: Invalid token',
            message: `Cannot retrieve your user name from the current page.
                      Please update the token setting to prepend your user
                      name to the token, separated by a colon, i.e. USERNAME:TOKEN`,
            needAuth: true
          })
        }
        username = currentUser.username, token = opts.token
      }
      cfg.headers = { Authorization: 'Basic ' + btoa(username + ':' + token) }
    }

    $.ajax(cfg)
      .done((data) => cb(null, data))
      .fail((jqXHR) => {
        this._handleError(jqXHR, cb)
      })
  }

  // @override
  _getItemHref(repo, type, encodedPath, encodedBranch) {
    return `/${repo.username}/${repo.reponame}/src/${encodedBranch}/${encodedPath}`
  }
}
