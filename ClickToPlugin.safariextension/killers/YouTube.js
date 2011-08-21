var killer = new Object();
addKiller("YouTube", killer);

killer.canKill = function(data) {
	if(data.plugin !== "Flash") return false;
	if(data.src.indexOf("ytimg.com/") !== -1) {data.onsite = true; return true;}
	if(data.src.search(/youtube(?:-nocookie)?\.com\//) !== -1) {data.onsite = false; return true;}
	return false;
};

killer.process = function(data, callback) {
	if(data.onsite) {
		var flashvars = parseFlashVariables(data.params);
		if(/\s-\sYouTube$/.test(data.title)) flashvars.title = data.title.slice(0, -10);
		
		if(flashvars.list && /^PL/.test(flashvars.list)) this.processPlaylistID(flashvars.list.substr(2), flashvars, callback);
		else if(flashvars.url_encoded_fmt_stream_map) this.processFlashVars(flashvars, callback);
		else if(flashvars.video_id) this.processVideoID(flashvars.video_id, callback);
		return;
	}
	
	// Embedded YT video
	var match = data.src.match(/\.com\/([vpe])\/([^&?]+)/);
	if(match) {
		if(match[1] === "p") this.processPlaylistID(match[2], false, callback);
		else this.processVideoID(match[2], callback);
	}
};

killer.processFlashVars = function(flashvars, callback) {
	if(!flashvars.url_encoded_fmt_stream_map || flashvars.ps === "live") return;
	var formatList = decodeURIComponent(flashvars.url_encoded_fmt_stream_map).split(",");
		
	var sources = new Array();
	
	/* fmt values:
	MP4 (AVC1/MP4A): 38 (2304p), 37 (1080p), 22 (720p), 18 (360p)
	FLV (AVC1/MP4A): 35 (480p), 34 (360p)
	FLV (FLV1/MP3): 5 (240p)
	WebM (VP8/Vorbis): 45 (720p), 44 (480p), 43 (360p)
	*/
	for(var i = 0; i < formatList.length; i++) {
		var x = parseFlashVariables(formatList[i]);
		var videoURL = decodeURIComponent(x.url) + "&title=" + encodeURIComponent(flashvars.title);
		if(x.itag === "38") {
			sources.push({"url": videoURL, "format": "4K MP4", "height": 2304, "isNative": true, "mediaType": "video"});
		} else if(x.itag === "37") {
			sources.push({"url": videoURL, "format": "1080p MP4", "height": 1080, "isNative": true, "mediaType": "video"});
		} else if(x.itag === "22") {
			sources.push({"url": videoURL, "format": "720p MP4", "height": 720, "isNative": true, "mediaType": "video"});
		} else if(x.itag === "18") {
			sources.push({"url": videoURL, "format": "360p MP4", "height": 360, "isNative": true, "mediaType": "video"});
		} else if(x.itag === "35" && canPlayFLV) {
			sources.push({"url": videoURL, "format": "480p FLV", "height": 480, "isNative": false, "mediaType": "video"});
		} else if(x.itag === "34" && canPlayFLV) {
			sources.push({"url": videoURL, "format": "360p FLV", "height": 360, "isNative": false, "mediaType": "video"});
		} else if(x.itag === "5" && canPlayFLV) {
			sources.push({"url": videoURL, "format": "240p FLV", "height": 240, "isNative": false, "mediaType": "video"});
		} /*else if(x.itag === "45" && canPlayWebM) {
			sources.push({"url": videoURL, "format": "720p WebM", "height": 720, "isNative": false, "mediaType": "video"});
		} else if(x.itag === "44" && canPlayWebM) {
			sources.push({"url": videoURL, "format": "480p WebM", "height": 480, "isNative": false, "mediaType": "video"});
		} else if(x.itag === "43" && canPlayWebM) {
			sources.push({"url": videoURL, "format": "360p WebM", "height": 360, "isNative": false, "mediaType": "video"});
		}*/
	}
	
	var posterURL;
	if(flashvars.iurlmaxres) posterURL = decodeURIComponent(flashvars.iurlmaxres);
	else if(flashvars.iurlsd) posterURL = decodeURIComponent(flashvars.iurlsd);
	else posterURL = "https://i.ytimg.com/vi/" + flashvars.video_id + "/hqdefault.jpg";
	
	var siteInfo;
	if(!flashvars.t) siteInfo = {"name": "YouTube", "url": "http://www.youtube.com/watch?v=" + flashvars.video_id};
		
	var videoData = {
		"playlist": [{"title": flashvars.title, "poster": posterURL, "sources": sources, "siteInfo": siteInfo}]
	};
	callback(videoData);
};

killer.processVideoID = function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "https://www.youtube.com/get_video_info?&video_id=" + videoID + "&eurl=http%3A%2F%2Fwww%2Eyoutube%2Ecom%2F", true);
	xhr.onload = function() {
		var flashvars = parseFlashVariables(xhr.responseText);
		if(flashvars.status === "ok") {
			flashvars.title = decodeURIComponent(flashvars.title.replace(/\+/g, " "));
			_this.processFlashVars(flashvars, callback);
		} else { // happens if YT just removed content and didn't update its playlists yet
			callback({"playlist": []});
		}
	};
	xhr.send(null);
};

