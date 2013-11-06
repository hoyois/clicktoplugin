addKiller("Flash", {

"canKill": function(data) {
	if(data.type !== "application/x-shockwave-flash") return false;
	var match = /(?:^|&)(real_file|file|filename|load|playlistfile|src|source|video|mp3|mp3url|soundFile|soundUrl|url|content|mediaUrl|file_url|sampleURL|wmvUrl|flvUrl)=/.exec(data.params.flashvars);
	if(match) {data.file = match[1]; return true;}
	match = /[?&](file|mp3|playlist_url)=/.exec(data.src);
	if(match) {data.hash = match[1]; return true;}
	return false;
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	
	if(flashvars.config) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", makeAbsoluteURL(decodeURIComponent(flashvars.config), data.baseURL), true);
		var _this = this;
		xhr.addEventListener("load", function() {
			var config = xhr.responseXML.getElementsByTagName("config")[0];
			var node;
			for(var i = 0; i < config.childNodes.length; i++) {
				node = config.childNodes[i];
				flashvars[node.nodeName] = node.textContent;
			}
			_this.processFlashVars(data, flashvars, callback);
		}, false);
		xhr.send(null);
	} else this.processFlashVars(data, flashvars, callback);
},

"processFlashVars": function(data, flashvars, callback) {
	if(/^rtmp/.test(flashvars.streamer)) return;
	
	// Get media and poster URL
	var sourceURL, posterURL;
	if(data.file) {
		sourceURL = decodeURIComponent(flashvars[data.file].replace(/\+/g, " "));
		posterURL = decodeURIComponent(flashvars.image || flashvars.preloadImage || flashvars.poster_url || flashvars.icon || flashvars.thumb || flashvars.sScreenshotUrl || "");
	} else {
		sourceURL = new RegExp("[?&]" + data.hash + "=([^&]*)").exec(data.src);
		if(sourceURL) {
			sourceURL = decodeURIComponent(sourceURL[1]);
			posterURL = /[?&]image=([^&]*)/.exec(data.src);
			if(posterURL) posterURL = decodeURIComponent(posterURL[1]);
		}
	}
	
	if(/^[a-z]+:\/\//.test(sourceURL) && !/^http/.test(sourceURL)) return;
	
	// YouTube redirection
	// (sometimes with flashvars.provider === "youtube")
	if(/^http:\/\/(?:www.)?youtube.com/.test(sourceURL)) {
		var match = /[?&\/]v[=\/]([^?&\/]*)/.exec(sourceURL);
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
	if(/^https?:\/\/www\.tvn24\.pl/.test(data.location)) sourceURL = sourceURL.replace(".flv", ".mp4");
	
	if(!sourceURL) return;
	var ext = getExt(sourceURL);
	var isPlaylist = data.file === "playlistfile" || data.hash === "playlist_url" || ext === "xml" || ext === "xspf";
	
	var baseURL = data.src; // used to resolve video URLs
	if(flashvars.netstreambasepath) baseURL = decodeURIComponent(flashvars.netstreambasepath);
	
	if(isPlaylist) {
		parseXSPlaylist(makeAbsoluteURL(sourceURL, data.baseURL), baseURL, posterURL, flashvars.item, callback);
		return;
	}
	
	sourceURL = makeAbsoluteURL(sourceURL, baseURL);
	
	var sources = [];
	var audioOnly = true;
	var call = function(info) {
		if(info) {
			info.url = sourceURL;
			sources.push(info);
			if(!info.isAudio) audioOnly = false;
		}
		if(sources.length !== 0 || posterURL !== undefined) callback({
			"playlist": [{"poster": posterURL, "sources": sources}],
			"audioOnly": audioOnly
		});
	};
	
	if(flashvars["hd.file"]) {
		var hdURL = decodeURIComponent(flashvars["hd.file"]);
		var info = extInfo(getExt(hdURL));
		if(info) {
			info.url = makeAbsoluteURL(hdURL, baseURL);
			info.format = "HD " + info.format;
			info.height = 720;
			sources.push(info);
			audioOnly = false;
		}
	}
	
	if(ext === "php" || !ext) {
		getMIMEType(sourceURL, function(type) {
			call(typeInfo(type));
		});
	} else call(extInfo(ext));
}

});
