addKiller("Dailymotion", {

"canKill": function(data) {
	return (data.src.indexOf("/dmplayerv4/") !== -1 || data.src.indexOf("www.dailymotion.com") !== -1);
},

"process": function(data, callback) {
	if(/^http:\/\/www\.dailymotion\.com\/hub\//.test(data.location)) {
		var match = /#videoId=(.*)/.exec(data.location);
		if(match) this.processVideoID(match[1], callback);
	} else {
		if(data.params.flashvars) {
			var sequence = parseFlashVariables(data.params.flashvars).sequence;
			if(sequence) {
				this.processSequence(decodeURIComponent(sequence), callback);
				return;
			}
		}
		var match = /\/swf\/([^&]+)/.exec(data.src);
		if(match) this.processVideoID(match[1], callback);
	}
},

"processSequence": function(sequence, callback) {
	// NOTE: sequence.replace(/\\'/g, "'") is JSON but regexp search is more efficient
	var match, posterURL, title;
	var sources = [];
	
	// hd720URL
	match = /\"hd720URL\":\"([^"]*)\"/.exec(sequence);
	if(match) sources.push({"url": match[1].replace(/\\\//g,"/"), "format": "720p MP4", "height": 720, "isNative": true});
	// hqURL
	match = /\"hqURL\":\"([^"]*)\"/.exec(sequence);
	if(match) sources.push({"url": match[1].replace(/\\\//g,"/"), "format": "SD MP4", "height": 360, "isNative": true});
	// sdURL
	match = /\"sdURL\":\"([^"]*)\"/.exec(sequence);
	if(match) sources.push({"url": match[1].replace(/\\\//g,"/"), "format": "LD MP4", "height": 240, "isNative": true});
	
	match = /\"videoPreviewURL\":\"([^"]*)\"/.exec(sequence);
	if(match) posterURL = match[1].replace(/\\\//g,"/");
	
	match = /\"videoTitle\":\"((?:\\"|[^"])*)\"/.exec(sequence);
	if(match) title = unescape(match[1].replace(/\+/g, " ").replace(/\\u/g, "%u").replace(/\\["'\/\\]/g, function(s){return s.charAt(1);})); // sic
	
	callback({"playlist": [{"title": title, "poster": posterURL, "sources": sources}]});
},

"processVideoID": function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://www.dailymotion.com/video/" + videoID, true);
	xhr.addEventListener("load", function() {
		var match = /addVariable\(\"sequence\",\s*\"([^"]*)\"/.exec(xhr.responseText);
		if(match) {
			var callbackForEmbed = function(videoData) {
				videoData.playlist[0].siteInfo = {"name": "Dailymotion", "url": "http://www.dailymotion.com/video/" + videoID};
				callback(videoData);
			}
			_this.processSequence(decodeURIComponent(match[1]), callbackForEmbed);
		}
	}, false);
	xhr.send(null);
}

});
