function YouTubeKiller() {
	this.name = "YouTubeKiller";
}

YouTubeKiller.prototype.canKill = function(data) {
	if(data.plugin != "Flash" || !safari.extension.settings["replaceFlash"]) return false;
    return (data.src.match("ytimg.com") || data.src.match("youtube.com") || data.src.match("youtube-nocookie.com"));
};

YouTubeKiller.prototype.processElement = function(data, callback) {
    if(data.params) {
		if(safari.extension.settings["usePlaylists"]) {
			var URLvars = data.location.split("?")[1];
	        var playlistID = null;
	        if(URLvars) {
				URLvars = URLvars.split("&");
	            for (var i = 0; i < URLvars.length; i++) {
	                var keyValuePair = URLvars[i].split("="); 
					if (keyValuePair[0] == "p") {
						playlistID = keyValuePair[1];
						break;
					}
	            }
	        }
			if(playlistID) {
				this.buildVideoIDList(data.params, playlistID, 0, new Array(), callback);
			} else this.processElementFromFlashVars(data.params, callback);
		} else this.processElementFromFlashVars(data.params, callback);
        return;
    }
    // The vid has no flashvars... Only hope is that it is a YouTube /v/ embed
    var index = data.src.indexOf(".com/v/");
    if(index == -1) {
		if(safari.extension.settings["usePlaylists"]) {
			index = data.src.indexOf(".com/p/");
			if(index == -1) return;
			var playlistID = data.src.substring(index + 7);
			index = playlistID.indexOf(".com/p/");
			if(index != -1) playlistID = playlistID.substring(index + 7);
			index = playlistID.search(/\?|&/);
		    if(index != -1) playlistID = playlistID.substring(0,index);
			this.buildVideoIDList(null, playlistID, 0, new Array(), callback);
		}
		return;
	}
    var videoID = data.src.substring(index + 7);
	index = videoID.indexOf(".com/v/");
	if(index != -1) videoID = videoID.substring(index + 7);
    index = videoID.search(/\?|&/);
    if(index != -1) videoID = videoID.substring(0,index);
    this.processElementFromVideoID(videoID, callback);
};

/*YouTubeKiller.prototype.processElementFromPlaylist = function(videoID, plaslistID, callback) {
	var playlistURL = function(i) {
		return "feed://gdata.youtube.com/feeds/api/playlists/" + playlistID + "?start-index=" + (50*i + 1) + "&max-results=50"
	};
	var isEmpty = false;
	var i = 0;
	var req = null;
	while(!isEmpty) {
		req = new XMLHttpRequest();
		req.open('GET', playlistURL(i), true);
		req.onload()
	}
};*/

// this function adds playlist data
YouTubeKiller.prototype.buildVideoIDList = function(flashvars, playlistID, i, videoIDList, callback) {
	req = new XMLHttpRequest();
	req.open('GET', "http://gdata.youtube.com/feeds/api/playlists/" + playlistID + "?start-index=" + (50*i + 1) + "&max-results=50", true);
	var _this = this;
	req.onload = function() {
		//alert(req.responseText);
		var entries = req.responseXML.getElementsByTagName("entry");
		// this is not always the correct number!!
		//if(!imax) imax = parseInt(responseXML.getElementsByTagNameNS("http://a9.com/-/spec/opensearchrss/1.0/", "totalResults")[0].firstChild.nodeValue);
		for(var j = 0; j < entries.length; j++) {
			try{
				videoIDList.push(entries[j].getElementsByTagNameNS("http://search.yahoo.com/mrss/", "player")[0].getAttribute("url").match(/\?v=[^(&|\?)]*(?=(&|\?))/)[0].replace("?v=",""));
			} catch(err) {}
		}
		if(entries.length < 50) {// we've got the whole list of videoIDs
			var track = 0;
			var length = videoIDList.length;
			if(flashvars) {
				var videoID = getFlashVariable(flashvars, "video_id");
				for(var j = 0; j < videoIDList.length; j++) {
					if(videoIDList[0] == videoID) {track = j; break;}
					videoIDList.push(videoIDList.shift());
				}
				//alert(videoIDList.length + " tracks\n\n" + videoIDList.join("\n"));
				// load the first video at once
			}
			var callbackForPlaylist = function(videoData) {
				videoData.playlistLength = length;
				videoData.startTrack = track;
				if(videoData.playlist[0].siteInfo) videoData.playlist[0].siteInfo.url += "&p=" + playlistID;
				callback(videoData);
			};
			if(flashvars) _this.processElementFromFlashVars(flashvars, callbackForPlaylist);
			else _this.processElementFromVideoID(videoIDList[0], callbackForPlaylist);
			videoIDList.shift();
			_this.buildPlaylist(videoIDList, playlistID, true, 3, callback);
			return;
		}
		_this.buildVideoIDList(flashvars, playlistID, ++i, videoIDList, callback);
	};
	// BEGIN DEBUG
    if(safari.extension.settings["debug"]) {
        if(!confirm("Killer '" + this.name + "' is about to send an asynchronous AJAX request to:\n\n" + "http://gdata.youtube.com/feeds/api/playlists/" + playlistID + "?start-index=" + (50*i + 1) + "&max-results=50")) return;
    }
    // END DEBUG
	req.send(null);
};

