addKiller("TED", {

"canKill": function(data) {
	return data.src.indexOf("ted.com/assets/player") !== -1 && /^https?:\/\/www\.ted\.com\//.test(data.location);
},

"process": function(data, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", data.location, true);
	xhr.addEventListener("load", function() {
		var i = xhr.responseText.lastIndexOf("<script>q(\"talkPage.init\",");
		var json = xhr.responseText.substring(i+26);
		i = json.indexOf(")<");
		var json = json.substring(0,i);
		var data = JSON.parse(json).talks[0];
		
		var sources = [
			{"url": data.nativeDownloads.high, "format": "480p MP4", "height": 480, "isNative": true},
			{"url": data.nativeDownloads.medium, "format": "360p MP4", "height": 360, "isNative": true},
			{"url": data.nativeDownloads.low, "format": "270p MP4", "height": 270, "isNative": true}
		];
		if(data.audioDownload) sources.push({"url": data.audioDownload, "format": "Audio MP3", "height": 0, "isNative": true, "isAudio": true});
		
		callback({
			"playlist": [{
				"poster": data.thumb,
				"title": data.name,
				"sources": sources
			}]
		});
	}, false);
	xhr.send(null);
}

});
