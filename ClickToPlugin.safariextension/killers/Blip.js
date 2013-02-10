addKiller("Blip", {

"canKill": function(data) {
	return data.src.indexOf("blip.tv/") !== -1;
},

"process": function(data, callback) {
	if(/^https?:\/\/blip\.tv\/players\/xplayer/.test(data.location)) {
		var videoID = parseFlashVariables(data.location.split(/\?/)[1]).id;
		var url = "http://blip.tv/rss/flash/" + videoID;
		this.processXML(url, false, callback);
	} else if(/stratos\.swf/.test(data.src)) {
		var match = /[?&#]file=([^&]*)/.exec(data.src);
		if(!match) return;
		url = match[1];
		this.processXML(decodeURIComponent(url), !/^http:\/\/blip\.tv/.test(data.location), callback);
	} else {
		var match = /blip\.tv\/play\/([^%]*)/.exec(data.src);
		if(match) this.processOldVideoID(match[1], callback);
	}
},

"processXML": function(url, isEmbed, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.addEventListener("load", function() {
		var xml = xhr.responseXML;
		var media = xml.getElementsByTagNameNS("http://search.yahoo.com/mrss/", "content");
		var sources = [];
		var url, info, height, audioOnly = true;
		
		for(var i = 0; i < media.length; i++) {
			url = media[i].getAttribute("url");
			info = urlInfo(url);
			if(!info) continue;
			if(!info.isAudio) audioOnly = false;
			height = media[i].getAttribute("height");
			info.url = url;
			info.format = media[i].getAttributeNS("http://blip.tv/dtd/blip/1.0", "role") + " " + info.format;
			info.height = parseInt(height);
			sources.push(info);
		}
		
		var siteInfo;
		if(isEmbed) {
			var itemId = xml.getElementsByTagNameNS("http://blip.tv/dtd/blip/1.0", "item_id")[0];
			if(itemId) siteInfo = {"name": "Blip.tv", "url": "http://www.blip.tv/file/" + itemId.textContent};
		}
		
		callback({
			"playlist": [{
				"title": xml.getElementsByTagName("item")[0].getElementsByTagName("title")[0].textContent,
				"poster": xml.getElementsByTagNameNS("http://search.yahoo.com/mrss/", "thumbnail")[0].getAttribute("url"),
				"sources": sources,
				"siteInfo": siteInfo
			}],
			"audioOnly": audioOnly
		});
	}, false);
	xhr.send(null);
},

"processOldVideoID": function(videoID, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://blip.tv/players/episode/" + videoID + "?skin=api", true);
	var _this = this;
	xhr.addEventListener("load", function() {
		_this.processXML("http://blip.tv/rss/flash/" + xhr.responseXML.getElementsByTagName("id")[0].textContent, true, callback);
	}, false);
	xhr.send(null);
}

});
