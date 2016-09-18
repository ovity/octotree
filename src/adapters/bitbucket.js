const BB_RESERVED_USER_NAMES = [
  'account', 'dashboard', 'integrations', 'product',
  'repo', 'snippets', 'support', 'whats-new'
]
const BB_RESERVED_REPO_NAMES = []

class Bitbucket extends Adapter {

  constructor() {
    super([])
  }

  // @override
  init($sidebar) {
    super.init($sidebar)

    // TODO
  }

  // @override
  getCssClass() {
    return 'octotree_bitbucket_sidebar'
  }

  // @override
  getCreateTokenUrl() {
    return `${location.protocol}//${location.host}/account/admin/app-passwords/new`
  }

  // @override
  updateLayout(togglerVisible, sidebarVisible, sidebarWidth) {
    $('html').css('margin-left', sidebarVisible ? sidebarWidth : '')
  }

  // @override
  getRepoFromPath(showInNonCodePage, currentRepo, token, cb) {

    // TODO: skip 404 page


    // (username)/(reponame)[/(type)]
    const match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/)
    if (!match) {
      return cb()
    }

    const username = match[1]
    const reponame = match[2]

    // Not a repository, skip
    if (~BB_RESERVED_USER_NAMES.indexOf(username) ||
        ~BB_RESERVED_REPO_NAMES.indexOf(reponame)) {
      return cb()
    }

    // Skip non-code page unless showInNonCodePage is true
    // with Bitbucket /username/repo is non-code page
    if (!showInNonCodePage &&
      (!match[3] || (match[3] && match[3] !== 'src'))) {
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
    // TODO
    console.log('selectFile')
  }

  // @override
  loadCodeTree(opts, cb) {
    opts.path = opts.node.path
    this._loadCodeTree(opts, (item) => {
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
      const tree = res.files.concat(directories)
      cb(null, tree)
    })
  }

  // @override
  _getSubmodules(tree, opts, cb) {
    const item = tree.filter((item) => /^\.gitmodules$/i.test(item.path))[0]
    if (!item) return cb()

    // TODO: get submodules
    cb()
  }

  _get(path, opts, cb) {
    const host = location.protocol + '//' + 'api.bitbucket.org/1.0'
    const url = `${host}/repositories/${opts.repo.username}/${opts.repo.reponame}${path || ''}`
    const cfg  = { url, method: 'GET', cache: false }

    $.ajax(cfg)
      .done((data) => cb(null, data))
      .fail((jqXHR) => this._handleError(jqXHR, cb))
  }
}
