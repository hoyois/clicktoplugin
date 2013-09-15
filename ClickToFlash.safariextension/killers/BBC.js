addKiller("BBC", {

"canKill": function(data) {
	return /^http:\/\/emp\.bbci\.co\.uk\/.*emp\.swf/.test(data.src);
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	var playlistURL = decodeURIComponent(flashvars.playlist);
	
	if(playlistURL === "undefined") { // BBC bug
		playlistURL = data.location.replace(/^http:\/\/www/, "http://playlists").replace(/[#?].*$/, "") + "A/playlist.sxml";
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", playlistURL, true);
	xhr.addEventListener("load", function(event) {
		var xml = event.target.responseXML;
		var mediator = xml.getElementsByTagName("mediator")[0];
		if(!mediator) return;
		
		var track = {};
		var title = xml.getElementsByTagName("title")[0];
		if(title) track.title = title.textContent;
		
		var links = xml.getElementsByTagName("link");
		for(var i = 0; i < links.length; i++) {
			if(links[i].getAttribute("rel") === "holding") {
				track.poster = links[i].getAttribute("href");
				break;
			}
		}
		
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "http://open.live.bbc.co.uk/mediaselector/4/jsfunc/stream/" + mediator.getAttribute("identifier") + "/processJSON/", true);
		// Can also use /mtis instead of /jsfunc to get an XML response; JSON should be marginally faster
		xhr.addEventListener("load", function() {
			var processJSON = function(data) {
				if(data.result !== "ok") return;
				
				var sources = [];
				data.media.forEach(function(media) {
					var connection = media.connection[0];
					if(!connection || connection.protocol !== "http" || !connection.href) return;
					sources.push({
						"url": connection.href,
						"format":  media.bitrate + "k MP4",
						"height": parseInt(media.height),
						"isNative": true
					});
				});
				if(sources.length === 0) return;
				track.sources = sources;
				callback({"playlist": [track]});
			};
			
			eval(xhr.responseText);
			
		}, false);
		xhr.send(null);
	}, false);
	xhr.send(null);
}

});
