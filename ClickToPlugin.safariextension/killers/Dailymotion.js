addKiller("Dailymotion", {

"canKill": function(data) {
	return /dmcdn\.net\/playerv5\/|www\.dailymotion\.com/.test(data.src);
},

"process": function(data, callback) {
	var config = parseFlashVariables(data.params.flashvars).config;
	if(config) this.processConfig(decodeURIComponent(config), !/^https?:\/\/www\.dailymotion\.com\/video/.test(data.location), callback);
	else {
		var match = /\/swf\/(?:video\/)?([^&?#]+)/.exec(data.src);
		if(match) this.processVideoID(match[1], callback);
	}
},

"processConfig": function(config, isEmbed, callback) {
	var metadata = JSON.parse(config).metadata;
	
	var siteInfo;
	if(isEmbed) siteInfo = {"name": "Dailymotion", "url": "http://www.dailymotion.com/video/" + metadata.id};
	
	var sources = [];
	for(var res in metadata.qualities) {
		if(!/\d+/.test(res)) continue;
		sources.unshift({"url": metadata.qualities[res][0].url, "format": res + "p MP4", "height": res === "380" ? 360 : parseInt(res), "isNative": true});
	}
	if(sources.length === 0) return;
	
	callback({"playlist": [{
		"title": metadata.title,
		"poster": metadata.poster_url,
		"sources": sources,
		"siteInfo": siteInfo
	}]});
},

"processVideoID": function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://www.dailymotion.com/embed/video/" + videoID, true);
	xhr.addEventListener("load", function() {
		var match = /\bdmp\.create\(document\.getElementById\('player'\), (\{.*\})\);\n/.exec(xhr.responseText);
		if(match) _this.processConfig(match[1], true, callback);
	}, false);
	xhr.send(null);
}

});
