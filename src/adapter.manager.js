var AdapterManager = (function() {
	function isGitHub(){
		return location.host == "github.com";
	}
	function isGitLab(){
		return $(".navbar-gitlab").length > 0;
	}
	return {
		getAdapter: function(){
			if(isGitHub())
			{
				return new GitHub();
			}
			if(isGitLab())
			{
				return new GitLab();
			}

			return undefined;
		}
	}
})();