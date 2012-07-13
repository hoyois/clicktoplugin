addKiller("Vimeo", {

"canKill": function(data) {
	return data.src.indexOf("vimeo.com/moogaloop") !== -1 || data.src.indexOf("vimeocdn.com/p/flash/moogalo") !== -1;
},

"process": function(data, callback) {
	var videoID;
	if(data.params.flashvars) videoID = parseFlashVariables(data.params.flashvars).clip_id;
	if(!videoID) {
		var match = /clip_id=([^&]+)/.exec(data.src);
		if(match) videoID = match[1];
	}
	if(!videoID) return;
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://vimeo.com/" + videoID, true);
	xhr.onload = function() {
		var s = xhr.responseText.substring(xhr.responseText.lastIndexOf("<script>"));
		s = s.substring(s.indexOf("config:{") + 7);
		s = s.substring(0, s.indexOf(",assets:"));
		var config = JSON.parse(s.replace(/\\\//g, "/"));
		
		var sources = [];
		var addSource = function(codec, quality) {
			var source = {"url": "http://player.vimeo.com/play_redirect?quality=" + quality + "&codecs=" + codec + "&clip_id=" + videoID + "&sig=" + config.request.signature + "&time=" + config.request.timestamp, "isNative": codec === "h264"};
			switch(quality) {
			case "hd":
				if(config.video.height === 1080) source.format = "1080p";
				else source.format = "720p";
				source.height = 720;
				break;
			case "sd":
				source.format = "360p";
				source.height = 360;
				break;
			case "mobile":
				source.format = "Mobile";
				source.height = 240;
				break;
			}
			source.format += codec === "h264" ? " MP4" : " FLV";
			sources.push(source);
		};
		
		if(config.video.files.h264) {
			for(var i = 0; i < config.video.files.h264.length; i++) {
				addSource("h264", config.video.files.h264[i]);
			}
		}
		if(canPlayFLV && config.video.files.vp6) {
			for(var i = 0; i < config.video.files.vp6.length; i++) {
				addSource("vp6", config.video.files.vp6[i]);
			}
		}
		
		var siteInfo;
		if(data.location.indexOf("vimeo.com/") === -1 || data.location === "http://vimeo.com/" || data.location.indexOf("player.vimeo.com/") !== -1) siteInfo = {"name": "Vimeo", "url": "http://vimeo.com/" + videoID};
		
		callback({"playlist": [{
			"siteInfo": siteInfo,
			"title": config.video.title,
			"poster": config.video.thumbnail,
			"sources": sources
		}]});
	};
	xhr.send(null);
}

});