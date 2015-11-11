class Adapter {
  constructor(store) {
    this.store = store
    this._defaultBranch = {}
    this.observe()
  }

  observe() {
    if (!window.MutationObserver) return

    // Fix #151 by detecting when page layout is updated.
    // In this case, split-diff page has a wider layout, so need to recompute margin.
    // Note that couldn't do this in response to URL change, since new DOM via pjax might not be ready.
    const observer = new window.MutationObserver((mutations) => {
      for (const mutation of mutations) {
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

  selectSubmodule(path) {
    window.location.href = path
  }

  downloadFile(path, fileName) {
    const link = document.createElement('a')
    link.setAttribute('href', path.replace(/\/blob\//, '/raw/'))
    link.setAttribute('download', fileName)
    link.click()
  }

  /**
   * Loads the code tree of a repository.
   * @param {Object} opts: {
   *                  repo: repository,
   *                  node(optional): selected node (null to load entire tree),
   *                  token (optional): user access token,
   *                  apiUrl (optional): base API URL
   *                 }
   * @param {Function} transform(item)
   * @param {Function} cb(err: error, tree: array (of arrays) of items)
   * @api protected
   */
  loadCodeTree(opts, transform, cb) {
    const folders = { '': [] }
    const $dummyDiv = $('<div/>')

    this.repo = opts.repo
    this.token = opts.token
    this.treePath = opts.treePath
    this.encodedBranch = encodeURIComponent(decodeURIComponent(this.repo.branch))

    this.getTree(this.treePath, (err, tree) => {
      if (err) return cb(err)

      this.getSubmodules(tree, (err, submodules) => {
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
            if (opts.node && opts.node.path) {
              item.path = opts.node.path + '/' + item.path
            }

            const path = item.path
            const type = item.type
            const index = path.lastIndexOf('/')
            const name = $dummyDiv.text(path.substring(index + 1)).html() // sanitizes, closes #9

            item.id = PREFIX + path
            item.text = name
            item.icon = type // use `type` as class name for tree node

            if (opts.node) {
              folders[''].push(item)
            }
            else {
              folders[path.substring(0, index)].push(item)
            }

            if (type === 'tree') {
              if (opts.node) item.children = true
              else folders[item.path] = item.children = []
              item.a_attr = { href: '#' }
            }
            else if (type === 'blob') {
              item.a_attr = {
                href: `/${this.repo.username}/${this.repo.reponame}/${type}/${this.repo.branch}/${encodeURIComponent(path)}`
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

  handleError(jqXHR, cb) {
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
             Follow <a href="${getCreateTokenUrl()}" target="_blank">this link</a>
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
      error    : `Error: ${error}`,
      message  : message,
      needAuth : needAuth,
    })
  }
}
