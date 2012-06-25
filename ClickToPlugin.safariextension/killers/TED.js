addKiller("TED", {

"canKill": function(data) {
	return data.src.indexOf("http://video.ted.com/assets/player/swf") !== -1;
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	
	var siteInfo;
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
	xhr.open("GET", url, true);
	xhr.addEventListener("load", function() {
		var page = new DOMParser().parseFromString(xhr.responseText, "text/xml");
		var talkID = page.getElementById("flash_message").getElementsByTagName("a")[1].href;
		talkID = /[^-.]*/.exec(talkID.substring(talkID.lastIndexOf("/") + 1))[0];
		
		var xhr2 = new XMLHttpRequest();
		xhr2.open("GET", "http://www.ted.com/download/links/slug/" + talkID + "/type/talks/ext/mp4", true);
		xhr2.addEventListener("load", function() {
			var xml = new DOMParser().parseFromString(("<root>" + xhr2.responseText + "</root>").replace(/&[^;]*;/g, ""), "text/xml");
			
			var sources = [];
			var audio = xml.getElementById("audio_downloads").getElementsByTagName("a");
			var downloads = xml.getElementsByName("download_quality");
			for(var i = downloads.length - 1; i >= 0; i--) {
				var quality = downloads[i].dataset.name;
				if(quality === "light") quality = "270p";
				else if(quality === "regular") quality = "360p";
				sources.push({"url": "http://download.ted.com/talks/" + talkID + downloads[i].getAttribute("value") + ".mp4", "format": quality + " MP4", "height": parseInt(quality), "isNative": true})
			}
			if(audio[0]) sources.push({"url": audio[0].getAttribute("href"), "format": "Audio MP3", "height": 0, "isNative": true, "isAudio": true});
			
			callback({
				"playlist": [{
					//"poster": /&su=([^&]*)&/.exec(page.getElementById("embedCode").getAttribute("value"))[1],
					"poster": page.querySelector("[rel=\"image_src\"]").href,
					"title": page.getElementById("altHeadline").textContent,
					"sources": sources,
					"siteInfo": siteInfo
				}]
			});
		}, false);
		xhr2.send(null);
	}, false);
	xhr.send(null);
}

});
