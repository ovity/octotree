(function() {
  const PREFIX = 'octotree'
      , TOKEN  = 'octotree.github_access_token'
      , SHOWN  = 'octotree.shown'
      // ugly, I know, can it be improved?
      , REGEXP = /([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/
      
  var $html    = $('html')
    , $sidebar = $('<nav class="octotree_sidebar"><div class="inner">' +
                     '<h1>loading...</h1>' +
                     '<div class="tree"></div>' +
                   '</div></nav>')
    , $tree    = $sidebar.find('.tree')
    , $token   = $('<form>' +
                     '<div>' +
                       '<input name="token" type="text" placeholder="Enter personal access token"></input>' +
                     '</div>' +
                     '<div>' +
                       '<button type="submit">Save</button>' +
                       '<a href="https://github.com/settings/tokens/new" target="_blank">Create token</a> | ' +
                       '<a href="https://github.com/buunguyen/octotree#github-api-rate-limit" target="_blank">Help</a>' +
                     '</div>' +
                     '<div class="error"></div>' +
                   '</form>')
    , $toggler = $('<div class="octotree_toggle">&#9776;</div>')
    , store    = new Storage()

  $(document).ready(function() {
    loadRepo(true)
  })

  function loadRepo(initDom) {
    var repo = getRepoFromPath()
    if (repo) {
      if (initDom) {
        $('body')
          .append($sidebar)
          .append($toggler.click(toggleSidebar))
      }
      fetchData(repo, function(err, tree) {
        if (err) return onFetchError(err)
        renderTree(repo, tree)
      })
    }
  }

  function getRepoFromPath() {
    var match = location.pathname.match(REGEXP)
    if (!match) return false

    // must not be a reserved `username`
    if (~['settings', 'organizations', 'site'].indexOf(match[1])) return false

    // TODO: the intention is to hide the sidebar when users navigate to non-code areas (e.g. Issues, Pulls)
    // and show it again when users navigate back to the code area
    // the first part is achieved with the next two lines; but need to implement the second part
    // before activating the entire feature, PR is welcome
    // if match[3] exists, it must be either 'tree' or 'blob'
    // if (match[3] && !~['tree', 'blob'].indexOf(match[3])) return false

    return { 
      username : match[1], 
      reponame : match[2],
      branch   : $('*[data-master-branch]').data('ref') || 'master'
    }
  }

  function fetchData(repo, done) {
    var github  = new Github({ token: store.get(TOKEN) })
      , api     = github.getRepo(repo.username, repo.reponame)
      , root    = []
      , folders = { '': root }

    api.getTree(repo.branch + '?recursive=true', function(err, tree) {
      if (err) return done(err)
      tree.forEach(function(item) {
        var path   = item.path
          , index  = path.lastIndexOf('/')
          , name   = path.substring(index + 1)
          , folder = folders[path.substring(0, index)]
          , url    = '/' + repo.username + '/' + repo.reponame + '/' + item.type + '/' + repo.branch + '/' + path

        folder.push(item)
        item.text   = name
        item.icon   = item.type
        if (item.type === 'tree') {
          folders[item.path] = item.children = []
          item.a_attr = { href: '#' }
        }
        else if (item.type === 'blob') {
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
    var msg = 'Error: ' + err.error
    if (err.error === 401) msg = 'Invalid token!'
    else if (err.error === 404) msg = 'Private or invalid repository!'
    else if (err.error === 403 && ~err.request.getAllResponseHeaders().indexOf('X-RateLimit-Remaining: 0')) 
      msg = 'API limit exceeded!'
    updateSidebar(msg, true)
  }

  function renderTree(repo, tree) {
    $tree
      .empty()
      .jstree({
        core    : { data: tree, animation: 100 },
        plugins : ['wholerow', 'state'],
        state   : { key : PREFIX + '.' + repo.username + '/' + repo.reponame }
      })
      .delegate('.jstree-open>a', 'click.jstree', function() {
        $.jstree.reference(this).close_node(this)
      })
      .delegate('.jstree-closed>a', 'click.jstree', function() {
        $.jstree.reference(this).open_node(this)
      })
      .on('click', function(e) {
        var $target = $(e.target)
        if ($target.is('a.jstree-anchor') && $target.children(':first').hasClass('blob')) {
          $.pjax({ 
            url: $target.attr('href'), 
            container: $('#js-repo-pjax-container') 
          })
        }
      })
      .on('ready.jstree', function() {
        updateSidebar(repo.username + ' / ' + repo.reponame + ' [' + repo.branch + ']')  
      })
  }

  function updateSidebar(header, askForToken) {
    $sidebar.find('h1').text(header)

    if (askForToken) {
      $tree.empty().append($token.submit(saveToken))
    }

    // Shows sidebar when:
    // 1. ask for access token
    // 2. first time extension is used
    // 3. if it was previously shown
    if (askForToken || store.get(SHOWN) !== false) {
      $html.addClass(PREFIX)
      store.set(SHOWN, true)
    }
  }

  function toggleSidebar() {
    var shown = store.get(SHOWN)
    if (shown) $html.removeClass(PREFIX)
    else $html.addClass(PREFIX)
    store.set(SHOWN, !shown)
  } 

  function saveToken(event) {
    event.preventDefault()

    var token = $token.find('[name="token"]').val()
      , $error = $token.find('div.error').text('')

    if (token === '') {
      return $error.text('Token is required')
    }
    store.set(TOKEN, token)
    loadRepo()
  }   

  function Storage() {
    this.get = function(key) {
      return JSON.parse(localStorage.getItem(key))
    }
    this.set = function(key, val) {
      return localStorage.setItem(key, JSON.stringify(val))
    }
    this.del = function(key) {
      return localStorage.removeItem(key)
    }
  }
})()