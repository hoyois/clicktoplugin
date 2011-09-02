var killer = {};
addKiller("Flash", killer);

killer.canKill = function(data) {
	if(data.plugin !== "Flash") return false;
	var match = /(?:^|&)(file|load|playlistfile|src|mp3|mp3url|soundFile|soundUrl|url|file_url)=/.exec(data.params.flashvars);
	if(match) {data.file = match[1]; return true;}
	// other video flashvars: wmvUrl/flvUrl (gvideoplayer.swf)
	match = /[?&](file|mp3|playlist_url)=/.exec(data.src);
	if(match) {data.hash = match[1]; return true;}
	return false;
};

killer.process = function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	if(/^rmtp/.test(flashvars.streamer)) return;
	
	// get media and poster URL
	var sourceURL, posterURL;
	if(data.file) {
		sourceURL = decodeURIComponent(flashvars[data.file].replace(/\+/g, "%20"));
		switch(data.file) {
		case "file_url":
			if(flashvars.poster_url) posterURL = decodeURIComponent(flashvars.poster_url);
			break;
		default:
			if(flashvars.image) posterURL = decodeURIComponent(flashvars.image);
		}
	} else {
		sourceURL = data.src.match(new RegExp("[?&]" + data.hash + "=([^&]*)"));
		if(sourceURL) {
			sourceURL = decodeURIComponent(sourceURL[1]);
			posterURL = data.src.match(/[?&]image=([^&]*)/);
			if(posterURL) posterURL = decodeURIComponent(posterURL[1]);
		}
	}
	
	// YouTube redirection
	// In JW player, flashvars.provider === "youtube"
	if(/^http:\/\/(?:www.)?youtube.com\/watch/.test(sourceURL)) {
		var match = sourceURL.match(/[?&]v=([^&]*)/);
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
	
	if(!sourceURL) return;
	var isPlaylist = data.file === "playlistfile" || data.hash === "playlist_url" || hasExt("xml|xspf", sourceURL);
	
	var baseURL = data.src; // used to resolve video URLs
	if(flashvars.netstreambasepath) baseURL = decodeURIComponent(flashvars.netstreambasepath);
	
	// Playlist support
	if(isPlaylist) {
		this.processPlaylist(makeAbsoluteURL(sourceURL, data.baseURL), baseURL, posterURL, flashvars.item, callback);
		return;
	}
	
	var sourceURL2 = flashvars.real_file;
	if(sourceURL2) sourceURL = decodeURIComponent(sourceURL2);
	sourceURL2 = flashvars["hd.file"];
	
	var sources = [];
	var isAudio = true;
	var ext;
	if(sourceURL2) {
		ext = extInfo(sourceURL2);
		if(ext) {
			sources.push({"url": makeAbsoluteURL(sourceURL2, baseURL), "format": "HD", "isNative": ext.isNative, "height": 720, "mediaType": ext.mediaType});
			if(ext.mediaType === "video") isAudio = false;
		}
	}
	
	ext = extInfo(sourceURL);
	if(ext) {
		sources.push({"url": makeAbsoluteURL(sourceURL, baseURL), "format": sources[0] ? "SD" : "", "isNative": ext.isNative, "mediaType": ext.mediaType});
		if(ext.mediaType === "video") isAudio = false;
	}
	
	callback({
		"playlist": [{"poster": posterURL, "sources": sources}],
		"isAudio": isAudio
	});
};

killer.processPlaylist = function(playlistURL, baseURL, posterURL, track, callback) {
	var handlePlaylistData = function(playlistData) {
		callback(playlistData);
	};
	parseXSPlaylist(playlistURL, baseURL, posterURL, track, handlePlaylistData);
};

