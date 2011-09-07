addKiller("Blip", {

"canKill": function(data) {
	return data.src.indexOf("blip.tv/") !== -1;
},

"process": function(data, callback) {
	if(/stratos.swf/.test(data.src)) {
		var url = parseFlashVariables(data.params.flashvars).file;
		if(!url) {
			var match = data.src.match(/[?&]file=([^&]*)/);
			if(!match) return;
			url = match[1]; // should have siteInfo...
		}
		this.processXML(decodeURIComponent(url), callback);
	} else {
		var match = data.src.match(/blip\.tv\/play\/([^%]*)/);
		if(match) this.processOldVideoID(match[1], callback);
	}
},

"processXML": function(url, callback) {
	var sources = [];
	
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onload = function() {
		var xml = xhr.responseXML;
		var media = xml.getElementsByTagNameNS("http://search.yahoo.com/mrss/", "content");
		
		var url, ext, format, height, width, isNative, mediaType;
		for(var i = 0; i < media.length; i++) {
			mediaType = "video";
			url = media[i].getAttribute("url");
			ext = url.substr(url.lastIndexOf(".") + 1).toUpperCase();
			if(ext === "MP4" || ext === "M4V" || ext === "MOV" || ext === "MPG" || ext === "MPEG") isNative = true;
			else if(ext === "MP3") {isNative = true; mediaType = "audio";}
			else if((ext === "FLV" && canPlayFLV) || (ext === "WMV" && canPlayWM)) isNative = false;
			else continue;
			
			format = media[i].getAttributeNS("http://blip.tv/dtd/blip/1.0", "role");
			height = media[i].getAttribute("height");
			width = media[i].getAttribute("width");
			if(mediaType === "video") format += " (" + width + "x" + height + ")";
			format += " " + ext;
			sources.push({"url": url, "format": format, "isNative": isNative, "mediaType": mediaType, "height": parseInt(height)});
		}
		callback({
			"playlist": [{
				"title": xml.getElementsByTagName("item")[0].getElementsByTagName("title")[0].textContent,
				"poster": xml.getElementsByTagNameNS("http://search.yahoo.com/mrss/", "thumbnail")[0].getAttribute("url"),
				"sources": sources
			}]
		});
	};
	xhr.send(null);
},

"processOldVideoID": function(videoID, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', "http://blip.tv/players/episode/" + videoID + "?skin=api", true);
	var _this = this;
	xhr.onload = function() {
		var xml = xhr.responseXML;
		var callbackForEmbed = function(videoData) {
			videoData.playlist[0].siteInfo = {"name": "Blip.tv", "url": "http://www.blip.tv/file/" + xml.getElementsByTagName("item_id")[0].textContent};
			callback(videoData);
		};
		_this.processXML("http://blip.tv/rss/flash/" + xml.getElementsByTagName("id")[0].textContent, callbackForEmbed);
	};
	xhr.send(null);
}

});