YouTubeKiller.prototype.buildPlaylist = function(videoIDList, playlistID, isFirst, n, callback) {
	if(videoIDList.length == 0) return;
	var j = 0;
	var jmax = videoIDList.length;
	if(isFirst) --n;
	if(jmax > n) jmax = n; // load by groups of n
	if(isFirst) ++n;
	var mediaData = {"loadAfter": true, "playlist": []};
	var _this = this;
	var next = function(videoData) {
		// this actually works!!
		videoData.playlist[0].siteInfo.url += "&p=" + playlistID;
		mediaData.playlist.push(videoData.playlist[0]);
		++j;
		//alert(mediaData.playlist.length);
		if(j == jmax) {
			callback(mediaData);
			// continue building
			_this.buildPlaylist(videoIDList, playlistID, false, n, callback);
		} else _this.processElementFromVideoID(videoIDList.shift(), next);
	};
	this.processElementFromVideoID(videoIDList.shift(), next);
	return;
};

YouTubeKiller.prototype.getMediaDataFromURLMap = function(videoID, videoHash, urlMap) {
	var availableFormats = [];
    var formatInfo = urlMap.split(",");
    //  alert(formatInfo);
	for (var i = 0; i < formatInfo.length; i++) {
        var format = formatInfo[i].split("|"); 
		availableFormats[format[0]] = format[1];
	}
	
    var posterURL = "http://i.ytimg.com/vi/" + videoID + "/hqdefault.jpg";
    // this is the 360p video URL
	var videoURL = "http://www.youtube.com/get_video?fmt=18&asv=&video_id=" + videoID + "&t=" + videoHash;
	var badgeLabel = "H.264";
    
	// Get the highest-quality version set by the user
	//var format = 18;
    
    //alert(req.responseText);
	// Only 18, 22, 37, and 38 are h264 playable without plugin in Safari.
    // Other container are FLV (0, 5, 6, 34, 35, although the latter two are H.264 360p and 480p), 3GP (13,17), or WebM (43,45) and cannot play natively (even with Perian)
	if (availableFormats[38] && safari.extension.settings["maxresolution"] > 3) {// 4K @_@
        badgeLabel = "4K&nbsp;H.264";
		videoURL = availableFormats[38];
    } else if (availableFormats[37] && safari.extension.settings["maxresolution"] > 2) {// 1080p
        badgeLabel = "HD&nbsp;H.264";
		videoURL = availableFormats[37];
	} else if (availableFormats[22] && safari.extension.settings["maxresolution"] > 1) {// 720p
        badgeLabel = "HD&nbsp;H.264";
		videoURL = availableFormats[22];
	} else if (safari.extension.settings["QTbehavior"] > 2 && canPlayFLV) {
        if (availableFormats[35]) { // 480p FLV
            videoURL = availableFormats[35];
        }
        // fmt 34 is 360p 16:9 most of the time, but there are some videos for which 18 is better than 34.
        /*else if (availableFormats[34]) { // 360p FLV
            videoURL = availableFormats[34];
        }*/
    }
    // What follows can be used in case Youtube breaks the get_video mechanism
    /*else if (availableFormats[18]) {
        videoURL = availableFormats[18];
    } else {
        // Possibility 1: the real hacky stuff! gets the H264 source URL from Youtube's HTML5 beta player if possible, else reverts to Flash
        // this.getSDH264FromHTML5beta(posterURL, videoID, callback); return;
        // Possibility 2: a little simpler and more successful: get H264 source by adding &fmt=18 to the URL
        this.getSDH264FromFmt18(posterURL, videoID, callback); return;
        // NOTE: possibility 2 seems to always work, so possibility 1 is never needed
    }*/
	return {"posterURL": posterURL, "videoURL": videoURL, "badgeLabel": badgeLabel};
};

YouTubeKiller.prototype.processElementFromFlashVars = function(flashvars, callback) {
	var title = unescape(getFlashVariable(flashvars, "rec_title")).substring(3).replace(/\+/g, " ");
    var videoID = getFlashVariable(flashvars, "video_id");
    var videoHash = getFlashVariable(flashvars, "t");
    if(!videoHash) {
        this.processElementFromVideoID(videoID, callback);
        return;
    }
	var urlMap = unescape(getFlashVariable(flashvars, "fmt_url_map"));
    var x = this.getMediaDataFromURLMap(videoID, videoHash, urlMap);
	var videoData = {
        "playlist": [{"title": title, "mediaType": "video", "posterURL": x.posterURL, "mediaURL": x.videoURL}],
        "badgeLabel": x.badgeLabel
    };
    callback(videoData);
};

