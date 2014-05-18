(function() {
  const PREFIX = 'octotree'
      , TOKEN  = 'octotree.github_access_token'
      , SHOWN  = 'octotree.shown'
      , RESERVED_USER_NAMES = [
          'settings', 'orgs', 'organizations',
          'site', 'blog', 'about',
          'styleguide', 'showcases', 'trending',
          'stars', 'dashboard', 'notifications'
        ]
      , RESERVED_REPO_NAMES = ['followers', 'following']

  var $html    = $('html')
    , $sidebar = $('<nav class="octotree_sidebar">' +
                     '<div class="octotree_header">loading...</div>' +
                     '<div class="octotree_treeview"></div>' +
                   '</nav>')
    , $treeView = $sidebar.find('.octotree_treeview')
    , $tokenFrm = $('<form>' +
                     '<div class="message"></div>' +
                     '<div>' +
                       '<input name="token" type="text" placeholder="Paste access token here"></input>' +
                     '</div>' +
                     '<div>' +
                       '<button type="submit" class="button">Save</button>' +
                       '<a href="https://github.com/buunguyen/octotree#github-api-rate-limit" target="_blank">Why need access token?</a>' +
                     '</div>' +
                     '<div class="error"></div>' +
                   '</form>')
    , $toggleBtn = $('<a class="octotree_toggle button"><span></span></a>')
    , $dummyDiv  = $('<div/>')
    , store      = new Storage()
    , domInitialized = false
    , currentRepo    = false
    , baseUrl = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/'

  $(document).ready(function() {
    loadRepo()

    // When navigating from non-code pages (i.e. Pulls, Issues) to code page
    // GitHub doesn't reload the page but uses pjax. Need to detect and load Octotree.
    var href = location.href
      , hash = location.hash
    function detectLocationChange() {
      if (location.href !== href || location.hash != hash) {
        href = location.href
        hash = location.hash
        loadRepo()
      }
      window.setTimeout(detectLocationChange, 200)
    }
    detectLocationChange()
  })

  function loadRepo(reload) {
    var repo = getRepoFromPath()
      , repoChanged = JSON.stringify(repo) !== JSON.stringify(currentRepo)

    if (repo && (repoChanged || reload)) {
      initializeDom()
      currentRepo = repo
      fetchData(repo, function(err, tree) {
        if (err) return onFetchError(err)
        renderTree(repo, tree, selectTreeNode)

      })
    } else if (domInitialized) selectTreeNode()
  }

  function selectTreeNode() {      
    var tree = $.jstree.reference($treeView)
      , path = location.pathname

    tree.deselect_all()

    // e.g. converts /buunguyen/octotree/type/branch/path to path
    var match = path.match(/(?:[^\/]+\/){4}(.*)/)
    if (match) tree.select_node(PREFIX + decodeURIComponent(match[1]))
  }

  function initializeDom() {
    if (!domInitialized) {
      $('body')
        .append($sidebar)
        .append($toggleBtn.click(toggleSidebar))

      key('⌘+b, ctrl+b', toggleSidebar)
      domInitialized = true
    }
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
      fetchSubmoduleData(api, repo, tree, function(submods){
        tree.forEach(function(item) {
          var path   = item.path
            , type   = item.type
            , index  = path.lastIndexOf('/')
            , name   = path.substring(index + 1)
            , folder = folders[path.substring(0, index)]
            , url    = '/' + repo.username + '/' + repo.reponame + '/' + type + '/' + repo.branch + '/' + path

          folder.push(item)
        item.id   = PREFIX + path
          item.text = sanitize(name)
          item.icon = type // use `type` as class name for tree node
          if (type === 'tree') {
            folders[item.path] = item.children = []
            item.a_attr = { href: '#' }
          }
          else if (type === 'blob') {
            item.a_attr = { href: url }
          }
          else if (type === 'commit'){
            if(submods){
              submod = submods[item.path]
              item.a_attr = { href: baseUrl + submod.owner + '/' + submod.repo }
              // TODO: link to commit sha also
              item.a2_attr = { href: item.a_attr.href + '/tree/' + item.sha }
            }
          }
        })
        done(null, sort(root))
      })
      function sort(folder) {
        folder.sort(function(a, b) {
          //github treats submodules like folders
          var compare = ((a.type === 'tree' || a.type === 'commit') &&
                          (b.type === 'tree' || b.type === 'commit'))

          if (a.type === b.type || compare) return a.text.localeCompare(b.text)
          return a.type === 'tree' ? -1 : 1
        })
        folder.forEach(function(item) {
          if (item.type === 'tree') sort(item.children)
        })
        return folder
      }
    })
  }

  function fetchSubmoduleData(api, repo, tree, cb){
    var submodules = []
        , item = null
    //fetch submodule from .gitmodules file
    //use tree to find sha
    item = _.find(tree, function(file) { return /\.gitmodules/i.test(file.path) })
    if(item){
      api.getBlob(item.sha, function (err, content, sha){
        if(err) cb(null)
        if(content){
          lines = content.match(/[^\r\n]+/g)
          // each submodule is defined on 3 lines, group them for easier iterating
          grouped = groupBy(lines, 3)
          _.each(grouped, function(submodule) {
            path = submodule[1].match(/=\s([\w\d\/]+)/i)[1] // = (path)
            repoParts = submodule[2].match(/([\w]+)\/([\w]+).git$/i) // (owner)/(repo).git$
            owner = repoParts[1]
            repo = repoParts[2]
            submodules[path]= {
              owner: owner,
              repo: repo
            }
          })
          cb(submodules)
        }
      })
    }
    else
    {
      cb(null)
    }
  }

  function groupBy(data, n){
    return _.groupBy(data, function(element, index){
      return Math.floor(index/n);
    });
  }

  function onFetchError(err) {
    var header = 'Error: ' + err.error
      , hasToken = !!store.get(TOKEN)
      , message

    if (err.error === 401) {
      header  = 'Invalid token!'
      message = 'The token is invalid. Follow <a href="https://github.com/settings/tokens/new" target="_blank">this link</a> to create a new token and paste it in the textbox below.'
    }

    else if (err.error === 404) {
      header = 'Private or invalid repository!'
      if (hasToken) message = 'You are not allowed to access this repository.'
      else          message = 'Accessing private repositories requires a GitHub access token. Follow <a href="https://github.com/settings/tokens/new" target="_blank">this link</a> to create one and paste it in the textbox below.'
    }

    else if (err.error === 403 && ~err.request.getAllResponseHeaders().indexOf('X-RateLimit-Remaining: 0')) {
      header = 'API limit exceeded!'
      if (hasToken) message = 'Whoa, you have exceeded the API hourly limit, please create a new access token or take a break :).'
      else          message = 'You have exceeded the GitHub API hourly limit and need GitHub access token to make extra requests. Follow <a href="https://github.com/settings/tokens/new" target="_blank">this link</a> to create one and paste it in the textbox below.'
    }

    else if (err.error === 409) {
      header  = 'Empty repository!'
      message = 'This repository is empty.'
    }

    updateSidebar('<div class="octotree_header_error">' + header + '</div>', message)
  }

  function renderTree(repo, tree, cb) {
    $treeView
      .empty()
      .jstree({
        core    : { data: tree, animation: 100, themes : { responsive : false } },
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
            timeout   : 5000, //gives it more time, should really have a progress indicator...
            container : $('#js-repo-pjax-container')
          })
        }
        else if ($target.is('a.jstree-anchor') && $target.children(':first').hasClass('commit')) {
          //link to submodule new page
          window.location.href = $target.attr('href');
        }
      })
      .on('ready.jstree', function() {
        var headerText = '<div class="octotree_header_repo">' +
                           repo.username + ' / ' + repo.reponame +
                         '</div>' +
                         '<div class="octotree_header_branch">' +
                           repo.branch +
                         '</div>'
        updateSidebar(headerText)
        cb()
      })
  }

  function updateSidebar(header, message) {
    $sidebar.find('.octotree_header').html(header)

    if (message) {
      var token = store.get(TOKEN)
      if (token) $tokenFrm.find('[name="token"]').val(token)
      $tokenFrm.find('.message').html(message)
      $treeView.empty().append($tokenFrm.submit(saveToken))
    }

    // Shows sidebar when:
    // 1. First time after extension is installed
    // 2. If it was previously shown (TODO: many seem not to like it)
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

    var token  = $tokenFrm.find('[name="token"]').val()
      , $error = $tokenFrm.find('.error').text('')

    if (!token) return $error.text('Token is required')

    store.set(TOKEN, token)
    loadRepo(true)
  }

  function sanitize(str) {
    return $dummyDiv.text(str).html()
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
