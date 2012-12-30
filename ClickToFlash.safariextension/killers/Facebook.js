addKiller("Facebook", {

"canKill": function(data) {
	return /^https?:\/\/fbstatic-a\.akamaihd\.net\/rsrc\.php\/v[1-9]\/[a-zA-Z0-9]{2}\/r\/[a-zA-Z0-9_-]*\.swf/.test(data.src) || data.src.indexOf("www.facebook.com/v/") !== -1;
},

"process": function(data, callback) {
	if(data.params.flashvars) {
		var flashvars = parseFlashVariables(data.params.flashvars);
		if(flashvars.video_href && flashvars.video_id) this.processVideoID(flashvars.video_id, callback);
		else this.processFlashVars(flashvars, callback);
		return;
	}
	// Embedded video
	var match = /\.com\/v\/([^&?]+)/.exec(data.src);
	if(match) this.processVideoID(match[1], callback);
},

"processFlashVars": function(flashvars, callback) {
	var sources = [];
	var video = JSON.parse(decodeURIComponent(flashvars.video));
	if(video.hd_src) sources.push({"url": video.hd_src.replace(/\\\//g,"/"), "format": "HD MP4", "height": 720, "isNative": true});
	if(video.sd_src) sources.push({"url": video.sd_src.replace(/\\\//g,"/"), "format": "SD MP4", "height": 240, "isNative": true});
	else return;
	
	var posterURL;
	if(flashvars.thumbnail_src) posterURL = decodeURIComponent(flashvars.thumbnail_src);
	
	callback({"playlist": [{"poster": posterURL, "sources": sources}]});
},

"processVideoID": function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	var url = "https://www.facebook.com/video/video.php?v=" + videoID;
	xhr.open("GET", url, true);
	xhr.addEventListener("load", function() {
		var callbackForEmbed = function(videoData) {
			videoData.playlist[0].siteInfo = {"name": "Facebook", "url": url};
			callback(videoData);
		};
		var s = xhr.responseText.substring(xhr.responseText.indexOf(".forEach"))
		s = s.substring(s.indexOf("swf.addVariable"));
		var regex = new RegExp("\\[\"([a-z_]*)\",\"([^\"]*)\"][,\\]]", "g");
		_this.processFlashVars(parseWithRegExp(s, regex, unescapeUnicode), callbackForEmbed);
	}, false);
	xhr.send(null);
}

});
