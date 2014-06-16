// Gitlab.js 0.1
// (c) 2014 Andrei Vaduva, mReady
// adapter.gitlab.js is freely distributable under the MIT license.
function GitLab() {}
var store     = new Storage();

/**
 * Returns if you should reinject the sidebar
 */

GitLab.prototype.requiresReinject = function() {
  return true;
}

/**
 * Updates page layout based on visibility status and width of the Octotree sidebar.
 */
GitLab.prototype.updateLayout = function(sidebarVisible, sidebarWidth) {
  var $containers = $(GH_CONTAINERS)
    , autoMarginLeft
    , shouldPushLeft

  if ($containers.length === 4) {
    autoMarginLeft = ($('body').width() - $containers.width()) / 2
    shouldPushLeft = sidebarVisible && (autoMarginLeft <= sidebarWidth + SIDEBAR_SPACE)
    $containers.css('margin-left', shouldPushLeft
      ? sidebarWidth + SIDEBAR_SPACE
      : autoMarginLeft)
  }

  // falls-back if GitHub DOM has been updated
  else $('html').css('margin-left', sidebarVisible ? sidebarWidth - SIDEBAR_SPACE : 0)
}

/**
 * Returns the repository information if user is at a repository URL. Returns `null` otherwise.
 */
GitLab.prototype.getRepoFromPath = function() {
	// (username)/(reponame)[/(subpart)]
	var match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/]+))?/)
	if (!match) return false

	var branch = match[4] || 'master';
	
	return { 
		username : match[1], 
		reponame : match[2],
		branch   : branch
	}
}

GitLab.prototype.selectSubmodule = function(path) {
  window.location.href = "/" + path;
}

GitLab.prototype.selectPath = function(path) {
  window.location.href = "/" + path;
}

/**
 * Fetches data of a particular repository, and caches it for further use.
 * @param opts: { repo: repository, token (optional): user access token, apiUrl (optional): base API URL }
 * @param cb(err: error, tree: array (of arrays) of items)
 */
GitLab.prototype.fetchData = function(opts, cb) {
	var remainingRequests = 0;
	var _data = [];
	var options = {
		"base_url" : location.href.match(/(https?).+/)[1] + "://" + location.host,
		"user" : opts.repo.username,
		"repo" : opts.repo.reponame, 
		"private_token" : opts.token
	};
	var oldTreeName = store.get("git_lab_repo_hash");
	var oldTree = store.get("git_lab_repo");
	var oldTreeCommit = store.get("git_lab_repo_commit");
	var $lastCommit = $(".last-commit");

	if(oldTree && oldTreeName == opts.repo.username + "/" + opts.repo.reponame)
	{
		if($lastCommit.length == 0 || ($lastCommit.length > 0 && $lastCommit.find("a").text == oldTreeCommit))
		{
			cb(null, JSON.parse(oldTree))
		}
		else
		{
			getLiveData();
		}
	}
	else
	{
		getLiveData();
	}
	
	$lastCommit.length == 0 || ($lastCommit.length > 0 && $lastCommit.find("a").text() == oldTreeCommit)
	function getLiveData(){
		getTree(function(err, data){
	      if(err) return onApiError(err);

	      store.set("git_lab_repo_hash",opts.repo.username + "/" + opts.repo.reponame);
	      store.set("git_lab_repo",JSON.stringify(data));
	      store.set("git_lab_repo_commit", $(".last-commit").find("a").text());
	      cb(null, data)  
	    });
	}

    function getTree(cb) {
    	_request("/", undefined, cb);
	}

	function _request($path, dataArray, cb){
		remainingRequests++;

		$path = $path || "/";
		$.ajax({
			url: options.base_url + "/api/v3/projects/"+options.user+"%2F"+options.repo+"/repository/tree?private_token=" + options.private_token + "&path=" + $path,
			success: function(data){
				for(var i in data)
				{		
					var tmp = {
						// "id" : PREFIX + $path, // not yet working, dunno why
						"a_attr": {
							"href" : (data[i].type == "tree" ? "#" : options.user + "/"+options.repo+"/blob/master/" + $path + data[i].name)
						},
						"icon": data[i].type,
						"mode": data[i].mode,
						"path": $path + data[i].name,
						"sha": data[i].id,
						"text": data[i].name,
						"type": data[i].type,
						"url": ""
					};

					if(dataArray)
						dataArray.push(tmp);
					else
						_data.push(tmp)
					
					if(data[i].type == "tree")
					{
						tmp['children'] = [];
						if($path == "/")
							$path = "";

						_request($path + data[i].name + "/", tmp['children'], cb);
					}
				}
				remainingRequests--;
				if(remainingRequests == 0)
					cb(null, _data);
			},
			error: function(xhr, status)
			{
				cb({"error" : 401}, null);
			}
		});
	}

	function onApiError(err)
	{
		var error
          , message
          , needAuth;
		switch(err.error)
		{
			case 0:
	            error = 'Connection error'
	            message = 'Cannot connect to GitHub. If your network connection to GitHub is fine, maybe there is an outage of the GitHub API. Please try again later.'
	            needAuth = false
	            break
	          case 401:
	            error = 'Invalid token'
	            message = 'The token is invalid. Follow <a href="'+location.origin+'/profile/account" target="_blank">this link</a> to create a new token and paste it below.'
	            needAuth = true
	            break
	    }
	    cb({
          error    : 'Error: ' + error,
          message  : message,
          needAuth : needAuth
        })
	}
}