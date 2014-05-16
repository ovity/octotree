(function() {
  const PREFIX = 'octotree'
      , TOKEN  = 'octotree.github_access_token'
      , SHOWN  = 'octotree.shown'
      , REGEXP = /([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/ // (username)/(reponame)/(subpart)
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
    , isGitLab       = false
    , isGitHub       = false

  $(document).ready(function() {
    if($(".navbar-gitlab").length > 0)
      isGitLab = true;
    else if(location.host == "github.com")
      isGitHub = true;
    else // none of the above
      return false;

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

    Mousetrap.bind('ctrl+b', toggleSidebar)
  })

  function loadRepo(reload) {

    var repo = getRepoFromPath()
      , repoChanged = JSON.stringify(repo) !== JSON.stringify(currentRepo)

    if (repo && (repoChanged || reload || isGitLab) ) {
      currentRepo = repo
      
      if(isGitLab)
      {
          domInitialized = false;
      }
      if (!domInitialized) {
        $(".octotree_sidebar").remove();
        
        $('body')
          .append($sidebar)
          .append($toggleBtn.click(toggleSidebar))

        $treeView = $sidebar.find('.octotree_treeview')
        domInitialized = true
      }

      fetchData(repo, function(err, tree) {
        if (err) return onFetchError(err)
        renderTree(repo, tree)
      })
    }
    return true;
  }

  function getRepoFromPath() {
    if(isGitHub)
    {
      // 404 page, skip
      if ($('#parallax_wrapper').length) return false

      var match = location.pathname.match(REGEXP)
      if (!match) return false
       
      // Not a repository, skip
      if (~RESERVED_USER_NAMES.indexOf(match[1])) return false
      if (~RESERVED_REPO_NAMES.indexOf(match[2])) return false

      // Not a code page, skip
      if (match[3] && !~['tree', 'blob'].indexOf(match[3])) return false

      return { 
        username : match[1], 
        reponame : match[2],
        branch   : $('*[data-master-branch]').data('ref') || 'master'
      }
    }
    else
    {
      var match = location.pathname.match(REGEXP)
      if (!match) return false
       
      // Not a repository, skip
      if (~RESERVED_USER_NAMES.indexOf(match[1])) return false
      if (~RESERVED_REPO_NAMES.indexOf(match[2])) return false

      // Not a code page, skip
      if (match[3] && !~['tree', 'blob'].indexOf(match[3])) return false

      return { 
        username : match[1], 
        reponame : match[2],
        branch   : $('*[data-master-branch]').data('ref') || 'master'
      }
    }
  }

  function fetchData(repo, done) {
    if(isGitHub)
    {
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
          item.text = sanitize(name)
          item.icon = type // use `type` as class name for tree node
          if (type === 'tree') {
            folders[item.path] = item.children = []
            item.a_attr = { href: '#' }
          }
          else if (type === 'blob') {
            item.a_attr = { href: url }
          }
          // TOOD: handle submodule, anyone?
        })

        done(null, sort(root))

      })
    }
    else if(isGitLab)
    {
      var oldTreeName = store.get("git_lab_repo_hash");
      var oldTree = store.get("git_lab_repo");
      var oldTreeCommit = store.get("git_lab_repo_commit");
      var $lastCommit = $(".last-commit");

      if(oldTree && oldTreeName == repo.username + "/" + repo.reponame)
      {
        if($lastCommit.length == 0 || ($lastCommit.length > 0 && $lastCommit.find("a").text == oldTreeCommit))
        {
          done(null, sort(JSON.parse(oldTree)))
        }
        else
        {
          getLiveDataFromGitLab();
        }
      }
      else
      {
        getLiveDataFromGitLab();
      }
    }
    function getLiveDataFromGitLab()
    {
      var gitlab  = new GitLab({
          "base_url" : location.href.match(/(https?).+/)[1] + "://" + location.host,
          "user" : repo.username,
          "repo" : repo.reponame, 
          "private_token" : store.get(location.host+"_token")
        });
        gitlab.getTree(function(err, data){
          if(err) return onFetchError(err);

          store.set("git_lab_repo_hash",repo.username + "/" + repo.reponame);
          store.set("git_lab_repo",JSON.stringify(data));
          store.set("git_lab_repo_commit", $(".last-commit").find("a").text());
          done(null, sort(data))  
        });
    }
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
  }

  function onFetchError(err) {
    var header = 'Error: ' + err.error
      , hasToken = !!store.get(TOKEN)
      , message


    if(err.error == "401" && isGitLab)
    {
      header  = 'Invalid token!'
      message = 'The token is invalid. Follow <a href="http://git.mready.net/profile/account" target="_blank">this link</a> to create a new token and paste it in the textbox below.'
    }
    else if (err.error === 401 && isGitHub) {
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

    updateSidebar('<div class="octotree_header_error">' + header + '</div>', message)
  }

  function renderTree(repo, tree) {
    $treeView
      .empty()
      .jstree({
        core    : { data: tree, animation: 100, themes : { responsive : false } },
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
        var $target = $(e.target);
        if ($target.is('a.jstree-anchor') && $target.children(':first').hasClass('blob')) {
          if(isGitHub)
          {
            $.pjax({ 
              url       : $target.attr('href'), 
              timeout   : 5000, //gives it more time, should really have a progress indicator...
              container : $('#js-repo-pjax-container') 
            })
          }
          else if (isGitLab)
          {

               $.pjax({ 
                url       : "/" + $target.attr('href'), 
                timeout   : 5000, //gives it more time, should really have a progress indicator...
                container : $('.container') 
              })
          }
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
      })
  }

  function updateSidebar(header, message) {
    $sidebar.find('.octotree_header').html(header)

    if (message) {
      if(isGitHub)
      {
        var token = store.get(TOKEN)
        if (token) $tokenFrm.find('[name="token"]').val(token)
        $tokenFrm.find('.message').html(message)
        $treeView.empty().append($tokenFrm.submit(saveToken))
      }
      else if(isGitLab)
      {
        var token = store.get(location.host + "_token");
        if (token) $tokenFrm.find('[name="token"]').val(token)
        $tokenFrm.find('.message').html(message)
        $treeView.empty().append($tokenFrm.submit(saveToken)) 
      }
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

    if(isGitHub)
    {
      store.set(TOKEN, token)
    }
    else if(isGitLab)
    {
      store.set(location.host + "_token", token) 
    }
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