var killer = {};
addKiller("Metacafe", killer);

killer.canKill = function(data) {
	if(data.plugin !== "Flash") return false;
	return (data.src.indexOf(".mcstatic.com/Flash/vp/") !== -1 || data.src.indexOf("metacafe.com/fplayer/") !== -1);
};

killer.process = function(data, callback) {
	if(/(?:^|&)mediaData=/.test(data.params.flashvars)) {
		this.processFlashVars(parseFlashVariables(data.params.flashvars), callback);
	} else {
		var match = data.src.match(/metacafe\.com\/fplayer\/([0-9]*)\//);
		if(match) this.processVideoID(match[1], callback);
		return;
	}
};

killer.processFlashVars = function(flashvars, callback) {
	if(!flashvars.mediaData) return;
	var mediaList = JSON.parse(decodeURIComponent(flashvars.mediaData));
	for(var type in mediaList) {
		mediaList[type] = mediaList[type].mediaURL + "?__gda__=" + mediaList[type].key;
	}
	var sources = [];
	
	if(mediaList.highDefinitionMP4) {
		sources.push({"url": mediaList.highDefinitionMP4, "format": "HD MP4", "height": 720, "isNative": true, "mediaType": "video"});
	}
	if(mediaList.MP4) {
		sources.push({"url": mediaList.MP4, "format": "SD MP4", "height": 360, "isNative": true, "mediaType": "video"});
	}
	if(canPlayFLV && mediaList.flv) {
		sources.push({"url": mediaList.flv, "format": "SD FLV", "height": 360, "isNative": false, "mediaType": "video"});
	}
	
	var title;
	if(flashvars.title) title = decodeURIComponent(flashvars.title);
	
	callback({"playlist": [{"title": title, "sources": sources}]});
};

killer.processVideoID = function(videoID, callback) {
	var xhr = new XMLHttpRequest();
	var url = "http://www.metacafe.com/watch/" + videoID;
	xhr.open('GET', url, true);
	var _this = this;
	xhr.onload = function() {
		var match = xhr.responseText.match(/name=\"flashvars\"\svalue=\"([^"]*)\"/);
		if(match) {
			var callbackForEmbed = function(videoData) {
				videoData.playlist[0].siteInfo = {"name": "Metacafe", "url": url};
				callback(videoData);
			};
			_this.processFlashVars(match[1], callbackForEmbed);
		}
	};
	xhr.send(null);
};

