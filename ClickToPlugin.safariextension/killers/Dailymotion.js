addKiller("Dailymotion", {

"canKill": function(data) {
	return (data.src.indexOf("/dmplayerv4/") !== -1 || data.src.indexOf("www.dailymotion.com") !== -1);
},

"process": function(data, callback) {
	if(/^http:\/\/www\.dailymotion\.com\/hub\//.test(data.location)) {
		var match = data.location.match(/#videoId=(.*)/);
		if(match) this.processVideoID(match[1], callback);
	} else if(data.params.flashvars) {
		var sequence = parseFlashVariables(data.params.flashvars).sequence;
		if(sequence) this.processSequence(decodeURIComponent(sequence), callback);
	} else {
		var match = data.src.match(/\/swf\/([^&]+)/);
		if(match) this.processVideoID(match[1], callback);
	}
},

"processSequence": function(sequence, callback) {
	// NOTE: sequence.replace(/\\'/g, "'") is JSON but it's so messy that regexp search is easier
	var posterURL, match;
	var sources = [];
	
	// hd720URL (720p)
	match = sequence.match(/\"hd720URL\":\"([^"]*)\"/);
	if(match) {
		sources.push({"url": match[1].replace(/\\\//g,"/"), "format": "720p MP4", "height": 720, "isNative": true});
	}
	// hqURL
	match = sequence.match(/\"hqURL\":\"([^"]*)\"/);
	if(match) {
		sources.push({"url": match[1].replace(/\\\//g,"/"), "format": "SD MP4", "height": 360, "isNative": true});
	}
	// sdURL
	match = sequence.match(/\"sdURL\":\"([^"]*)\"/);
	if(match) {
		sources.push({"url": match[1].replace(/\\\//g,"/"), "format": "LD MP4", "height": 240, "isNative": true});
	}
	
	match = sequence.match(/\"videoPreviewURL\":\"([^"]*)\"/);
	if(match) posterURL = match[1].replace(/\\\//g,"/");
	
	var title;
	match = sequence.match(/\"videoTitle\":\"((?:\\"|[^"])*)\"/);
	if(match) title = unescape(match[1].replace(/\+/g, " ").replace(/\\u/g, "%u").replace(/\\["'\/\\]/g, function(s){return s.charAt(1);}));
	
	callback({"playlist": [{"title": title, "poster": posterURL, "sources": sources}]});
},

"processVideoID": function(videoID, callback) {
	var sequenceMatch = /addVariable\(\"sequence\",\s*\"([^"]*)\"/;
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://www.dailymotion.com/video/" + videoID, true);
	xhr.onload = function() {
		var match = xhr.responseText.match(sequenceMatch);
		if(match) {
			var callbackForEmbed = function(videoData) {
				videoData.playlist[0].siteInfo = {"name": "Dailymotion", "url": "http://www.dailymotion.com/video/" + videoID};
				callback(videoData);
			}
			_this.processSequence(decodeURIComponent(match[1]), callbackForEmbed);
		}
	};
	xhr.send(null);
}

});
