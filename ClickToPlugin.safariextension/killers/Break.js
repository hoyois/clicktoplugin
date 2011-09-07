addKiller("Break", {

"canKill": function(data) {
	if(data.src.indexOf(".break.com/static/") !== -1) {data.onsite = true; return true;}
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
		// only works with the newer [0-9] IDs...
		var match = data.src.match(/embed\.break\.com\/([^?]+)/);
		if(match) url = "http://view.break.com/" + match[1];
		else return;
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function() {
		var sources = [];
		if(!videoHash) {
			match = xhr.responseText.match(/sGlobalToken=['"]([^'"]*)['"]/);
			if(!match) return;
			videoHash = match[1];
		}
		var match = xhr.responseText.match(/sGlobalFileNameHDD=['"]([^'"]*)['"]/);
		if(match) {
			sources.push({"url": match[1].replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "720p MP4", "height": 720, "isNative": true, "mediaType": "video"});
		}
		match = xhr.responseText.match(/sGlobalFileNameHD=['"]([^'"]*)['"]/);
		if(match) {
			sources.push({"url": match[1].replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "480p MP4", "height": 480, "isNative": true, "mediaType": "video"});
		}
		match = xhr.responseText.match(/sGlobalFileName=['"]([^'"]*)['"]/);
		if(match) {
			sources.push({"url": match[1].replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "360p MP4", "height": 360, "isNative": true, "mediaType": "video"});
		}
		if(sources.length === 0) {
			if(videoURL) sources.push({"url": videoURL.replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "360p MP4", "height": 360, "isNative": true, "mediaType": "video"});
			else return;
		}
		
		var title, siteInfo;
		if(!posterURL) {
			match = xhr.responseText.match(/sGlobalThumbnailURL=['"]([^'"]*)['"]/);
			if(match) posterURL = match[1];
		}
		match = xhr.responseText.match(/!!!&amp;body=(.*?)%0d/);
		if(match) title = decodeURIComponent(match[1]);
		if(!data.onsite || data.location === "http://www.break.com/") siteInfo = {"name": "Break", "url": url};
		
		callback({"playlist": [{"title": title, "poster": posterURL, "sources": sources, "siteInfo": siteInfo}]});
	};
	xhr.send(null);
}

});
