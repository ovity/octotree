(function() {
  const PREFIX = 'octotree'
      , TOKEN  = 'octotree.github_access_token'
      , SHOWN  = 'octotree.already_shown'
      , WIDTH  = 'octotree.sidebar_width'
      , RESERVED_USER_NAMES = [
          'settings', 'orgs', 'organizations', 
          'site', 'blog', 'about', 'explore',
          'styleguide', 'showcases', 'trending',
          'stars', 'dashboard', 'notifications'
        ]
      , RESERVED_REPO_NAMES = ['followers', 'following']

  var $html    = $('html')
    , $sidebar = $('<nav class="octotree_sidebar">' +
                     '<div class="octotree_header"/>' +
                     '<div class="octotree_treeview"/>' +
                     '<form class="octotree_options">' +
                       '<div class="message"/>' +
                       '<div>' +
                         '<input name="token" type="text" placeholder="Paste access token here" autocomplete="off"/>' +
                       '</div>' +
                       '<div>' +
                         '<button type="submit" class="button">Save</button>' +
                         '<a href="https://github.com/buunguyen/octotree#github-api-rate-limit" target="_blank">Why need access token?</a>' +
                       '</div>' +
                       '<div class="error"/>' +
                     '</form>' +
                     '<a class="octotree_toggle button"><span/></a>' +
                   '</nav>')
    , $treeView  = $sidebar.find('.octotree_treeview')
    , $optsFrm   = $sidebar.find('.octotree_options')
    , $toggleBtn = $sidebar.find('.octotree_toggle')
    , $dummyDiv  = $('<div/>')
    , store      = new Storage()
    , currentRepo = false

  $(document).ready(function() {

    // initializes DOM
    $('body').append($sidebar).append($toggleBtn)
    $sidebar
      .width(store.get(WIDTH) || 250)
      .css('left', -$sidebar.width())
      .hide() // prevents Safari from showing sidebar briefly
      .resizable({
        handles  : 'e',
        minWidth : 200
      })
      .resize(sidebarResized)
    $treeView.hide()
    $optsFrm.hide().submit(saveToken)
    $toggleBtn.click(toggleSidebar)
    key('⌘+b, ctrl+b', toggleSidebar)

    // When navigating from non-code pages (i.e. Pulls, Issues) to code page
    // GitHub doesn't reload the page but uses pjax. Need to detect and load Octotree.
    var href, hash
    function detectLocationChange() {
      if (location.href !== href || location.hash != hash) {
        href = location.href
        hash = location.hash
        loadRepo()
      }
      setTimeout(detectLocationChange, 200)
    }
    detectLocationChange()
  })

  function loadRepo(reload) {
    var repo = getRepoFromPath()
      , repoChanged = JSON.stringify(repo) !== JSON.stringify(currentRepo)

    if (repo) {
      $toggleBtn.show()
      if (repoChanged || reload) {
        currentRepo = repo
        fetchData(repo, function(err, tree) {
          if (err) return onFetchError(err)
          renderTree(repo, tree, selectTreeNode)
        })
      } else selectTreeNode()
    } else {
      toggleSidebar(false)
      $toggleBtn.hide()
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
    if ($('#parallax_wrapper').length) return false

    // (username)/(reponame)[/(subpart)]
    var match = location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/)
    if (!match) return false
     
    // Not a repository, skip
    if (~RESERVED_USER_NAMES.indexOf(match[1])) return false
    if (~RESERVED_REPO_NAMES.indexOf(match[2])) return false

    // Not a code page, skip
    if (match[3] && !~['tree', 'blob'].indexOf(match[3])) return false

    var branch = $('*[data-master-branch]').data('ref') || 
                 $('*[data-master-branch] > .js-select-button').text() || 
                 'master'
    return { 
      username : match[1], 
      reponame : match[2],
      branch   : branch
    }
  }

  function fetchData(repo, done) {
    var github  = new Github({ token: store.get(TOKEN) })
      , api     = github.getRepo(repo.username, repo.reponame)
      , root    = []
      , folders = { '': root }

    api.getTree(encodeURIComponent(repo.branch) + '?recursive=true', function(err, tree) {
      if (err) return done(err)
      tree.forEach(function(item) {
        var path   = item.path
          , type   = item.type
          , index  = path.lastIndexOf('/')
          , name   = path.substring(index + 1)
          , folder = folders[path.substring(0, index)]
          , url    = '/' + repo.username + '/' + repo.reponame + '/' + type + '/' + repo.branch + '/' + path

        folder.push(item)
        item.id   = PREFIX + path
        item.text = $dummyDiv.text(name).html() // sanitizes, close #9
        item.icon = type // use `type` as class name for tree node
        if (type === 'tree') {
          folders[item.path] = item.children = []
          item.a_attr = { href: '#' }
        }
        else if (type === 'blob') {
          item.a_attr = { href: url }
        }
      })

      done(null, sort(root))

      function sort(folder) {
        folder.sort(function(a, b) {
          if (a.type === b.type) return a.text.localeCompare(b.text)
          return a.type === 'tree' ? -1 : 1
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
      , hasToken = !!store.get(TOKEN)
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
        if ($target.is('a.jstree-anchor') && $target.children(':first').hasClass('blob')) {
          $.pjax({ 
            url       : $target.attr('href'), 
            timeout   : 5000, // gives it more time, should really have a progress indicator...
            container : $('#js-repo-pjax-container') 
          })
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
      var token = store.get(TOKEN)
      $optsFrm.find('.message').html(message)
      $optsFrm.show()
      $treeView.hide()
      if (token) $optsFrm.find('[name="token"]').val(token)
    } else {
      $optsFrm.hide()
      $treeView.show()
    }

    // Shows sidebar automatically only the first time in this site, close #32
    if (!store.get(SHOWN)) {
      toggleSidebar(true)
      store.set(SHOWN, true) 
    }
  }

  function saveToken(event) {
    event.preventDefault()

    var $error = $optsFrm.find('.error').text('')
      , token  = $optsFrm.find('[name="token"]').val()

    if (!token) return $error.text('Token is required')

    store.set(TOKEN, token)
    loadRepo(true)
  }

  function toggleSidebar(visibility) {
    if (typeof visibility !== 'undefined') {
      if ($html.hasClass(PREFIX) === visibility) return
      toggleSidebar()
    } 
    else {
      $html.toggleClass(PREFIX)
      $sidebar.show().css('left', $html.hasClass(PREFIX) ? 0 : -$sidebar.width())
      sidebarResized()
    }
  }

  function sidebarResized() {
    var width = $sidebar.width()
      , shown = $html.hasClass(PREFIX)

    $html.css('margin-left', shown ? width - 10 : 0)
    $toggleBtn.css('left', shown ? width - 35 : 5)
    store.set(WIDTH, width)
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