const GL_RESERVED_USER_NAMES = [
  'u', 'dashboard', 'projects', 'users', 'help',
  'explore', 'profile', 'public', 'groups', 'abuse_reports'
]
const GL_RESERVED_REPO_NAMES = []
const GL_CONTAINERS = '.sidebar-wrapper, .toggle-nav-collapse'
const GL_HEADER = '.navbar-gitlab'
const GL_SIDEBAR = '.sidebar-wrapper'
const GL_SHIFTED = 'h1.title'
const GL_PROJECT_ID = '#project_id'

class GitLab extends Adapter {
  constructor(store) {
    super(store)

    // GitLab (for now) embeds access token in the page.
    // Use it to set the token if one isn't available.
    let token = store.get(STORE.TOKEN)
    if (!token) {
      token = $('head').text().match(/gon.api_token\s*=\s*"(.*?)"/m)[1]
      if (token) {
        store.set(STORE.TOKEN, token, true)
      }
    }

    $('.toggle-nav-collapse').click(() => {
      setTimeout(() => {
        $(document).trigger(EVENT.LAYOUT_CHANGE)
      }, 10)
    })

    // GL disables our submit buttons, reenable them
    const btns = $('.octotree_view_body button[type="submit"]')
    btns.click((event) => {
      setTimeout(() => {
        $(event.target).prop('disabled', false).removeClass('disabled')
      }, 30)
    })
  }

  getCssClass() {
    return 'octotree_gitlab_sidebar'
  }

  canLoadEntireTree() {
    return false
  }

  getCreateTokenUrl() {
    return `${location.protocol}//${location.host}/profile/account`
  }

  updateLayout(sidebarVisible, sidebarWidth) {
    var $containers = $(GL_CONTAINERS)

    $(GL_HEADER).css('z-index', 3)

    if ($containers.length === 2) {
      const useNewDesign = $('.navbar-gitlab.header-collapsed, .navbar-gitlab.header-expanded').length > 0
      const glSidebarExpanded = $('.page-with-sidebar').hasClass('page-sidebar-expanded')
      let glSidebarWidth = glSidebarExpanded ? 230 : 62

      if (useNewDesign) {
        $(GL_SHIFTED).css('margin-left', 36)
        $('.octotree_toggle').css('right', sidebarVisible ? '' : -(glSidebarWidth + 50))
      }
      else {
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
    else $('html').css('margin-left', sidebarVisible ? sidebarWidth : '')
  }

  getRepoFromPath(showInNonCodePage, currentRepo, token, cb) {

    // 404 page, skip - GitLab doesn't have specific element for Not Found page
    if ($(document).find("title").text() === 'The page you\'re looking for could not be found (404)') {
      return cb()
    }

    // No project id no way to fetch project files
    if (!$(GL_PROJECT_ID).length) {
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
    const GL_BRANCH_SEL_1 = '#repository_ref'
    const GL_BRANCH_SEL_2 = '.select2-container.project-refs-select.select2 .select2-chosen'
    const GL_BRANCH_SEL_3 = '.nav.nav-sidebar .shortcuts-tree'

    const branch =
      // Code page
      $(GL_BRANCH_SEL_1).val() || $(GL_BRANCH_SEL_2).text() ||
      // Non-code page
      ($(GL_BRANCH_SEL_3).attr('href') || '').match(/([^\/]+)/g)[3] ||
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
    // TODO: pjax possible?
    window.location.href = path
  }

  loadCodeTree(opts, cb) {
    opts.treePath = opts.node.path
    super.loadCodeTree(opts, (item) => {
      item.sha = item.id
      item.path = item.name
    }, cb)
  }

  getSubmodules(tree, cb) {
    const item = tree.filter((item) => /^\.gitmodules$/i.test(item.name))[0]
    if (!item) return cb()

    this.getBlob(this.encodedBranch, item.name, (err, data) => {
      if (err || !data) return cb(err)
      parseGitmodules(data, cb)
    })
  }

  getTree(tree, cb) {
    this.get(this.repo, `tree?path=${tree}&ref_name=${this.encodedBranch}`, this.token, cb)
  }

  getBlob(sha, path, cb) {
    this.get(this.repo, `blobs/${sha}?filepath=${path}`, this.token, cb)
  }

  get(repo, path, token, cb) {
    const host = `${location.host}/api/v3`
    const projectId = $(GL_PROJECT_ID).val()
    const url = `${location.protocol}//${host}/projects/${projectId}/repository/${path}&private_token=${token}`
    const cfg = { method: 'GET', url, cache: false }

    $.ajax(cfg)
      .done((data) => cb(null, data))
      .fail((jqXHR) => this.handleError(jqXHR, cb))
  }
}
