var killer = {};
addKiller("Tumblr", killer);

killer.canKill = function(data) {
	if(data.plugin !== "Flash") return false;
	return /\?audio_file=/.test(data.src);
};

killer.process = function(data, callback) {
	var audioURL = data.src.match(/\?audio_file=([^&]*)/);
	if(audioURL) audioURL = audioURL[1] + "?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio"; // lol
	
	callback({
		"playlist": [{"sources": [{"url": audioURL, "isNative": true, "mediaType": "audio"}]}],
		"isAudio": true
	});
};

