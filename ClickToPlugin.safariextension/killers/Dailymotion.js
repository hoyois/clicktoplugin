addKiller("Dailymotion", {

"canKill": function(data) {
	return data.src.indexOf("/dmplayerv4/") !== -1 || data.src.indexOf("www.dailymotion.com") !== -1;
},

"process": function(data, callback) {
	var sequence = parseFlashVariables(data.params.flashvars).sequence;
	if(sequence) {
		var match = /videoId%22%3A%22([^%]*)/.exec(sequence);
		if(match) this.processVideoID(match[1], callback);
	} else {
		var match = /\/swf\/(?:video\/)?([^&?#]+)/.exec(data.src);
		if(match) this.processVideoID(match[1], function(mediaData) {
			mediaData.playlist[0].siteInfo = {"name": "Dailymotion", "url": "http://www.dailymotion.com/video/" + match[1]};
			callback(mediaData);
		});
	}
},

"processVideoID": function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://www.dailymotion.com/embed/video/" + videoID, true);
	xhr.addEventListener("load", function() {
		var match = /var info = (.*),/.exec(xhr.responseText);
		if(!match) return;
		var info = JSON.parse(match[1]);
		
		var sources = [];
		if(info.stream_h264_hd1080_url) sources.push({"url": info.stream_h264_hd1080_url, "format": "1080p MP4", "height": 1080, "isNative": true});
		if(info.stream_h264_hd_url) sources.push({"url": info.stream_h264_hd_url, "format": "720p MP4", "height": 720, "isNative": true});
		if(info.stream_h264_hq_url) sources.push({"url": info.stream_h264_hq_url, "format": "480p MP4", "height": 480, "isNative": true});
		if(info.stream_h264_url) sources.push({"url": info.stream_h264_url, "format": "380p MP4", "height": 360, "isNative": true});
		if(info.stream_h264_ld_url) sources.push({"url": info.stream_h264_ld_url, "format": "240p MP4", "height": 240, "isNative": true});
		if(sources.length === 0) return;
		
		callback({"playlist": [{
			"title": info.title,
			"poster": info.thumbnail_url,
			"sources": sources
		}]});
	}, false);
	xhr.send(null);
}

});
