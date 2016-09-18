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
    return 'octotree_github_sidebar'
  }

  // @override
  canLoadEntireTree() {
    return true
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

    // TODO: get branch name
    const branch = ''

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
    opts.path = ''
    this._loadCodeTree(opts, (item) => {
      if (item.path.endsWith('/')) {
        item.path = item.path.slice(0, -1)
        item.type = 'tree'
      } else {
        item.type = 'blob'
      }
    }, cb)
  }

  // @override
  _getTree(path, opts, cb) {
    // `/directory` endpoint is not officially supported.
    // See https://bitbucket.org/site/master/issues/8316/rest-api-list-all-files-in-repo-like-git
    this._get(`/directory/${opts.repo.branch}/`, opts, (err, res) => {
      if (err) cb(err)
      else cb(null, res.values.filter(v => v !== '/').map(v => ({ path: v })))
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

    // TODO: handle too many files failure
    $.ajax(cfg)
      .done((data) => cb(null, data))
      .fail((jqXHR) => this._handleError(jqXHR, cb))
  }
}
