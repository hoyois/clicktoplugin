addKiller("Facebook", {

"canKill": function(data) {
	return /^https?:\/\/(?:s-static\.ak\.facebook\.com|b\.static\.ak\.fbcdn\.net|static\.ak\.fbcdn\.net)\/rsrc\.php\/v[1-9]\/[a-zA-Z0-9]{2}\/r\/[a-zA-Z0-9_-]*\.swf/.test(data.src) || data.src.indexOf("www.facebook.com/v/") !== -1;
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
	var isHD = flashvars.video_has_high_def === "1";
	if(flashvars.highqual_src) {
		sources.push({"url": decodeURIComponent(flashvars.highqual_src), "format": isHD ? "720p MP4" : "HQ MP4", "height": isHD ? 720 : 600, "isNative": true});
		if(flashvars.lowqual_src) sources.push({"url": decodeURIComponent(flashvars.lowqual_src), "format": "240p MP4", "height": 240, "isNative": true});
	} else if(flashvars.video_src) {
		sources.push({"url": decodeURIComponent(flashvars.video_src), "format": "240p MP4", "height": 240, "isNative": true});
	} else return;
	
	var posterURL, title;
	if(flashvars.thumb_url) posterURL = decodeURIComponent(flashvars.thumb_url);
	if(flashvars.video_title) title = decodeURIComponent(flashvars.video_title.replace(/\+/g, " "));
	
	callback({"playlist": [{"title": title, "poster": posterURL, "sources": sources}]});
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
