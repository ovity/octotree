(function() {
  const PREFIX = 'octotree'
      , TOKEN  = 'octotree.github_access_token'
      , SHOWN  = 'octotree.shown'
      // ugly, I know, can it be improved?
      , REGEXP = /([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/
      
  var $html    = $('html')
    , $sidebar = $('<nav class="octotree_sidebar">' +
                     '<h1>loading...</h1>' +
                     '<div class="tree"></div>' +
                   '</nav>')
    , $tree    = $sidebar.find('.tree')
    , $token   = $('<form>' +
                     '<div class="message"></div>' +
                     '<div>' +
                       '<input name="token" type="text" placeholder="Paste access token here"></input>' +
                     '</div>' +
                     '<div>' +
                       '<button type="submit">Save</button>' +
                       '<a href="https://github.com/buunguyen/octotree#github-api-rate-limit" target="_blank">Why need access token?</a>' +
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
    var RESERVED_USERNAMES = [
      'settings',
      'organizations',
      'site',
      'blog',
      'about',
      'orgs',
      'styleguide',
      'showcases',
      'trending',
      'stars',
      'dashboard',
      'notifications'
    ];
    var RESERVED_REPONAMES = ['followers', 'following'];
     
    if (~RESERVED_USERNAMES.indexOf(match[1])) return false
    if (~RESERVED_REPONAMES.indexOf(match[2])) return false

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

    api.getTree(encodeURIComponent(repo.branch) + '?recursive=true', function(err, tree) {
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
    var header = 'Error: ' + err.error
      , hasToken = !!store.get(TOKEN)
      , message

    if (err.error === 401) {
      header = 'Invalid token!'
      message = 'The provided token is invalid. Please enter another one.'
    }

    else if (err.error === 404) {
      header = 'Private or invalid repository!'
      if (hasToken) message = 'You are not allowed to access this repository.'
      else message = 'Accessing private repositories requires a GitHub access token. Follow <a href="https://github.com/settings/tokens/new" target="_blank">this link</a> to create one and paste it in the textbox below.'
    }

    else if (err.error === 403 && ~err.request.getAllResponseHeaders().indexOf('X-RateLimit-Remaining: 0')) {
      header = 'API limit exceeded!'
      if (hasToken) message = 'Whoa, you have exceeded the API hourly limit, please create a new access token or take a break :).'
      else message = 'You have exceeded the GitHub API hourly limit and need GitHub access token to make extra requests. Follow <a href="https://github.com/settings/tokens/new" target="_blank">this link</a> to create one and paste it in the textbox below.'
    }

    updateSidebar(header, message)
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

  function updateSidebar(header, errorMessage) {
    $sidebar.find('h1').text(header)

    if (errorMessage) {
      var token = store.get(TOKEN)
      if (token) $token.find('[name="token"]').val(token)
      $token.find('.message').html(errorMessage)
      $tree.empty().append($token.submit(saveToken))
    }

    // Shows sidebar when:
    // 1. first time extension is used
    // 2. if it was previously shown
    if (store.get(SHOWN) !== false) {
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
      , $error = $token.find('.error').text('')

    if (token === '') {
      return $error.text('Token is required')
    }
    store.set(TOKEN, token)
    loadRepo()
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
