addKiller("TED", {

"canKill": function(data) {
	return data.src.indexOf("http://video.ted.com/assets/player/swf") !== -1;
},

"process": function(data, callback) {
	var url, siteInfo;
	if(/^http:\/\/www\.ted\.com\/talks/.test(data.location)) {
		url = data.location;
	} else {
		var match = /adKeys=talk=([^;]*);/.exec(data.params.flashvars);
		if(match) {
			url = "http://www.ted.com/talks/" + match[1] + ".html";
			siteInfo = {"name": "TED", "url": url};
		} else return;
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onload = function() {
		// response is XML as "text/html"
		var xml = new DOMParser().parseFromString(xhr.responseText, "text/xml");
		
		var sources = [];
		var downloads = xml.getElementsByClassName("downloads");
		var anchor = downloads[1].getElementsByTagName("a")[2];
		if(anchor) sources.push({"url": anchor.href, "format": "480p MP4", "height": 480, "isNative": true, "mediaType": "video"});
		anchor = downloads[1].getElementsByTagName("a")[0];
		sources.push({"url": anchor.href, "format": "360p MP4", "height": 360, "isNative": true, "mediaType": "video"});
		anchor = downloads[0].getElementsByTagName("a")[0];
		if(anchor) sources.push({"url": anchor.href, "format": "Audio MP3", "height": 0, "isNative": true, "mediaType": "audio"});
		
		var posterURL = xml.getElementById("embedCode").getAttribute("value").match(/&su=([^&]*)&/)[1];
		
		callback({
			"playlist": [{
				"poster": posterURL,
				"title": xml.getElementById("altHeadline").textContent,
				"sources": sources,
				"siteInfo": siteInfo
			}]
		});
	};
	xhr.send(null);
}

});
