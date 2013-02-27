addKiller("Tumblr", {

"canKill": function(data) {
	return /\?audio_file=/.test(data.src);
},

"process": function(data, callback) {
	var audioURL = /\?audio_file=([^&]*)/.exec(data.src);
	if(audioURL) audioURL = decodeURIComponent(audioURL[1]) + "?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio";
	
	callback({
		"playlist": [{"sources": [{"url": audioURL, "isNative": true, "isAudio": true}]}],
		"audioOnly": true
	});
}

});
