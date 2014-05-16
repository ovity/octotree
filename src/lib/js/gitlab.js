// Gitlab.js 0.1
// (c) 2014 Andrei Vaduva, mReady
// Gitlab.js is freely distributable under the MIT license.
var GitLab = function(options) {
	options = options || { "private_token" : "DcaynZ1yymKSTpqwix4y" };
	var remainingRequests = 0;
	var _data = [];
	var _request = function($path, dataArray, cb){
		remainingRequests++;

		$path = $path || "/";
		$.ajax({
			url: "http://git.mready.net/api/v3/projects/mready%2Fandroid-autoro-dev/repository/tree?private_token=" + options.private_token + "&path=" + $path,
			success: function(data){
				for(var i in data)
				{		
					var tmp = {
						"a_attr": {
							"href" : (data[i].type == "tree" ? "#" : "mready/android-autoro-dev/blob/master/" + $path + data[i].name)
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
					cb(_data);
			}
		});
	};
	return {
		getTree : function(callback){
			_request("/", undefined, callback);
		}
	}
};