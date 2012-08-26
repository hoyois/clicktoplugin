addKiller("YouTube", {

"getInfo": function(itag) {
	if(itag === "38") return {"format": "4K MP4", "height": 2304, "isNative": true};
	if(itag === "37") return {"format": "1080p MP4", "height": 1080, "isNative": true};
	if(itag === "22") return {"format": "720p MP4", "height": 720, "isNative": true};
	if(itag === "18") return {"format": "360p MP4", "height": 360, "isNative": true};
	if(canPlayFLV) {
		if(itag === "35") return {"format": "480p FLV", "height": 480, "isNative": false};
		//if(itag === "34") return {"format": "360p FLV", "height": 360, "isNative": false};
		//if(itag === "6") return {"format": "270p FLV", "height": 270, "isNative": false};
		if(itag === "5") return {"format": "240p FLV", "height": 240, "isNative": false};
	}
	/*if(canPlayWebM) {
		if(itag === "46") return {"format": "1080p WebM", "height": 1080, "isNative": false};
		if(itag === "45") return {"format": "720p WebM", "height": 720, "isNative": false};
		if(itag === "44") return {"format": "480p WebM", "height": 480, "isNative": false};
		if(itag === "43") return {"format": "360p WebM", "height": 360, "isNative": false};
	}*/
	return false;
},

"canKill": function(data) {
	if(/^https?:\/\/s\.ytimg\.com\//.test(data.src)) return true;
	if(/^https?:\/\/(?:www\.)?youtube(?:-nocookie|\.googleapis)?\.com\//.test(data.src)) {data.embed = true; return true;}
	return false;
},

"process": function(data, callback) {
	
	if(data.embed) { // old-style YT embed
		var match = /\.com\/([vpe])\/([^&?]+)/.exec(data.src);
		if(match) {
			if(match[1] === "p") this.processPlaylistID("PL" + match[2], {}, callback);
			else this.processVideoID(match[2], callback);
		}
		return;
	}
	
	var flashvars = parseFlashVariables(data.params.flashvars);
	var onsite = flashvars.t && flashvars.url_encoded_fmt_stream_map;
	
	if(/\s-\sYouTube$/.test(data.title)) flashvars.title = data.title.slice(0, -10);
	
	if(onsite) {
		var match = /[#&?]t=(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?/.exec(data.location);
		if (match) {
			var hours = parseInt(match[1], 10) || 0;
			var minutes = parseInt(match[2], 10) || 0;
			var seconds = parseInt(match[3], 10) || 0;
			flashvars.start = 3600 * hours + 60 * minutes + seconds;
		}
		
		flashvars.initScript = "\
			var tries = 0;\
			var intervalID = setInterval(function() {\
				try{\
					if(!mediaElement.parentNode) throw null;\
					yt.www.watch.player.oldSeekTo = yt.www.watch.player.seekTo;\
					yt.www.watch.player.seekTo = function(time) {\
						var seek = function() {\
							mediaElement.removeEventListener(\"loadeddata\", seek, false);\
							mediaElement.currentTime = time;\
							mediaElement.play();\
						};\
						if(mediaElement.readyState >= mediaElement.HAVE_CURRENT_DATA) {\
							mediaElement.pause();\
							seek();\
						} else {\
							mediaElement.preload = \"auto\";\
							mediaElement.addEventListener(\"loadeddata\", seek, false);\
						}\
						mediaElement.parentNode.focus();\
					};\
					clearInterval(intervalID);\
				} catch(e) {\
					if(++tries > 100 || e === null) clearInterval(intervalID);\
				}\
			}, 100);";
		flashvars.restoreScript = "\
			try{\
				if(yt.www.watch.player.oldSeekTo) yt.www.watch.player.seekTo = yt.www.watch.player.oldSeekTo;\
			} catch(e) {}";
	}
	
	if(/^PL|^SP|^UL/.test(flashvars.list) && flashvars.feature !== "channel") this.processPlaylistID(flashvars.list, flashvars, callback);
	else if(onsite) this.processFlashVars(flashvars, callback);
	else if(flashvars.video_id) this.processVideoID(flashvars.video_id, function(mediaData) {
		mediaData.startTime = parseInt(flashvars.start);
		callback(mediaData);
	});
},

"processFlashVars": function(flashvars, callback) {
	if(flashvars.ps === "live") return;
	var formatList = decodeURIComponent(flashvars.url_encoded_fmt_stream_map).split(",");
	
	var sources = [];
	var x;
	for(var i = 0; i < formatList.length; i++) {
		x = parseFlashVariables(formatList[i]);
		var source = this.getInfo(x.itag);
		if(source) {
			source.url = decodeURIComponent(x.url) + "&title=" + encodeURIComponent(flashvars.title);
			if(x.sig) source.url += "&signature=" + x.sig;
			sources.push(source);
		}
	}
	
	var posterURL;
	if(flashvars.iurlmaxres) posterURL = decodeURIComponent(flashvars.iurlmaxres);
	else if(flashvars.iurlsd) posterURL = decodeURIComponent(flashvars.iurlsd);
	else posterURL = "https://i.ytimg.com/vi/" + flashvars.video_id + "/hqdefault.jpg";
	
	callback({
		"playlist": [{"title": flashvars.title, "poster": posterURL, "sources": sources}],
		"startTime": parseInt(flashvars.start),
		"initScript": flashvars.initScript,
		"restoreScript": flashvars.restoreScript
	});
},

"processVideoID": function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "https://www.youtube.com/get_video_info?&video_id=" + videoID + "&eurl=http%3A%2F%2Fwww%2Eyoutube%2Ecom%2F", true);
	xhr.addEventListener("load", function() {
		var flashvars = parseFlashVariables(xhr.responseText);
		if(flashvars.status === "ok" && flashvars.ps !== "live") {
			flashvars.title = decodeURIComponent(flashvars.title.replace(/\+/g, " "));
			var callbackForEmbed = function(videoData) {
				videoData.playlist[0].siteInfo = {"name": "YouTube", "url": "http://www.youtube.com/watch?v=" + videoID};
				callback(videoData);
			};
			_this.processFlashVars(flashvars, callbackForEmbed);
		} else { // happens e.g. if YT just removed content and didn't update its playlists yet
			callback({"playlist": [null]});
		}
	}, false);
	xhr.send(null);
},

"processPlaylistID": function(playlistID, flashvars, callback) {
	var videoIDList = [];
	var _this = this;
	
	var loadAPIList = function(playlistURL, startIndex, reverse) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", playlistURL + "?start-index=" + startIndex + "&max-results=50", true);
		xhr.addEventListener("load", function() {
			if(xhr.status !== 200) {
				_this.processFlashVars(flashvars, callback);
				return;
			}
			var entries = xhr.responseXML.getElementsByTagName("entry");
			for(var i = 0; i < entries.length; i++) {
				try{ // being lazy
					videoIDList[reverse ? "unshift" : "push"](/\?v=([^&?']+)/.exec(entries[i].getElementsByTagNameNS("http://search.yahoo.com/mrss/", "player")[0].getAttribute("url"))[1]);
				} catch(e) {}
			}
			if(xhr.responseXML.querySelector("link[rel='next']") === null) processList();
			else loadAPIList(playlistURL, startIndex + 50, reverse);
		}, false);
		xhr.send(null);
	};
	
	var processList = function() {
		var track = 0;
		var length = videoIDList.length;
		if(flashvars.video_id) { // shift list so that videoID is first
			while(videoIDList[0] !== flashvars.video_id && track < length) {
				++track;
				videoIDList.push(videoIDList.shift());
			}
			if(track === length) {
				videoIDList.unshift(flashvars.video_id);
				++length;
				track = 0;
			}
		}

		var callbackForPlaylist = function(mediaData) {
			mediaData.playlistLength = length;
			mediaData.startTrack = track;
			callback(mediaData);
		};
		
		// load the first video at once
		if(flashvars.url_encoded_fmt_stream_map) _this.processFlashVars(flashvars, callbackForPlaylist);
		else _this.processVideoID(videoIDList[0], callbackForPlaylist);
		videoIDList.shift();
		unloadList();
	};
	
	var unloadList = function() {
		if(videoIDList.length === 0) return;
		var i = 0;
		var imax = videoIDList.length;
		if(imax > 3) imax = 3; // load by groups of 3
		var mediaData = {"loadAfter": true, "playlist": []};
		var next = function(data) {
			mediaData.playlist.push(data.playlist[0]);
			++i;
			if(i === imax) {
				callback(mediaData);
				unloadList();
			} else _this.processVideoID(videoIDList.shift(), next);
		};
		_this.processVideoID(videoIDList.shift(), next);
		return;
	};
	
	switch(playlistID.substring(0,2)) {
	case "PL":
	case "SP":
		loadAPIList("https://gdata.youtube.com/feeds/api/playlists/" + playlistID.substring(2), 1, false);
		break;
	case "UL":
		if(flashvars.creator) loadAPIList("https://gdata.youtube.com/feeds/api/users/" + flashvars.creator + "/uploads", 1, true);
		else if(flashvars.ptchn) loadAPIList("https://gdata.youtube.com/feeds/api/users/" + flashvars.ptchn + "/uploads", 1, true);
		else {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", "https://www.youtube.com/get_video_info?&video_id=" + playlistID.substring(2) + "&eurl=http%3A%2F%2Fwww%2Eyoutube%2Ecom%2F", true);
			xhr.addEventListener("load", function() {loadAPIList("https://gdata.youtube.com/feeds/api/users/" + parseFlashVariables(xhr.responseText).author + "/uploads", 1, true);}, false);
			xhr.send(null);
		}
		break;
	}
}

});
