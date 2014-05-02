addKiller("TED", {

"canKill": function(data) {
	return data.src.indexOf("ted.com/assets/player") !== -1;
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	
	var siteInfo;
	var url = data.location;
	if(/^https?:\/\/embed\.ted\.com\/talks/.test(url)) {
		url = url.replace("embed", "www")
		siteInfo = {"name": "TED", "url": url};
	}
	
	var playlist = JSON.parse(decodeURIComponent(flashvars.playlist).replace(/\\\//g, "/"));
	var talkID = playlist.talks[0].resource[0].file;
	talkID = talkID.substring(talkID.lastIndexOf("/"), talkID.lastIndexOf("-"));
	
	var urlBase = "http://download.ted.com/talks" + talkID;
	var sources = [
		{"url": urlBase + "-480p.mp4", "format": "480p MP4", "height": 480, "isNative": true},
		{"url": urlBase + ".mp4", "format": "360p MP4", "height": 360, "isNative": true},
		{"url": urlBase + "-light.mp4", "format": "270p MP4", "height": 270, "isNative": true}
	];
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.addEventListener("load", function() {
		var page = document.implementation.createHTMLDocument("");
		page.documentElement.innerHTML = xhr.responseText;
		
		var title = page.querySelector("[property=\"og:title\"]").getAttribute("content");
		var posterURL = page.querySelector("[property=\"og:image\"]").getAttribute("content");
		if(/\"audioDownload\":\"/.test(xhr.responseText)) sources.push({"url": urlBase + ".mp3", "format": "Audio MP3", "height": 0, "isNative": true, "isAudio": true});
		
		callback({
			"playlist": [{
				"poster": posterURL,
				"title": title,
				"sources": sources,
				"siteInfo": siteInfo
			}]
		});
	}, false);
	xhr.send(null);
}

});
