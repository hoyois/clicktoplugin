addKiller("YouTube", {

"canKill": function(data) {
	if(data.src.indexOf("ytimg.com/") !== -1) {data.onsite = true; return true;}
	if(data.src.search(/youtube(?:-nocookie)?\.com\//) !== -1) {data.onsite = false; return true;}
	return false;
},

"process": function(data, callback) {
	if(data.onsite) {
		var flashvars = parseFlashVariables(data.params.flashvars);
		if(/\s-\sYouTube$/.test(data.title)) flashvars.title = data.title.slice(0, -10);
		
		if(flashvars.list && /^PL|^UL|^AV/.test(flashvars.list)) this.processPlaylistID(flashvars.list, flashvars, callback);
		else if(flashvars.t && flashvars.url_encoded_fmt_stream_map) this.processFlashVars(flashvars, callback);
		else if(flashvars.video_id) this.processVideoID(flashvars.video_id, callback);
	} else { // Embedded YT video
		var match = data.src.match(/\.com\/([vpe])\/([^&?]+)/);
		if(match) {
			if(match[1] === "p") this.processPlaylistID("PL" + match[2], {}, callback);
			else this.processVideoID(match[2], callback);
		}
	}
},

"processFlashVars": function(flashvars, callback) {
	if(!flashvars.url_encoded_fmt_stream_map || flashvars.ps === "live") return;
	var formatList = decodeURIComponent(flashvars.url_encoded_fmt_stream_map).split(",");
		
	var sources = [];
	
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
	
	callback({"playlist": [{"title": flashvars.title, "poster": posterURL, "sources": sources}]});
},

"processVideoID": function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "https://www.youtube.com/get_video_info?&video_id=" + videoID + "&eurl=http%3A%2F%2Fwww%2Eyoutube%2Ecom%2F", true);
	xhr.onload = function() {
		var flashvars = parseFlashVariables(xhr.responseText);
		if(flashvars.status === "ok") {
			flashvars.title = decodeURIComponent(flashvars.title.replace(/\+/g, " "));
			var callbackForEmbed = function(videoData) {
				videoData.playlist[0].siteInfo = {"name": "YouTube", "url": "http://www.youtube.com/watch?v=" + videoID};
				callback(videoData);
			};
			_this.processFlashVars(flashvars, callbackForEmbed);
		} else { // happens if YT just removed content and didn't update its playlists yet
			callback({"playlist": []});
		}
	};
	xhr.send(null);
},

"processPlaylistID": function(playlistID, flashvars, callback) {
	var videoIDList = [];
	var _this = this;
	
	var init = function() {
		if(playlistID.charAt(0) === "P") loadAPIList("https://gdata.youtube.com/feeds/api/playlists/" + playlistID.substr(2), 1);
		else if(playlistID.charAt(0) === "A") loadArtistList("https://www.youtube.com/artist?a=" + playlistID.substr(2));
		else { // charAt(0) === "U"
			if(flashvars.creator) loadAPIList("https://gdata.youtube.com/feeds/api/users/" + flashvars.creator + "/uploads", 1);
			else if(flashvars.ptchn) loadAPIList("https://gdata.youtube.com/feeds/api/users/" + flashvars.ptchn + "/uploads", 1);
			else {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", "https://www.youtube.com/get_video_info?&video_id=" + playlistID.substr(2) + "&eurl=http%3A%2F%2Fwww%2Eyoutube%2Ecom%2F", true);
				xhr.onload = function() {loadAPIList("https://gdata.youtube.com/feeds/api/users/" + parseFlashVariables(xhr.responseText).author + "/uploads", 1);};
				xhr.send(null);
			}
		}
	};
	
	var loadAPIList = function(playlistURL, startIndex) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', playlistURL + "?start-index=" + startIndex + "&max-results=50", true);
		xhr.onload = function() {
			var entries = xhr.responseXML.getElementsByTagName("entry");
			for(var i = 0; i < entries.length; i++) {
				try{ // being lazy
					videoIDList.push(/\?v=([^&?']+)/.exec(entries[i].getElementsByTagNameNS("http://search.yahoo.com/mrss/", "player")[0].getAttribute("url"))[1]);
				} catch(err) {}
			}
			if(xhr.responseXML.querySelector("link[rel='next']") === null) processList();
			else loadAPIList(playlistURL, startIndex + 50);
		};
		xhr.send(null);
	};
	
	var loadArtistList = function(url) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.onload = function() {
			var html = document.implementation.createHTMLDocument("");
			html.documentElement.innerHTML = xhr.responseText;
			var entries = html.getElementById("artist-videos").getElementsByClassName("album-row");
			for(var i = 0; i < entries.length; i++) {
				videoIDList.push(entries[i].id.substr(12));
			}
			processList();
		};
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
		}

		var callbackForPlaylist = function(mediaData) {
			mediaData.playlistLength = length;
			mediaData.startTrack = track;
			if(mediaData.playlist[0].siteInfo) mediaData.playlist[0].siteInfo.url += "&list=" + playlistID;
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
			// this actually works!! feels like TeXing...
			if(data.playlist.length > 0) {
				data.playlist[0].siteInfo.url += "&list=" + playlistID;
				mediaData.playlist.push(data.playlist[0]);
			} else mediaData.playlist.push(null);
			++i;
			if(i === imax) {
				callback(mediaData);
				unloadList();
			} else _this.processVideoID(videoIDList.shift(), next);
		};
		_this.processVideoID(videoIDList.shift(), next);
		return;
	};
	
	init();
}
});