YouTubeKiller.prototype.processElementFromVideoID = function(videoID, callback) {
	if(!videoID) return; // needed!
    var toMatch = /\"fmt_url_map\":\s\"[^\"]*\"/; //"// works for both Flash and HTML5 Beta player pages
    var toMatch2 = /\"t\":\s\"[^\"]*\"/; //"//
    var _this = this;
    var req = new XMLHttpRequest ();
    req.open("GET", "http://www.youtube.com/watch?v=" + videoID, true);
    req.onload = function() {
		var title = "";
		if(safari.extension.settings["usePlaylists"]) {
			var toMatchTitle = /<meta\sname=\"title\"\scontent=\"[^\"]*\"/;
			var matchTitle = req.responseText.match(toMatchTitle);
			if(matchTitle.length > 0) title = matchTitle[0].replace(/<meta\sname=\"title\"\scontent=/, "").replace(/\"/g,"");
		}
        var matches = req.responseText.match(toMatch);
        var matches2 = req.responseText.match(toMatch2);
        var urlMap = null;
        var videoHash = null;
        if(matches.length > 0) urlMap = matches[0].replace(/\"fmt_url_map\":\s/,"").replace(/\"/g,"").replace(/\\\//g,"/");//"//
        if(matches2.length > 0) videoHash = escape(matches2[0].replace(/\"t\":\s/,"").replace(/\"/g,""));//"//
        //alert(videoHash);
        if(urlMap && videoHash) {
			var x = _this.getMediaDataFromURLMap(videoID, videoHash, urlMap);
			var videoData = {
		        "playlist": [{"title": title, "siteInfo": {"name": "YouTube", "url": "http://www.youtube.com/watch?v=" + videoID}, "mediaType": "video", "posterURL": x.posterURL, "mediaURL": x.videoURL}],
		        "badgeLabel": x.badgeLabel
		    };
		    callback(videoData);
		}
    };
    // BEGIN DEBUG
    if(safari.extension.settings["debug"]) {
        if(!confirm("Killer '" + this.name + "' is about to send an asynchronous AJAX request to:\n\n" + "http://www.youtube.com/watch?v=" + videoID)) return;
    }
    // END DEBUG
    req.send(null);
};

// The following function now doesn't work because apparently the global page
// of an extension cannot access cookies.. sucks
// anyway it's not needed, but it was a nice proof of concept
/*function getSDH264FromHTML5beta(posterURL, videoID, callback) {
    document.cookie = "PREF=" + "f2\=40000000" + "; domain=" + ".youtube.com";
    var toMatch = /setAvailableFormat\(\"[^\"]*\"/; //comment starts here"// fixing some broken syntax highlighting...
    var req = new XMLHttpRequest ();
    req.open("GET", "http://www.youtube.com/watch?v=" + videoID, false);
    alert("sending AJAX request...");
    req.send(null);
    //req.onload=function() {
        alert(req.responseText);
        var match = req.responseText.match(toMatch);
        var url = null;
        if(match) {alert("hey");
            url = match[0].replace("setAvailableFormat(","").replace(/\"/g,"");//"//
            // I believe any H264 video playing in the HTML5 beta player will also
            // appear in flashvars upon adding &fmt=18 to the URL. Therefore,
            // this function should never be called. I put an alert here in case
            // I am mistaken.
            alert("Using H.264 source from HTML5 Beta player");
        } //else { url = getSDH264FromYoutube2(killer, element, callback);}
        //document.cookie = "PREF=" + "; domain=" + ".youtube.com";
        return url;
    //};
}


// this function still works fine, though
YouTubeKiller.prototype.getSDH264FromFmt18 = function(posterURL, videoID, callback) {
    var toMatch = /flashvars=\\\"[^\"]*\\\"/; //"//
    var req = new XMLHttpRequest ();
    req.open("GET", "http://www.youtube.com/watch?v=" + videoID + "&fmt=18", true);
    // BEGIN DEBUG
    if(safari.extension.settings["debug"]) {
        if(!confirm("Killer '" + this.name + "' is about to send an asynchronous AJAX request to:\n\n" + "http://www.youtube.com/watch?v=" + videoID + "&fmt=18")) return;
    }
    // END DEBUG
    req.onload = function() {
        //alert("request sent. Answer is:\n\n" + req.responseText);
        //setTimeout(alert("request sent. Answer is:\n\n" + req.responseText),0);
        //req.overrideMimeType('text/xml');
        //req.onload=function() {
        //alert(req.responseXML);
        //if(req.status != "200") {alert("AJAX request failed"); return;}
        var flashvars = req.responseText.match(toMatch)[0].replace("flashvars=","").replace(/\\\"/g,"");//"//
        var formatInfo = unescape(getFlashVariable(flashvars, "fmt_url_map")).split(",");
        var availableFormats = [];
        var videoURL = null;
        for (var i = 0; i < formatInfo.length; i += 1) {
            var format = formatInfo[i].split("|"); 
            availableFormats[format[0]] = format[1];
        }
        if (availableFormats[18]) {
            videoURL = availableFormats[18];
            //alert("Using H.264 source from fmt=18");
        } //else {// url = null; }
        if(videoURL) {
            var videoData = {
                "posterURL": posterURL,
                "videoURL": videoURL,
                "badgeLabel": "H.264"
            };
            callback(videoData);
        }
    };
    req.send(null);
};*/