killer.processPlaylistID = function(playlistID, flashvars, callback) {
	var _this = this;
	var processList = function(list) {
		var track = 0;
		var length = list.length;
		if(flashvars.video_id) { // shift list so that videoID is first
			for(var i = 0; i < length; i++) {
				if(list[0] === flashvars.video_id) {track = i; break;}
				list.push(list.shift());
			}
		}
		
		var callbackForPlaylist = function(videoData) {
			videoData.playlistLength = length;
			videoData.startTrack = track;
			if(videoData.playlist[0].siteInfo) videoData.playlist[0].siteInfo.url += "&list=PL" + playlistID;
			callback(videoData);
		};
		// load the first video at once
		if(flashvars.url_encoded_fmt_stream_map) _this.processFlashVars(flashvars, callbackForPlaylist);
		else _this.processVideoID(list[0], callbackForPlaylist);
		list.shift();
		// load the rest of the playlist 3 by 3
		_this.processVideoIDList(playlistID, list, 3, callback);
	};
	this.buildVideoIDList(playlistID, [], 1, processList);
};

killer.buildVideoIDList = function(playlistID, videoIDList, startIndex, processList) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', "https://gdata.youtube.com/feeds/api/playlists/" + playlistID + "?start-index=" + startIndex + "&max-results=50", true);
	var _this = this;
	xhr.onload = function() {
		var entries = xhr.responseXML.getElementsByTagName("entry");
		for(var i = 0; i < entries.length; i++) {
			try{ // being lazy
				videoIDList.push(entries[i].getElementsByTagNameNS("http://search.yahoo.com/mrss/", "player")[0].getAttribute("url").match(/\?v=([^&?']+)/)[1]);
			} catch(err) {}
		}
		var links = xhr.responseXML.getElementsByTagName("link");
		for(var i = 0; i < links.length; i++) {
			if(links[i].getAttribute("rel") === "next") {
				_this.buildVideoIDList(playlistID, videoIDList, startIndex + 50, processList);
				return;
			}
		}
		// If we're here we reached the end of the list
		processList(videoIDList);
	};
	xhr.send(null);
};

killer.processVideoIDList = function(playlistID, videoIDList, n, callback) {
	if(videoIDList.length === 0) return;
	var i = 0;
	var imax = videoIDList.length;
	if(imax > n) imax = n; // load by groups of n
	var mediaData = {"loadAfter": true, "missed": 0, "playlist": []};
	var _this = this;
	var next = function(videoData) {
		// this actually works!! feels like TeXing...
		if(videoData.playlist.length > 0) {
			videoData.playlist[0].siteInfo.url += "&list=PL" + playlistID;
			mediaData.playlist.push(videoData.playlist[0]);
		} else { // playlist is 1 shorter than announced
			++mediaData.missed;
		}
		++i;
		if(i === imax) {
			callback(mediaData);
			_this.processVideoIDList(playlistID, videoIDList, n, callback);
		} else _this.processVideoID(videoIDList.shift(), next);
	};
	this.processVideoID(videoIDList.shift(), next);
	return;
};

