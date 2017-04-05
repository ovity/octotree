const GH_RESERVED_USER_NAMES = [
  'settings', 'orgs', 'organizations',
  'site', 'blog', 'about', 'explore',
  'styleguide', 'showcases', 'trending',
  'stars', 'dashboard', 'notifications',
  'search', 'developer', 'account',
  'pulls', 'issues', 'features', 'contact',
  'security', 'join', 'login', 'watching',
  'new', 'integrations', 'gist', 'business',
  'mirrors', 'open-source', 'personal',
  'pricing'
]
const GH_RESERVED_REPO_NAMES = ['followers', 'following', 'repositories']
const GH_404_SEL = '#parallax_wrapper'
const GH_PJAX_CONTAINER_SEL = '#js-repo-pjax-container, .context-loader-container, [data-pjax-container]'
const GH_CONTAINERS = '.container, .container-responsive'
const GH_RAW_CONTENT = 'body > pre'

class GitHub extends Adapter {

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

    // Fix #151 by detecting when page layout is updated.
    // In this case, split-diff page has a wider layout, so need to recompute margin.
    // Note that couldn't do this in response to URL change, since new DOM via pjax might not be ready.
    const diffModeObserver = new window.MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (~mutation.oldValue.indexOf('split-diff') ||
            ~mutation.target.className.indexOf('split-diff')) {
          return $(document).trigger(EVENT.LAYOUT_CHANGE)
        }
      })
    })

    diffModeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true
    })

    // GitHub switch pages using pjax. This observer detects if the pjax container
    // has been updated with new contents and trigger layout.
    const pageChangeObserver = new window.MutationObserver(() => {
      // Trigger location change, can't just relayout as Octotree might need to
      // hide/show depending on whether the current page is a code page or not.
      return $(document).trigger(EVENT.LOC_CHANGE)
    })

    const pjaxContainer = $(GH_PJAX_CONTAINER_SEL)[0]

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
    return 'octotree_github_sidebar'
  }

  // @override
  canLoadEntireTree() {
    return true
  }

  // @override
  getCreateTokenUrl() {
    return `${location.protocol}//${location.host}/settings/tokens/new`
  }

  // @override
  updateLayout(togglerVisible, sidebarVisible, sidebarWidth) {
    const SPACING = 10
    const $containers = $(GH_CONTAINERS)
    const autoMarginLeft = ($(document).width() - $containers.width()) / 2
    const shouldPushLeft = sidebarVisible && (autoMarginLeft <= sidebarWidth + SPACING)

    $('html').css('margin-left', shouldPushLeft ? sidebarWidth : '')
    $containers.css('margin-left', shouldPushLeft ? SPACING : '')
  }

  // @override
  getRepoFromPath(showInNonCodePage, currentRepo, token, cb) {

    // 404 page, skip
    if ($(GH_404_SEL).length) {
      return cb()
    }

    // Skip raw page
    if ($(GH_RAW_CONTENT).length) {
      return cb()
    }

    // (username)/(reponame)[/(type)]
    const match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/)
    if (!match) {
      return cb()
    }

    let username = ($('.commit-ref.head-ref').attr('title') || '/').match(/(.*?)\//)[1] ||
      match[1]
    let reponame = match[2]

    // Not a repository, skip
    if (~GH_RESERVED_USER_NAMES.indexOf(username) ||
        ~GH_RESERVED_REPO_NAMES.indexOf(reponame)) {
      return cb()
    }

    // Skip non-code page unless showInNonCodePage is true
    if (!showInNonCodePage && match[3] && !~['tree', 'blob'].indexOf(match[3])) {
      return cb()
    }

    // Get branch by inspecting page, quite fragile so provide multiple fallbacks
    const branch =
      // Code page
      $('.branch-select-menu .select-menu-item.selected').data('name') ||
      // Pull requests page
      ($('.commit-ref.head-ref').attr('title') || ':').match(/:(.*)/)[1] ||
      // Reuse last selected branch if exist
      (currentRepo.username === username && currentRepo.reponame === reponame && currentRepo.branch) ||
      // Get default branch from cache
      this._defaultBranch[username + '/' + reponame]

    // Still no luck, get default branch for real
    const repo = {username: username, reponame: reponame, branch: branch}

    if (repo.branch) {
      cb(null, repo)
    }
    else {
      this._get(null, {repo, token}, (err, data) => {
        if (err) return cb(err)
        repo.branch = this._defaultBranch[username + '/' + reponame] = data.default_branch || 'master'
        cb(null, repo)
      })
    }
  }

  // @override
  selectFile(path) {
    const $pjaxContainer = $(GH_PJAX_CONTAINER_SEL)

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
    opts.encodedBranch = encodeURIComponent(decodeURIComponent(opts.repo.branch))
    opts.path = (opts.node && (opts.node.sha || opts.encodedBranch)) ||
                (opts.encodedBranch + '?recursive=1')
    this._loadCodeTree(opts, null, cb)
  }

  // @override
  _getTree(path, opts, cb) {
    this._get(`/git/trees/${path}`, opts, (err, res) => {
      if (err) cb(err)
      else {
        const diff = this._getPatch(path)
        const diffExists = (Object.keys(diff).length > 0)
        const filteredTree = res.tree.filter((node) => {
          node.patch = diff[node.path]
          delete diff[node.path]
          return !diffExists || node.patch
        })

        cb(null, filteredTree)
      }
    })
  }

  // @override
   _getPatch(path) {
     const diff = {}
     const files = $(".diff-view .file-info")
     files.each(function() {
       const file = $(this).find("a.link-gray-dark").first()

       let path = file.attr("title")
       let href = file.attr("href")
       let previous = ""

       const rename_index = path.indexOf("→")
       if (rename_index != -1) {
         previous = path.substring(0, rename_index-1)
         path = path.substring(rename_index+2)
       }

       if (!path.startsWith(path)) return

       const stats = $(this).find(".diffstat").first()
       const stats_text = stats.attr("aria-label")
       const patch = {type: "blob", path: path, href: href, additions: 0, deletions: 0}

       if (stats_text.indexOf("addition") != -1) {
         const stats_parts = stats_text.split(" ")
         patch.additions = Number(stats_parts[0])
         patch.deletions = Number(stats_parts[3])
         patch.action = "modify"
       } else {
         if (stats_text.indexOf("renamed") != -1) {
           patch.action = "rename"
           patch.previous = previous
         } else if (stats_text.indexOf("added") != -1) {
           patch.action = "add"
         }
       }

       diff[path] = patch

       const base = []
       path.split("/").slice(0, -1).forEach(function(rel_path) {
         base.push(rel_path)
         const fullpath = base.join("/")

         if (!diff[fullpath]) {
           diff[fullpath] = {
             path:fullpath, type:"tree",
             additions:0, deletions:0, files: 0,
           }
         }

         diff[fullpath].files++
         diff[fullpath].additions += patch.additions
         diff[fullpath].deletions += patch.deletions
       })
     })

     return diff
   }

  // @override
  _getSubmodules(tree, opts, cb) {
    const item = tree.filter((item) => /^\.gitmodules$/i.test(item.path))[0]
    if (!item) return cb()

    this._get(`/git/blobs/${item.sha}`, opts, (err, res) => {
      if (err) return cb(err)
      const data = atob(res.content.replace(/\n/g,''))
      cb(null, parseGitmodules(data))
    })
  }

  _get(path, opts, cb) {
    const host = location.protocol + '//' +
      (location.host === 'github.com' ? 'api.github.com' : (location.host + '/api/v3'))
    const url = `${host}/repos/${opts.repo.username}/${opts.repo.reponame}${path || ''}`
    const cfg  = { url, method: 'GET', cache: false }

    if (opts.token) {
      cfg.headers = { Authorization: 'token ' + opts.token }
    }

    $.ajax(cfg)
      .done((data) => {
        if (path && path.indexOf('/git/trees') === 0 && data.truncated) {
          this._handleError({status: 206}, cb)
        }
        else cb(null, data)
      })
      .fail((jqXHR) => this._handleError(jqXHR, cb))
  }
}
