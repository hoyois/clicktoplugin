addKiller("Break", {

"canKill": function(data) {
	if(/s\.brkmd\.com\/content\/swf\/|media1\.break\.com\/break\/swf\//.test(data.src)) return true;
	return false;
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	if(flashvars.videoPath) this.processFlashVars(flashvars, callback);
},

"processFlashVars": function(flashvars, callback) {
	var videoURL = decodeURIComponent(flashvars.videoPath).replace(/\.flv$|\.mp4$/, "");
	var videoHash = ".mp4?" + flashvars.icon;
	
	var sources = [];
	var call = function() {
		callback({"playlist": [{
			"title": unescape(flashvars.sVidTitle),
			"poster": decodeURIComponent(flashvars.sThumbLoc),
			"sources": sources
		}]});
	};
	
	sources.push({"url": videoURL + videoHash, "format": "360p MP4", "height": 360, "isNative": true});
	
	var hqURL = videoURL.replace(/-360$/, "-480") + videoHash;
	getMIMEType(hqURL, function(type) {
		if(type === "video/mp4") {
			sources.unshift({"url": hqURL, "format": "480p MP4", "height": 480, "isNative": true});
			var hdURL = videoURL.replace(/-360$/, "-720") + videoHash;
			getMIMEType(hdURL, function(type) {
				if(type === "video/mp4") sources.unshift({"url": hdURL, "format": "720p MP4", "height": 720, "isNative": true});
				call();
			});
		} else call();
	});
}

});
