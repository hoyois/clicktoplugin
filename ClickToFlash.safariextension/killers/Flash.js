addKiller("Flash", {

"canKill": function(data) {
	if(data.type !== "application/x-shockwave-flash") return false;
	var match = /(?:^|&)(file|load|playlistfile|src|source|video|mp3|mp3url|soundFile|soundUrl|url|file_url|sampleURL|wmvUrl|flvUrl)=/.exec(data.params.flashvars);
	if(match) {data.file = match[1]; return true;}
	match = /[?&](file|mp3|playlist_url)=/.exec(data.src);
	if(match) {data.hash = match[1]; return true;}
	return false;
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	if(/^rtmp/.test(flashvars.streamer)) return;
	
	// Get media and poster URL
	var sourceURL, posterURL;
	if(data.file) {
		sourceURL = decodeURIComponent(flashvars[data.file].replace(/\+/g, " "));
		switch(data.file) {
		case "file_url":
			if(flashvars.poster_url) posterURL = decodeURIComponent(flashvars.poster_url);
			break;
		case "wmvUrl":
		case "flvUrl":
			if(flashvars.sScreenshotUrl) posterURL = decodeURIComponent(flashvars.sScreenshotUrl);
			break;
		default:
			if(flashvars.image) posterURL = decodeURIComponent(flashvars.image);
			else if(flashvars.preloadImage) posterURL = decodeURIComponent(flashvars.preloadImage);
		}
	} else {
		sourceURL = new RegExp("[?&]" + data.hash + "=([^&]*)").exec(data.src);
		if(sourceURL) {
			sourceURL = decodeURIComponent(sourceURL[1]);
			posterURL = /[?&]image=([^&]*)/.exec(data.src);
			if(posterURL) posterURL = decodeURIComponent(posterURL[1]);
		}
	}
	
	// YouTube redirection
	// (sometimes with flashvars.provider === "youtube")
	if(/^http:\/\/(?:www.)?youtube.com/.test(sourceURL)) {
		match = /[?&\/]v[=\/]([^?&\/]*)/.exec(sourceURL);
		if(match) {
			if(!hasKiller("YouTube")) return;
			var YTcallback = callback;
			if(posterURL) YTcallback = function(mediaData) {
				mediaData.playlist[0].poster = posterURL;
				callback(mediaData);
			};
			getKiller("YouTube").processVideoID(match[1], YTcallback);
			return;
		}
	}
	
	// Site-specific hacks
	if(/^http:\/\/www\.tvn24\.pl/.test(data.location)) sourceURL = sourceURL.replace(".flv", ".mp4");
	
	if(!sourceURL) return;
	var ext = extractExt(sourceURL);
	var isPlaylist = data.file === "playlistfile" || data.hash === "playlist_url" || ext === "xml" || ext === "xspf";
	
	var baseURL = data.src; // used to resolve video URLs
	if(flashvars.netstreambasepath) baseURL = decodeURIComponent(flashvars.netstreambasepath);
	
	if(isPlaylist) {
		parseXSPlaylist(makeAbsoluteURL(sourceURL, data.baseURL), baseURL, posterURL, flashvars.item, callback);
		return;
	}
	
	if(flashvars.real_file) sourceURL = decodeURIComponent(flashvars.real_file);
	
	var sources = [];
	var audioOnly = true;
	var info;
	
	if(flashvars["hd.file"]) {
		var hdURL = decodeURIComponent(flashvars["hd.file"]);
		info = urlInfo(hdURL);
		if(info) {
			info.url = makeAbsoluteURL(hdURL, baseURL);
			info.format = "HD " + info.format;
			info.height = 720;
			sources.push(info);
			audioOnly = false;
		}
	}
	
	info = urlInfo(sourceURL);
	if(info) {
		info.url = makeAbsoluteURL(sourceURL, baseURL);
		sources.push(info);
		if(!info.isAudio) audioOnly = false;
	}
	
	if(sources.length !== 0 || posterURL !== undefined) callback({
		"playlist": [{"poster": posterURL, "sources": sources}],
		"audioOnly": audioOnly
	});
}

});
