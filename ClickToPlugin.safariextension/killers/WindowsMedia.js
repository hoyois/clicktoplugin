var killer = new Object();
addKiller("WindowsMedia", killer);

killer.canKill = function(data) {
	return data.plugin === "Windows Media" && canPlayWM;
};

killer.process = function(data, callback) {
	var ext = extInfo(data.src);
	if(!ext) return;
	var sources = [{"url": data.src, "isNative": false, "mediaType": ext.mediaType}];
	
	var mediaData = {
		"playlist": [{"sources": sources}],
		"isAudio": ext.mediaType === "audio"
	};
	callback(mediaData);
};