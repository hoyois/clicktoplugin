addKiller("Break", {

"canKill": function(data) {
	if(/\.break\.com\/(?:static|break)\//.test(data.src)) {data.onsite = true; return true;}
	if(data.src.indexOf("embed.break.com/") !== -1) {data.onsite = false; return true;}
	return false;
},

"process": function(data, callback) {
	var videoURL, posterURL, videoHash, url;
	if(data.onsite) {
		var flashvars = parseFlashVariables(data.params.flashvars);
		videoURL = flashvars.videoPath;//??
		posterURL = flashvars.thumbnailURL;
		videoHash = flashvars.icon;
		url = flashvars.sLink;
		if(!url) {
			var videoID = flashvars.iContentID;
			if(videoID) url = "http://view.break.com/" + videoID;
			else return;
		}
	} else {
		var match = /embed\.break\.com\/([^?]+)/.exec(data.src);
		if(match) url = "http://view.break.com/" + match[1];
		else return;
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function() {
		var sources = [];
		if(!videoHash) {
			match = /sGlobalToken=['"]([^'"]*)['"]/.exec(xhr.responseText);
			if(!match) return;
			videoHash = match[1];
		}
		var match = /sGlobalFileNameHDD=['"]([^'"]*)['"]/.exec(xhr.responseText);
		if(match) {
			sources.push({"url": match[1].replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "720p MP4", "height": 720, "isNative": true});
		}
		match = /sGlobalFileNameHD=['"]([^'"]*)['"]/.exec(xhr.responseText);
		if(match) {
			sources.push({"url": match[1].replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "480p MP4", "height": 480, "isNative": true});
		}
		match = /sGlobalFileName=['"]([^'"]*)['"]/.exec(xhr.responseText);
		if(match) {
			sources.push({"url": match[1].replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "360p MP4", "height": 360, "isNative": true});
		}
		if(sources.length === 0) {
			if(videoURL) sources.push({"url": videoURL.replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "360p MP4", "height": 360, "isNative": true});
			else return;
		}
		
		var title, siteInfo;
		if(!posterURL) {
			match = /sGlobalThumbnailURL=['"]([^'"]*)['"]/.exec(xhr.responseText);
			if(match) posterURL = match[1];
		}
		
		match = /id=\"vid_title\" content=\"([^"]*)\"/.exec(xhr.responseText);
		if(match) title = unescapeHTML(match[1]);
		if(!data.onsite || data.location === "http://www.break.com/") siteInfo = {"name": "Break", "url": url};
		
		callback({"playlist": [{
			"title": title,
			"poster": posterURL,
			"sources": sources,
			"siteInfo": siteInfo
		}]});
	};
	xhr.send(null);
}

});
