addKiller("Facebook", {

"canKill": function(data) {
	return data.src.indexOf("www.facebook.com/v/") !== -1 || /^https?:\/\/(?:fbstatic-a\.akamaihd\.net|static\.ak\.fbcdn\.net|s-static\.ak\.facebook\.com|b\.static\.ak\.fbcdn\.net)\/rsrc\.php\/v[1-9]\/[a-zA-Z0-9_-]{2}\/r\/[a-zA-Z0-9_-]*\.swf/.test(data.src);
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	if(flashvars.params) {
		this.processParams(flashvars.params, callback);
	} else { // Embedded video
		var match = /facebook\.com\/v\/([^&?]+)/.exec(data.src);
		if(!match) match = /\.swf.*[?&]v=([^&]*)/.exec(data.src);
		if(match) this.processVideoID(match[1], callback);
	}
},

"processParams": function(params, callback) {
	var sources = [];
	var video = JSON.parse(decodeURIComponent(params));
	if(video.hd_src) sources.push({"url": video.hd_src.replace(/\\\//g,"/"), "format": "HD MP4", "height": 720, "isNative": true});
	if(video.sd_src) sources.push({"url": video.sd_src.replace(/\\\//g,"/"), "format": "SD MP4", "height": 240, "isNative": true});
	if(sources.length === 0) return;
	
	var posterURL;
	if(video.thumbnail_src) posterURL = video.thumbnail_src.replace(/\\\//g,"/");
	
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
		var match = /\[\"params\",\s*\"([^"]*)\"\]/.exec(xhr.responseText);
		if(match) _this.processParams(match[1].replace(/\\u0025/g, "%"), callbackForEmbed);
	}, false);
	xhr.send(null);
}

});
