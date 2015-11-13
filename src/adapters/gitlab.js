const GL_RESERVED_USER_NAMES = [
  'u', 'dashboard', 'projects', 'users', 'help',
  'explore', 'profile', 'public', 'groups', 'abuse_reports'
]
const GL_RESERVED_REPO_NAMES = []
const GL_HEADER = '.navbar-gitlab'
const GL_SIDEBAR = '.sidebar-wrapper'
const GL_SHIFTED = 'h1.title'
const GL_PROJECT_ID = '#project_id'

class GitLab extends Adapter {

  constructor(store) {
    super()

    // GitLab (for now) embeds access token in the page.
    // Use it to set the token if one isn't available.
    let token = store.get(STORE.TOKEN)
    if (!token) {
      token = $('head').text().match(/gon.api_token\s*=\s*"(.*?)"/m)[1]
      if (token) {
        store.set(STORE.TOKEN, token, true)
      }
    }
  }

  // @override
  init($sidebar) {
    super.init($sidebar)

    // Triggers layout when the GL sidebar is toggled
    $('.toggle-nav-collapse').click(() => {
      setTimeout(() => {
        $(document).trigger(EVENT.LAYOUT_CHANGE)
      }, 10)
    })

    // GitLab disables our submit buttons, re-enable them
    $('.octotree_view_body button[type="submit"]').click((event) => {
      setTimeout(() => {
        $(event.target).prop('disabled', false).removeClass('disabled')
      }, 100)
    })

    // Reuses GitLab styles for inputs
    $('.octotree_view_body input[type="text"], .octotree_view_body textarea')
      .addClass('form-control')

    // GitLab removes DOM, add back
    $(document).on(EVENT.LOC_CHANGE, () => {
      $sidebar.appendTo('body')
    })
  }

  // @override
  getCssClass() {
    return 'octotree_gitlab_sidebar'
  }

  // @override
  getMinWidth() {
    return 230 // just enough to hide the GitLab sidebar
  }

  // @override
  getCreateTokenUrl() {
    return `${location.protocol}//${location.host}/profile/account`
  }

  // @override
  updateLayout(sidebarVisible, sidebarWidth) {
    const isNewDesign = $('.navbar-gitlab.header-collapsed, .navbar-gitlab.header-expanded').length > 0
    const glSidebarExpanded = $('.page-with-sidebar').hasClass('page-sidebar-expanded')

    if (isNewDesign) {
      const glSidebarWidth = glSidebarExpanded ? 230 : 62
      $(GL_SHIFTED).css('margin-left',  sidebarVisible ? '' : 36)
      $('.octotree_toggle').css('right', sidebarVisible ? '' : -(glSidebarWidth + 50))
    }
    else {
      const glSidebarWidth = glSidebarExpanded ? 230 : 52
      $(GL_HEADER).css('z-index', 3)
      $(GL_SIDEBAR).css('z-index', 1)
      $(GL_SHIFTED).css('margin-left',  sidebarVisible ? '' : 56)
      $('.octotree_toggle').css({
        'right': sidebarVisible ? '' : -102,
        'top': sidebarVisible ? '' : 8
      })
    }

    $(GL_HEADER).css({'z-index': 3, 'margin-left': sidebarVisible ? sidebarWidth : ''})
    $('.page-with-sidebar').css('padding-left', sidebarVisible ? sidebarWidth : '')
  }

  // @override
  getRepoFromPath(showInNonCodePage, currentRepo, token, cb) {

    // 404 page, skip - GitLab doesn't have specific element for Not Found page
    if ($(document).find('title').text() === 'The page you\'re looking for could not be found (404)') {
      return cb()
    }

    // We need project ID
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
      this._get(null, {token}, (err, data) => {
        if (err) return cb(err)
        repo.branch = this._defaultBranch[username + '/' + reponame] = data.default_branch || 'master'
        cb(null, repo)
      })
    }
  }

  // @override
  loadCodeTree(opts, cb) {
    opts.path = opts.node.path
    this._loadCodeTree(opts, (item) => {
      item.sha = item.id
      item.path = item.name
    }, cb)
  }

  // @override
  _getTree(path, opts, cb) {
    this._get(`/tree?path=${path}&ref_name=${opts.encodedBranch}`, opts, cb)
  }

  // @override
  _getSubmodules(tree, opts, cb) {
    const item = tree.filter((item) => /^\.gitmodules$/i.test(item.name))[0]
    if (!item) return cb()

    this._get(`/blobs/${opts.encodedBranch}?filepath=${item.name}`, opts, (err, data) => {
      if (err) return cb(err)
      cb(null, parseGitmodules(data))
    })
  }

  _get(path, opts, cb) {
    const projectId = $(GL_PROJECT_ID).val()
    const host = `${location.protocol}//${location.host}/api/v3`
    const url = `${host}/projects/${projectId}/repository${path}&private_token=${opts.token}`
    const cfg = { url, method: 'GET', cache: false }

    $.ajax(cfg)
      .done((data) => cb(null, data))
      .fail((jqXHR) => this._handleError(jqXHR, cb))
  }
}
