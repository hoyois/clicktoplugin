addKiller("Break", {

"canKill": function(data) {
	if(/\.break\.com\/(?:static|break)\//.test(data.src)) {data.onsite = true; return true;}
	if(data.src.indexOf("embed.break.com/") !== -1) {data.onsite = false; return true;}
	return false;
},

"process": function(data, callback) {
	if(data.onsite) {
		var flashvars = parseFlashVariables(data.params.flashvars);
		if(flashvars.videoPath) this.processFlashVars(flashvars, callback);
		else if(flashvars.iContentID) this.processVideoID(flashvars.iContentID, callback);
	} else {
		var match = /embed\.break\.com\/(\d+)/.exec(data.src);
		if(match) this.processVideoID(match[1], callback);
	}
},

"processFlashVars": function(flashvars, callback) {
	var videoURL = flashvars.videoPath.replace(/\.flv$|\.mp4$/, "");
	var videoHash = ".mp4?" + flashvars.icon;
	
	var sources = [];
	var call = function() {
		callback({"playlist": [{
			"title": flashvars.sVidTitle,
			"poster": flashvars.thumbnailURL,
			"sources": sources
		}]});
	};
	
	sources.push({"url": videoURL + videoHash, "format": "360p MP4", "height": 360, "isNative": true});
	
	if(flashvars.callForInfo === "true") {
		sources.unshift({"url": videoURL.replace(/_1$/, "_2") + videoHash, "format": "480p MP4", "height": 480, "isNative": true});
		var hdURL = videoURL.replace(/_1$/, "_3") + videoHash;
		getMIMEType(hdURL, function(type) {
			if(type === "video/mp4") sources.unshift({"url": hdURL, "format": "720p MP4", "height": 720, "isNative": true});
			call();
		});
	} else call();
},

"processVideoID": function(videoID, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://view.break.com/" + videoID, true);
	var _this = this;
	xhr.addEventListener("load", function() {
		var match = /var flashVars = \{([^}]*)\};/.exec(xhr.responseText);
		if(match) {
			var flashvars = parseWithRegExp(match[1], /[,\s]*(\w*):\s*["']?([^'",\n]*).*/g);
			_this.processFlashVars(flashvars, callback);
		}
	}, false);
	xhr.send(null);
}

});
