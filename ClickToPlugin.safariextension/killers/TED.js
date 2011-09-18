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
		// response is invalid XML but error comes late enough
		var xml = new DOMParser().parseFromString(xhr.responseText, "text/xml");
		
		var sources = [];
		var audio = xml.getElementsByClassName("downloads")[0].getElementsByTagName("a");
		var video = xml.getElementsByClassName("downloads")[1].getElementsByTagName("a");
		if(video[2]) sources.push({"url": video[2].href, "format": "480p MP4", "height": 480, "isNative": true});
		sources.push({"url": video[0].href, "format": "360p MP4", "height": 360, "isNative": true});
		if(video[3]) sources.push({"url": video[3].href, "format": "270p MP4", "height": 270, "isNative": true});
		if(audio[0]) sources.push({"url": audio[0].href, "format": "Audio MP3", "height": 0, "isNative": true, "isAudio": true});
		
		callback({
			"playlist": [{
				"poster": /&su=([^&]*)&/.exec(xml.getElementById("embedCode").getAttribute("value"))[1],
				"title": xml.getElementById("altHeadline").textContent,
				"sources": sources,
				"siteInfo": siteInfo
			}]
		});
	};
	xhr.send(null);
}

});
