const GH_RESERVED_USER_NAMES = [
  'settings', 'orgs', 'organizations',
  'site', 'blog', 'about', 'explore',
  'styleguide', 'showcases', 'trending',
  'stars', 'dashboard', 'notifications',
  'search', 'developer', 'account',
  'pulls', 'issues', 'features', 'contact',
  'security', 'join', 'login', 'watching',
  'new', 'integrations'
]
const GH_RESERVED_REPO_NAMES = ['followers', 'following', 'repositories']
const GH_404_SEL = '#parallax_wrapper'
const GH_PJAX_SEL = '#js-repo-pjax-container'
const GH_CONTAINERS = '.container'

class GitHub extends Adapter {
  getCssClass() {
    return 'octotree_github_sidebar'
  }

  canLoadEntireTree() {
    return true
  }

  getCreateTokenUrl() {
    return `${location.protocol}//${location.host}/settings/tokens/new`
  }

  updateLayout(sidebarVisible, sidebarWidth) {
    const SPACING = 10
    const $containers = $(GH_CONTAINERS)

    if ($containers.length === 4) {
      const autoMarginLeft = ($('body').width() - $containers.width()) / 2
      const shouldPushLeft = sidebarVisible && (autoMarginLeft <= sidebarWidth + SPACING)
      $containers.css('margin-left', shouldPushLeft ? sidebarWidth + SPACING : '')
    }

    // falls-back if GitHub DOM has been updated
    else $('html').css('margin-left', sidebarVisible ? sidebarWidth + SPACING : '')
  }

  getRepoFromPath(showInNonCodePage, currentRepo, token, cb) {

    // 404 page, skip
    if ($(GH_404_SEL).length) {
      return cb()
    }

    // (username)/(reponame)[/(type)]
    const match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/)
    if (!match) {
      return cb()
    }

    const username = match[1]
    const reponame = match[2]

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
    const GH_BRANCH_SEL_1 = '[aria-label="Switch branches or tags"]'
    const GH_BRANCH_SEL_2 = '.repo-root a[data-branch]'
    const GH_BRANCH_SEL_3 = '.repository-sidebar a[aria-label="Code"]'

    const branch =
      // Code page
      $(GH_BRANCH_SEL_1).attr('title') || $(GH_BRANCH_SEL_2).data('branch') ||
      // Non-code page
      ($(GH_BRANCH_SEL_3).attr('href') || '').match(/([^\/]+)/g)[3] ||
      // Assume same with previously
      (currentRepo.username === username && currentRepo.reponame === reponame && currentRepo.branch) ||
      // Default from cache
      this._defaultBranch[username + '/' + reponame]

    const repo = {username: username, reponame: reponame, branch: branch}

    if (repo.branch) {
      cb(null, repo)
    }
    else {
      this.get(repo, null, token, (err, data) => {
        if (err) return cb(err)
        repo.branch = this._defaultBranch[username + '/' + reponame] = data.default_branch || 'master'
        cb(null, repo)
      })
    }
  }

  selectFile(path) {
    const container = $(GH_PJAX_SEL)

    if (container.length) {
      $.pjax({
        // needs full path for pjax to work with Firefox as per cross-domain-content setting
        url : location.protocol + '//' + location.host + path,
        container : container
      })
    }
    else window.location.href = path // falls back if no container (i.e. GitHub DOM has changed or is not yet available)
  }

  loadCodeTree(opts, cb) {
    const encodedBranch = encodeURIComponent(decodeURIComponent(opts.repo.branch))
    const treePath = (opts.node && (opts.node.sha || encodedBranch)) ||
                     (encodedBranch + '?recursive=1')

    opts.treePath = treePath
    super.loadCodeTree(opts, null, cb)
  }

  getSubmodules(tree, cb) {
    const item = tree.filter((item) => /^\.gitmodules$/i.test(item.path))[0]
    if (!item) return cb()

    this.getBlob(item.sha, (err, data) => {
      if (err || !data) return cb(err)
      parseGitmodules(data, cb)
    })
  }

  getTree(tree, cb) {
    this.get(this.repo, `/git/trees/${tree}`, this.token, (err, res) => {
      if (err) return cb(err)
      cb(null, res.tree)
    })
  }

  getBlob(sha, cb) {
    this.get(this.repo, `/git/blobs/${sha}`, this.token, (err, res) => {
      if (err) return cb(err)
      cb(null, atob(res.content.replace(/\n/g,'')))
    })
  }

  get(repo, path, token, cb) {
    const host = (location.host === 'github.com' ? 'api.github.com' : (location.host + '/api/v3'))
    const base = `${location.protocol}//${host}/repos/${repo.username}/${repo.reponame}`
    const cfg  = { method: 'GET', url: base + (path || ''), cache: false }

    if (token) {
      cfg.headers = { Authorization: 'token ' + token }
    }

    $.ajax(cfg)
      .done((data) => cb(null, data))
      .fail((jqXHR) => this.handleError(jqXHR, cb))
  }
}
