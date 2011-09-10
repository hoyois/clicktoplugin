addKiller("Tumblr", {

"canKill": function(data) {
	return /\?audio_file=/.test(data.src);
},

"process": function(data, callback) {
	var audioURL = data.src.match(/\?audio_file=([^&]*)/);
	if(audioURL) audioURL = audioURL[1] + "?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio"; // lol
	
	callback({
		"playlist": [{"sources": [{"url": audioURL, "isNative": true, "isAudio": true}]}],
		"isAudio": true
	});
}

});
