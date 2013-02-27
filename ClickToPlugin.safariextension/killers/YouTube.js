addKiller("YouTube", {

"canKill": function(data) {
	if(/^https?:\/\/s\.ytimg\.com\//.test(data.src)) return true;
	if(/^https?:\/\/(?:www\.)?youtube(?:-nocookie|\.googleapis)?\.com\//.test(data.src)) {data.embed = true; return true;}
	return false;
},

"process": function(data, callback) {
	if(data.embed) { // old-style YT embed
		var match = /\.com\/([vpe])\/+([^&?]+)/.exec(data.src);
		if(match) {
			if(match[1] === "p") this.processPlaylistID("PL" + match[2], {}, callback);
			else this.processVideoID(match[2], callback);
		}
		return;
	}
	
	var flashvars = parseFlashVariables(data.params.flashvars);
	var onsite = flashvars.t && flashvars.url_encoded_fmt_stream_map;
	
	if(onsite) {
		var match = /_as3-vfl(.{6})\.swf/.exec(data.src);
		if(match) flashvars.key = match[1];
		match = /[#&?]t=(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?/.exec(data.location);
		if (match) {
			var hours = parseInt(match[1], 10) || 0;
			var minutes = parseInt(match[2], 10) || 0;
			var seconds = parseInt(match[3], 10) || 0;
			flashvars.start = 3600 * hours + 60 * minutes + seconds;
		}
		
		flashvars.initScript = "\
			try{\
				if(!mediaElement.parentNode) throw null;\
				var seekTo = function(time) {\
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
				window.yt = window.yt || {}; yt.www = yt.www || {}; yt.www.watch = yt.www.watch || {}; yt.www.watch.player = yt.www.watch.player || {};\
				yt.www.watch.player.flashSeekTo = yt.www.watch.player.seekTo;\
				Object.defineProperty(yt.www.watch.player, \"seekTo\", {\"get\": function() {return seekTo;}, \"set\": function(x) {yt.www.watch.player.flashSeekTo = x;}, \"configurable\": false, \"enumerable\": false});\
			} catch(e) {}";
		flashvars.restoreScript = "\
			try{\
				var player = {\"seekTo\": yt.www.watch.player.flashSeekTo};\
				for(var e in yt.www.watch.player) {\
					if(e !== \"flashSeekTo\") player[e] = yt.www.watch.player[e];\
				}\
				yt.www.watch.player = player;\
			} catch(e) {}";
	}
	
	if(/^PL|^SP|^UL/.test(flashvars.list) && flashvars.feature !== "channel") this.processPlaylistID(flashvars.list, flashvars, callback);
	else if(onsite) this.processFlashVars(flashvars, callback);
	else if(flashvars.video_id) this.processVideoID(flashvars.video_id, callback);
},

"processFlashVars": function(flashvars, callback) {
	if(flashvars.ps === "live") return;
	var formatList = decodeURIComponent(flashvars.url_encoded_fmt_stream_map).split(",");
	
	var sources = [];
	var x;
	for(var i = 0; i < formatList.length; i++) {
		x = parseFlashVariables(formatList[i]);
		var source = this.processItag(x.itag);
		if(source) {
			source.url = decodeURIComponent(x.url) + "&title=" + flashvars.title;
			if(x.sig) source.url += "&signature=" + x.sig;
			else if(x.s) source.url += "&signature=" + this.decodeSignature(x.s, flashvars.key);
			sources.push(source);
		}
	}
	
	var posterURL;
	if(flashvars.iurlmaxres) posterURL = decodeURIComponent(flashvars.iurlmaxres);
	else if(flashvars.iurlsd) posterURL = decodeURIComponent(flashvars.iurlsd);
	else posterURL = "https://i.ytimg.com/vi/" + flashvars.video_id + "/hqdefault.jpg";
	
	callback({
		"playlist": [{
			"title": decodeURIComponent(flashvars.title.replace(/\+/g, " ")),
			"poster": posterURL,
			"sources": sources
		}],
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
},

"processItag": function(itag) {
	if(itag === "38") return {"format": "4K MP4", "height": 2304, "isNative": true};
	if(itag === "37") return {"format": "1080p MP4", "height": 1080, "isNative": true};
	if(itag === "22") return {"format": "720p MP4", "height": 720, "isNative": true};
	if(itag === "18") return {"format": "360p MP4", "height": 360, "isNative": true};
	if(canPlayFLV) {
		if(itag === "35") return {"format": "480p FLV", "height": 480, "isNative": false};
		if(itag === "5") return {"format": "240p FLV", "height": 240, "isNative": false};
	}
	return false;
},

"decodeSignature": function(s, key) {
	s = s.split("");
	var L = s.length;
	var reverse = function() {s = s.reverse();};
	var slice = function(a,b) {s = s.slice(a,b+L);};
	var cycle = function() {
		var x = [];
		var tmp;
		for(var i = arguments.length-1; i >= 0; --i) {
			x[i] = arguments[i];
			if(x[i] < 0) x[i] += L;
			if(tmp === undefined) tmp = s[x[i]];
			else s[x[i+1]] = s[x[i]];
		}
		s[x[0]] = tmp;
	};
	
	switch(key) {
	case "VIZAvA": cycle(0,43,56,44); cycle(3,62,6); slice(3,-2); break;
	case "lpXa0y": cycle(2,48); cycle(-46,-3); cycle(-28,-1); slice(2,-4); break;
	case "cky2Yk": cycle(0,6); cycle(-23,-2); slice(0,-1); break;
	case "JKo6LT": cycle(0,10); cycle(6,65); slice(6,-1); break;
	case "97HaY5": slice(3,-3); break;
	case "X3vz3j": cycle(0,27); cycle(-54,-32,-1); slice(2,0); break;
	case "-KqBih": reverse(); cycle(-26,-22,-2,-21); cycle(-23,-1); slice(0,-2); break;
	case "rHY3xi": reverse(); cycle(0,54,21,34); cycle(-16,-1); slice(2,0); break;
	case "p80jd_": reverse(); cycle(0,30); cycle(-51,-5); cycle(-18,-2); slice(0,-4); break;
	case "6fbJ-B": reverse(); cycle(2,36); cycle(3,46); cycle(-65,-2); cycle(-16,-4); slice(3,-3); break;
	case "XPuwnw": reverse(); cycle(0,60); cycle(3,44); slice(3,0); break;
	case "7DhXER": reverse(); cycle(0,59); cycle(-57,-51,-3); cycle(-19,-1); slice(0,-5); break;
	case "bRE_EL": reverse(); cycle(2,69); slice(2,-4); break;
	case "_769QM": reverse(); cycle(0,60); slice(1,-3); break;
	case "StOJYe":
	case "n3UefM":
	default:       reverse(); cycle(-66,-1); slice(2,-2); break;
	}
	return s.join("");
}

});
