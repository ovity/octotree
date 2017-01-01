class Adapter {
  constructor(deps) {
    deps.forEach(dep => window[dep]())
    this._defaultBranch = {}
  }

  /**
   * Loads the code tree of a repository.
   * @param {Object} opts: {
   *                  path: the starting path to load the tree,
   *                  repo: the current repository,
   *                  node (optional): the selected node (null to load entire tree),
   *                  token (optional): the personal access token
   *                 }
   * @param {Function} transform(item)
   * @param {Function} cb(err: error, tree: Array[Array|item])
   */
  _loadCodeTree(opts, transform, cb) {
    const folders = { '': [] }
    const $dummyDiv = $('<div/>')
    const {path, repo, node} = opts

    opts.encodedBranch = opts.encodedBranch || encodeURIComponent(decodeURIComponent(repo.branch))

    this._getTree(path, opts, (err, tree) => {
      if (err) return cb(err)

      this._getSubmodules(tree, opts, (err, submodules) => {
        if (err) return cb(err)

        submodules = submodules || {}

        const nextChunk = (iteration = 0) => {
          const CHUNK_SIZE = 300

          for (let i = 0; i < CHUNK_SIZE; i++) {
            const item = tree[iteration * CHUNK_SIZE + i]

            // we're done
            if (item === undefined) {
              return cb(null, folders[''])
            }

            // runs transform requested by subclass
            if (transform) {
              transform(item)
            }

            // if lazy load and has parent, prefix with parent path
            if (node && node.path) {
              item.path = node.path + '/' + item.path
            }

            const path = item.path
            const type = item.type
            const index = path.lastIndexOf('/')
            const name = $dummyDiv.text(path.substring(index + 1)).html() // sanitizes, closes #9

            item.id = NODE_PREFIX + path
            item.text = name
            item.icon = type // uses `type` as class name for tree node

            if (node) {
              folders[''].push(item)
            }
            else {
              folders[path.substring(0, index)].push(item)
            }

            if (type === 'tree' || type === 'blob') {
              if (type === 'tree') {
                if (node) item.children = true
                else folders[item.path] = item.children = []
              }

              // encodes but retains the slashes, see #274
              const encodedPath = path.split('/').map(encodeURIComponent).join('/')
              item.a_attr = {
                href: `/${repo.username}/${repo.reponame}/${type}/${repo.branch}/${encodedPath}`
              }
            }
            else if (type === 'commit') {
              let moduleUrl = submodules[item.path]

              if (moduleUrl) { // fixes #105
                // special handling for submodules hosted in GitHub
                if (~moduleUrl.indexOf('github.com')) {
                  moduleUrl = moduleUrl.replace(/^git(:\/\/|@)/, window.location.protocol + '//')
                                       .replace('github.com:', 'github.com/')
                                       .replace(/.git$/, '')
                  item.text = `<a href="${moduleUrl}" class="jstree-anchor">${name}</a>
                               <span>@ </span>
                               <a href="${moduleUrl}/tree/${item.sha}" class="jstree-anchor">${item.sha.substr(0, 7)}</a>`
                }
                item.a_attr = { href: moduleUrl }
              }
            }
          }

          setTimeout(() => nextChunk(iteration + 1))
        }

        nextChunk()
      })
    })
  }

  _handleError(jqXHR, cb) {
    let error, message, needAuth

    switch (jqXHR.status) {
      case 0:
        error = 'Connection error'
        message =
          `Cannot connect to website.
           If your network connection to this website is fine, maybe there is an outage of the API.
           Please try again later.`
        needAuth = false
        break
      case 206:
        error = 'Repo too large'
        message =
          `This repository is too large to be retrieved at once.
           If you frequently work with this repository, go to Settings and uncheck the "Load entire tree at once" option.`
        break
      case 401:
        error = 'Invalid token'
        message =
          `The token is invalid.
           Follow <a href="${this.getCreateTokenUrl()}" target="_blank">this link</a>
           to create a new token and paste it below.`
        needAuth = true
        break
      case 409:
        error = 'Empty repository'
        message = 'This repository is empty.'
        break
      case 404:
        error = 'Private repository'
        message =
          `Accessing private repositories requires a access token.
           Follow <a href="${this.getCreateTokenUrl()}" target="_blank">this link</a>
           to create one and paste it below.`
        needAuth = true
        break
      case 403:
        if (~jqXHR.getAllResponseHeaders().indexOf('X-RateLimit-Remaining: 0')) {
          // It's kinda specific for GitHub
          error = 'API limit exceeded'
          message =
            `You have exceeded the GitHub API hourly limit and need GitHub access token
             to make extra requests. Follow <a href="${this.getCreateTokenUrl()}" target="_blank">this link</a>
             to create one and paste it below.`
          needAuth = true
          break
        }
        else {
          error = 'Forbidden'
          message =
            `You are not allowed to access the API.
             You might need to provide an access token.
             Follow <a href="${this.getCreateTokenUrl()}" target="_blank">this link</a>
             to create one and paste it below.`
          needAuth = true
          break
        }
      default:
        error = message = jqXHR.statusText
        needAuth = false
        break
    }
    cb({
      error: `Error: ${error}`,
      message: message,
      needAuth: needAuth
    })
  }

  /**
   * Inits behaviors after the sidebar is added to the DOM.
   * @api public
   */
  init($sidebar) {
    $sidebar
      .resizable({ handles: 'e', minWidth: this.getMinWidth() })
      .addClass(this.getCssClass())
  }

  /**
   * Returns the CSS class to be added to the Octotree sidebar.
   * @api protected
   */
  getCssClass() {
    throw new Error('Not implemented')
  }

  /**
   * Returns the minimum width acceptable for the sidebar.
   * @api protected
   */
  getMinWidth() {
    return 200
  }

  /**
   * Returns whether the adapter is capable of loading the entire tree in
   * a single request. This is usually determined by the underlying the API.
   * @api public
   */
  canLoadEntireTree() {
    return false
  }

  /**
   * Loads the code tree.
   * @api public
   */
  loadCodeTree(opts, cb) {
    throw new Error('Not implemented')
  }

  /**
   * Returns the URL to create a personal access token.
   * @api public
   */
  getCreateTokenUrl() {
    throw new Error('Not implemented')
  }

  /**
   * Updates the layout based on sidebar visibility and width.
   * @api public
   */
  updateLayout(togglerVisible, sidebarVisible, sidebarWidth) {
    throw new Error('Not implemented')
  }

  /**
   * Returns repo info at the current path.
   * @api public
   */
  getRepoFromPath(showInNonCodePage, currentRepo, token, cb) {
    throw new Error('Not implemented')
  }

  /**
   * Selects the file at a specific path.
   * @api public
   */
  selectFile(path) {
    window.location.href = path
  }

  /**
   * Selects a submodule.
   * @api public
   */
  selectSubmodule(path) {
    window.location.href = path
  }

  /**
   * Selects the file/submodule/... at a specific path in a new tab window.
   * @api public
   */
  openInNewTab(path) {
    let win = window.open(path, '_blank')
    win.focus()
  }

  /**
   * Downloads a file.
   * @api public
   */
  downloadFile(path, fileName) {
    const link = document.createElement('a')
    link.setAttribute('href', path.replace(/\/blob\//, '/raw/'))
    link.setAttribute('download', fileName)
    link.click()
  }

  /**
   * Gets tree at path.
   * @param {Object} opts - {token, repo}
   * @api protected
   */
  _getTree(path, opts, cb) {
    throw new Error('Not implemented')
  }

  /**
   * Gets submodules in the tree.
   * @param {Object} opts - {token, repo, encodedBranch}
   * @api protected
   */
  _getSubmodules(tree, opts, cb) {
    throw new Error('Not implemented')
  }
}
