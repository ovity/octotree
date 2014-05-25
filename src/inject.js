(function() {
  const PREFIX = 'octotree'
      , STORE_TOKEN = 'octotree.github_access_token'
      , STORE_POPUP = 'octotree.popup_shown'
      , STORE_WIDTH = 'octotree.sidebar_width'
      , DEFAULT_WIDTH = 250
      , RESERVED_USER_NAMES = [
          'settings', 'orgs', 'organizations', 
          'site', 'blog', 'about', 'explore',
          'styleguide', 'showcases', 'trending',
          'stars', 'dashboard', 'notifications'
        ]
      , RESERVED_REPO_NAMES = ['followers', 'following']
      , EVT_TOGGLED = 'octotree:toggled'

      // fragile selectors based GitHub DOM, uses of them must be change-proof
      , GH_BRANCH_SEL     = '*[data-master-branch]'
      , GH_BRANCH_BTN_SEL = '*[data-master-branch] > .js-select-button'
      , GH_PJAX_SEL       = '#js-repo-pjax-container'
      , GH_404_SEL        = '#parallax_wrapper'

      // regexps from https://github.com/shockie/node-iniparser
      , INI_SECTION = /^\s*\[\s*([^\]]*)\s*\]\s*$/
      , INI_COMMENT = /^\s*;.*$/
      , INI_PARAM   = /^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/

  var $html = $('html')
    , $dom  = $('<div>' +
                  '<nav class="octotree_sidebar">' +
                    '<div class="octotree_header"/>' +
                    '<div class="octotree_treeview"/>' +
                    '<form class="octotree_options">' +
                      '<div class="message"/>' +
                      '<div>' +
                        '<input name="token" type="text" placeholder="Paste access token here" autocomplete="off"/>' +
                      '</div>' +
                      '<div>' +
                        '<button type="submit" class="button">Save</button>' +
                        '<a href="https://github.com/buunguyen/octotree#github-api-rate-limit" target="_blank">Why is this required?</a>' +
                      '</div>' +
                      '<div class="error"/>' +
                    '</form>' +
                  '</nav>' +
                  '<a class="octotree_toggle button"><div class="loader"/><span/></a>' +
                  '<div class="octotree_popup">' +
                    '<div class="arrow"/>' +
                    '<div class="content">Octotree is enabled on every GitHub code page. Click this button or press <kbd>⌘ b</kbd> (or <kbd>ctrl b</kbd>) to show it.</div>' +
                  '</div>' +
                '</div>')
    , $sidebar   = $dom.find('.octotree_sidebar')
    , $treeView  = $sidebar.find('.octotree_treeview')
    , $optsFrm   = $sidebar.find('.octotree_options')
    , $toggleBtn = $dom.find('.octotree_toggle')
    , $helpPopup = $dom.find('.octotree_popup')
    , $dummyDiv  = $('<div/>')
    , $document  = $(document)
    , store       = new Storage()
    , currentRepo = false
    , keysBound   = false

  $document.ready(function() {
    // initializes DOM
    $('body')
      .append($sidebar)
      .append($toggleBtn.click(toggleSidebar))
    $sidebar
      .width(store.get(STORE_WIDTH) || DEFAULT_WIDTH)
      .resizable({
        handles  : 'e',
        minWidth : 200
      })
      .resize(sidebarResized)
      .on(EVT_TOGGLED, sidebarResized)
    $treeView.hide()
    $optsFrm.hide().submit(saveToken)

    $document
      .on('pjax:send octotree:start', function() {
        $toggleBtn.addClass('loading')
      })
      .on('pjax:end octotree:end', function() {
        $toggleBtn.removeClass('loading')
      })
      .on('pjax:timeout', function(event) {
        event.preventDefault()
      })

    // When navigating from non-code pages (i.e. Pulls, Issues) to code page
    // GitHub doesn't reload the page but uses pjax. Need to detect and load Octotree.
    var href, hash
    function detectLocationChange() {
      if (location.href !== href || location.hash !== hash) {
        href = location.href
        hash = location.hash
        tryLoadRepo()
      }
      setTimeout(detectLocationChange, 200)
    }
    detectLocationChange()
  })

  function tryLoadRepo(reload) {
    var repo = getRepoFromPath()
      , repoChanged = JSON.stringify(repo) !== JSON.stringify(currentRepo)

    if (repo) {
      showHelpPopup()
      $toggleBtn.show()
      if (!keysBound) {
        key('⌘+b, ⌃+b', toggleSidebar)
        keysBound = true
      }

      if (repoChanged || reload) {
        $document.trigger('octotree:start')
        currentRepo = repo
        fetchData(repo, function(err, tree) {
          if (err) {
            $document.trigger('octotree:end')
            return onFetchError(err)
          }
          renderTree(repo, tree, function() {
            $document.trigger('octotree:end')
            selectTreeNode()
          })
        })
      } 
      else selectTreeNode()
    } 
    else {
      $toggleBtn.hide()
      toggleSidebar(false)
      if (keysBound) {
        key.unbind('⌘+b, ⌃+b')
        keysBound = false
      }
    }
  }

  function selectTreeNode() {
    var tree = $.jstree.reference($treeView)
      , path = location.pathname

    if (!tree) return
    tree.deselect_all()

    // e.g. converts /buunguyen/octotree/type/branch/path to path
    var match = path.match(/(?:[^\/]+\/){4}(.*)/)
    if (match) tree.select_node(PREFIX + decodeURIComponent(match[1]))
  }

  function getRepoFromPath() {
    // 404 page, skip
    if ($(GH_404_SEL).length) return false

    // (username)/(reponame)[/(subpart)]
    var match = location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/)
    if (!match) return false

    // not a repository, skip
    if (~RESERVED_USER_NAMES.indexOf(match[1])) return false
    if (~RESERVED_REPO_NAMES.indexOf(match[2])) return false

    // not a code page, skip
    if (match[3] && !~['tree', 'blob'].indexOf(match[3])) return false

    // can actually check if *[data-master-branch] exists and remove all the checks above
    // but the current approach is less fragile in case of GitHub DOM changes
    var branch = $(GH_BRANCH_SEL).data('ref') || $(GH_BRANCH_BTN_SEL).text() || 'master'
    return { 
      username : match[1], 
      reponame : match[2],
      branch   : branch
    }
  }

  function fetchData(repo, done) {
    var github  = new Github({ token: store.get(STORE_TOKEN) })
      , api     = github.getRepo(repo.username, repo.reponame)
      , folders = { '': [] }
      , encodedBranch = encodeURIComponent(decodeURIComponent(repo.branch))

    api.getTree(encodedBranch + '?recursive=true', function(err, tree) {
      if (err) return done(err)

      fetchSubmodules(function(err, submodules) {
        if (err) return done(err)

        // split work in chunks to prevent blocking UI on large repos
        nextChunk(0)
        function nextChunk(iteration) {
          var chunkSize = 500
            , baseIndex = iteration * chunkSize
            , i
            , item, path, type, index, name

          for (i = 0; i < chunkSize; i++) {
            item = tree[baseIndex + i]
            if (item === undefined) return done(null, sort(folders['']))

            path  = item.path
            type  = item.type
            index = path.lastIndexOf('/')
            name  = $dummyDiv.text(path.substring(index + 1)).html() // sanitizes, closes #9

            item.id   = PREFIX + path
            item.text = name
            item.icon = type // use `type` as class name for tree node

            folders[path.substring(0, index)].push(item)

            if (type === 'tree') {
              folders[item.path] = item.children = []
              item.a_attr = { href: '#' }
            }
            else if (type === 'blob') {
              item.a_attr = { href: '/' + repo.username + '/' + repo.reponame + '/' + type + '/' + repo.branch + '/' + encodeURIComponent(path) /* closes #97 */ }
            }
            else if (type === 'commit') {
              var moduleUrl = submodules[item.path]

              // special handling for submodules hosted in GitHub
              if (~moduleUrl.indexOf('github.com')) {
                item.text = '<a href="' + moduleUrl + '" class="jstree-anchor">' + name + '</a>' +
                            '<span>@ </span>' +
                            '<a href="' + moduleUrl.replace(/.git$/, '') + '/tree/' + item.sha + '" class="jstree-anchor">' + item.sha.substr(0, 7) + '</a>'
              }
              item.a_attr = { href: moduleUrl }
            }
          }

          setTimeout(function() { 
            nextChunk(iteration + 1) 
          }, 0)
        }
      })

      function fetchSubmodules(cb) {
        var item = tree.filter(function(item) { return /^\.gitmodules$/i.test(item.path) })[0]
        if (!item) return cb()

        api.getBlob(item.sha, function(err, data) {
          if (err || !data) return cb(err)

          var submodules = {}
            , lines = data.split(/\r\n|\r|\n/)
            , lastPath

          lines.forEach(function(line) {
            var match
            if (INI_SECTION.test(line) || INI_COMMENT.test(line) || !(match = line.match(INI_PARAM))) return
            if (match[1] === 'path') lastPath = match[2]
            else if (match[1] === 'url') submodules[lastPath] = match[2]
          })

          cb(null, submodules)
        })
      }

      // sorts (try matching GitHub's sort order)
      function sort(folder) {
        folder.sort(function(a, b) {
          if (a.type === b.type) return a.text === b.text ? 0 : a.text < b.text ? -1 : 1
          return a.type === 'blob' ? 1 : -1
        })
        folder.forEach(function(item) {
          if (item.type === 'tree') sort(item.children)
        })
        return folder
      }
    })
  }

  function onFetchError(err) {
    var header   = 'Error: ' + err.error
      , hasToken = !!store.get(STORE_TOKEN)
      , message

    switch (err.error) {
      case 401:
        header  = 'Invalid token!'
        message = 'The token is invalid. Follow <a href="https://github.com/settings/tokens/new" target="_blank">this link</a> to create a new token and paste it below.'
        break
      case 409:
        header  = 'Empty repository!'
        message = 'This repository is empty.'
        requestToken = false
        break
      case 404:
        header  = 'Private repository!'
        message = hasToken
          ? 'You are not allowed to access this repository.'
          : 'Accessing private repositories requires a GitHub access token. Follow <a href="https://github.com/settings/tokens/new" target="_blank">this link</a> to create one and paste it below.'
        break
      case 403:
        if (~err.request.getAllResponseHeaders().indexOf('X-RateLimit-Remaining: 0')) {
          header  = 'API limit exceeded!'
          message = hasToken
            ? 'You have exceeded the API hourly limit.'
            : 'You have exceeded the GitHub API hourly limit and need GitHub access token to make extra requests. Follow <a href="https://github.com/settings/tokens/new" target="_blank">this link</a> to create one and paste it below.'
        }
        break
    }

    renderSidebar('<div class="octotree_header_error">' + header + '</div>', message)
  }

  function renderTree(repo, tree, cb) {
    $treeView.empty()
      .jstree({
        core    : { data: tree, multiple: false, themes : { responsive : false } },
        plugins : ['wholerow', 'state'],
        state   : { key : PREFIX + '.' + repo.username + '/' + repo.reponame }
      })
      .on('click.jstree', '.jstree-open>a', function() {
        $.jstree.reference(this).close_node(this)
      })
      .on('click.jstree', '.jstree-closed>a', function() {
        $.jstree.reference(this).open_node(this)
      })
      .on('click', function(e) {
        var $target = $(e.target)
        if (!$target.is('a.jstree-anchor')) return

        var href  = $target.attr('href')
          , $icon = $target.children().length 
            ? $target.children(':first') 
            : $target.siblings(':first') // handles child links in submodule

        if ($icon.hasClass('commit')) {
          location.href = href
        }
        else if ($icon.hasClass('blob')) {
          var container = $(GH_PJAX_SEL)
          if (container.length) {
            $.pjax({ 
              url       : href,
              container : container
            })
          }
          else location.href = href // falls back
        }
      })
      .on('ready.jstree', function() {
        var headerText = '<div class="octotree_header_repo">' +
                           repo.username + ' / ' + repo.reponame +
                         '</div>' +
                         '<div class="octotree_header_branch">' +
                           repo.branch +
                         '</div>'
        renderSidebar(headerText)
        cb()
      })
  }

  function renderSidebar(header, message) {
    $sidebar.find('.octotree_header').html(header)

    if (message) {
      var token = store.get(STORE_TOKEN)
      $optsFrm.find('.message').html(message)
      $optsFrm.show()
      $treeView.hide()
      if (token) $optsFrm.find('[name="token"]').val(token)
    } 
    else {
      $optsFrm.hide()
      $treeView.show()
    }
  }

  function saveToken(event) {
    event.preventDefault()

    var $error = $optsFrm.find('.error').text('')
      , token  = $optsFrm.find('[name="token"]').val()

    if (!token) return $error.text('Token is required')

    store.set(STORE_TOKEN, token)
    tryLoadRepo(true)
  }

  function toggleSidebar(visibility) {
    if (visibility !== undefined) {
      if ($html.hasClass(PREFIX) === visibility) return
      toggleSidebar()
    } 
    else {
      $html.toggleClass(PREFIX)
      $sidebar.trigger(EVT_TOGGLED)
    }
  }

  function sidebarResized() {
    var width = $sidebar.width()
      , shown = $html.hasClass(PREFIX)

    $html.css('margin-left', shown ? width - 10 : 0)
    $toggleBtn.css('left', shown ? width - 35 : 5)
    store.set(STORE_WIDTH, width)
  }

  function showHelpPopup() {
    if (!store.get(STORE_POPUP)) {
      $helpPopup.css('display', 'block').appendTo($('body'))
      setTimeout(function() {
        // TODO: move to domain-agnostic storage
        store.set(STORE_POPUP, true)
        $helpPopup.addClass('show').click(hide)
        setTimeout(hide, 12000)
        $sidebar.one(EVT_TOGGLED, hide)
      }, 500 /* deplay a bit seems nicer */)      

      function hide() {
        if (!$helpPopup.hasClass('show')) return
        $helpPopup
          .removeClass('show')
          .one('transitionend', function() { 
            $helpPopup.remove() 
          })
      }
    }
  }

  function Storage() {
    this.get = function(key) {
      var val = localStorage.getItem(key)
      try {
        return JSON.parse(val)
      } catch (e) {
        return val
      }
    }
    this.set = function(key, val) {
      return localStorage.setItem(key, JSON.stringify(val))
    }
  }
})()