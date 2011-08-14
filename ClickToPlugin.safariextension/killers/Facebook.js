var killer = new Object();
addKiller("Facebook", killer);

killer.canKill = function(data) {
	if(data.plugin !== "Flash") return false;
	return /^https?:\/\/(?:s-static\.ak\.facebook\.com|b\.static\.ak\.fbcdn\.net|static\.ak\.fbcdn\.net)\/rsrc\.php\/v[1-9]\/[a-zA-Z0-9]{2}\/r\/[a-zA-Z0-9_-]*\.swf/.test(data.src) || data.src.indexOf("www.facebook.com/v/") !== -1;
};

killer.process = function(data, callback) {
	if(data.params) {
		var flashvars = parseFlashVariables(data.params);
		if(flashvars.video_href && flashvars.video_id) this.processVideoID(flashvars.video_id, callback);
		else this.processFlashVars(flashvars, callback);
		return;
	}
	// Embedded video
	var match = data.src.match(/\.com\/v\/([^&?]+)/);
	if(match) this.processVideoID(match[1], callback);
};

killer.processFlashVars = function(flashvars, callback) {
	var sources = new Array();
	var isHD = flashvars.video_has_high_def === "1";
	if(flashvars.highqual_src) {
		sources.push({"url": decodeURIComponent(flashvars.highqual_src), "format": isHD ? "720p MP4" : "HQ MP4", "height": isHD ? 720 : 600, "isNative": true, "mediaType": "video"});
		if(flashvars.lowqual_src) sources.push({"url": decodeURIComponent(flashvars.lowqual_src), "format": "240p MP4", "height": 240, "isNative": true, "mediaType": "video"});
	} else if(flashvars.video_src) {
		sources.push({"url": decodeURIComponent(flashvars.video_src), "format": "240p MP4", "height": 240, "isNative": true, "mediaType": "video"});
	} else return;
	
	var posterURL, title;
	if(flashvars.thumb_url) posterURL = decodeURIComponent(flashvars.thumb_url);
	if(flashvars.video_title) title = decodeURIComponent(flashvars.video_title).replace(/\+/g, " ");
	var videoData = {
		"playlist": [{"title": title, "poster": posterURL, "sources": sources}]
	};
	callback(videoData);
};

killer.processVideoID = function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	var url = "https://www.facebook.com/video/video.php?v=" + videoID;
	xhr.open("GET", url, true);
	xhr.onload = function() {
		var callbackForEmbed = function(videoData) {
			videoData.playlist[0].siteInfo = {"name": "Facebook", "url": url};
			callback(videoData);
		};
		var regex = new RegExp("addVariable\\(\"([a-z_]*)\", \"([^\"]*)\"\\);", "g");
		_this.processFlashVars(parseWithRegExp(xhr.responseText, regex, unescapeUnicode), callbackForEmbed);
	};
	xhr.send(null);
};

