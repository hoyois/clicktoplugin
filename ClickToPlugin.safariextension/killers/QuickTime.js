var killer = {};
addKiller("QuickTime", killer);

killer.canKill = function(data) {
	// streaming is not yet supported by HTML5 video in Safari
	return data.plugin === "QuickTime" && data.src.substring(0,4) === "http" && (!data.params.href || data.params.href.slice(0,4) === "http");
};


killer.process = function(data, callback) {
	var isAudio = true;
	var playlist = [];
	var addTrack = function(url) {
		var ext = extInfo(url);
		if(!ext) return;
		var source = {"url": url, "isNative": ext.isNative, "mediaType": ext.mediaType};
		if(ext.mediaType === "video") isAudio = false;
		playlist.push({"sources": [source]});
	};
	addTrack(data.src);
	if(data.params.href) addTrack(data.params.href);
	
	callback({
		"noPlaylistControls": true,
		"playlist": playlist,
		"isAudio": isAudio
	});
};