const BB_RESERVED_USER_NAMES = [
  'account', 'dashboard', 'integrations', 'product',
  'repo', 'snippets', 'support', 'whats-new'
]
const BB_RESERVED_REPO_NAMES = []
const BB_RESERVED_TYPES = ['raw']
const BB_404_SEL = '#error.404'
const BB_PJAX_CONTAINER_SEL = '#source-container'

class Bitbucket extends Adapter {

  constructor() {
    super(['jquery.pjax.js'])

    $.pjax.defaults.timeout = 0 // no timeout
    $(document)
      .on('pjax:send', () => $(document).trigger(EVENT.REQ_START))
      .on('pjax:end', () => $(document).trigger(EVENT.REQ_END))
  }

  // @override
  init($sidebar) {
    super.init($sidebar)

    if (!window.MutationObserver) return

    // Bitbucket switch pages using pjax. This observer detects if the pjax container
    // has been updated with new contents and trigger layout.
    const pageChangeObserver = new window.MutationObserver(() => {
      // Trigger location change, can't just relayout as Octotree might need to
      // hide/show depending on whether the current page is a code page or not.
      return $(document).trigger(EVENT.LOC_CHANGE)
    })

    const pjaxContainer = $(BB_PJAX_CONTAINER_SEL)[0]

    if (pjaxContainer) {
      pageChangeObserver.observe(pjaxContainer, {
        childList: true,
      })
    }
    else { // Fall back if DOM has been changed
      let firstLoad = true, href, hash

      function detectLocChange() {
        if (location.href !== href || location.hash !== hash) {
          href = location.href
          hash = location.hash

          // If this is the first time this is called, no need to notify change as
          // Octotree does its own initialization after loading options.
          if (firstLoad) {
            firstLoad = false
          }
          else {
            setTimeout(() => {
              $(document).trigger(EVENT.LOC_CHANGE)
            }, 300) // Wait a bit for pjax DOM change
          }
        }
        setTimeout(detectLocChange, 200)
      }

      detectLocChange()
    }
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
    if (!showInNonCodePage &&
      (!type || (tyep && type !== 'src'))) {
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

    if ($pjaxContainer.length) {
      $.pjax({
        // needs full path for pjax to work with Firefox as per cross-domain-content setting
        url: location.protocol + '//' + location.host + path,
        container: $pjaxContainer
      })
    }
    else { // falls back
      super.selectFile(path)
    }
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

  _getSubmodulesInCurrentPath(tree, opts, cb) {
    const currentPath = opts.path
    const filterFn = (currentPath) ?
      ((path) => path.startsWith(`${currentPath}/`)) :
      ((path) => path.indexOf('/') === -1)

    const submodules = opts.repo.submodules
    const submodulesInCurrentPath = {}
    Object.keys(submodules).filter(filterFn).forEach((key) => {
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

  _get(path, opts, cb) {
    const host = location.protocol + '//' + 'api.bitbucket.org/1.0'
    const url = `${host}/repositories/${opts.repo.username}/${opts.repo.reponame}${path || ''}`
    const cfg  = { url, method: 'GET', cache: false }

    if (opts.token) {
      // Bitbucket App passwords can be used only for Basic Authentication.
      // Get username of logged-in user.
      const currentUser = JSON.parse($('body').attr('data-current-user'))
      if (currentUser.username) {
        cfg.headers = { Authorization: 'Basic ' + btoa(currentUser.username + ':' + opts.token) }
      }
    }

    $.ajax(cfg)
      .done((data) => cb(null, data))
      .fail((jqXHR) => this._handleError(jqXHR, cb))
  }

  // @override
  getItemHref(repo, type, encodedPath) {
    return `/${repo.username}/${repo.reponame}/src/${repo.branch}/${encodedPath}`
  }
}
