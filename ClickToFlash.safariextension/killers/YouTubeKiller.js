function YouTubeKiller() {
    this.name = "YouTubeKiller";
}

YouTubeKiller.prototype.canKill = function(data) {
    if(data.src.indexOf("ytimg.com/") != -1) {data.onsite = true; return true;}
    if(data.src.indexOf("youtube.com/") != -1) {data.onsite = false; return true;}
    return false;
};

YouTubeKiller.prototype.processElement = function(data, callback) {
    if(data.onsite) {
        if(safari.extension.settings["usePlaylists"]) {
            var URLvars = data.location.split(/#!|\?/)[1];
            var playlistID = null;
            if(URLvars) {
                URLvars = URLvars.split("&");
                for (var i = 0; i < URLvars.length; i++) {
                    var keyValuePair = URLvars[i].split("="); 
                    if (keyValuePair[0] === "p") {
                        playlistID = keyValuePair[1];
                        break;
                    } else if (keyValuePair[0] === "list" && /^PL/.test(keyValuePair[1])) {
                        playlistID = keyValuePair[1].substring(2);
                        break;
                    }
                }
            }
            if(playlistID) {
                this.buildVideoIDList(data.params, data.title, data.location, playlistID, 0, new Array(), callback);
            } else this.processElementFromFlashVars(data.params, data.title, data.location, callback);
        } else this.processElementFromFlashVars(data.params, data.title, data.location, callback);
        return;
    }
    // Embedded YT video
    var matches = data.src.match(/\.com\/([vp])\/([^&?]+)(?:[&?]|$)/);
    if(matches) {
        if(matches[1] == "v") { // video
            this.processElementFromVideoID(matches[2], callback);
        } else { // playlist
            this.buildVideoIDList(false, data.title, data.location, matches[2], 0, new Array(), callback);
        }
    }
};

YouTubeKiller.prototype.buildVideoIDList = function(flashvars, documentTitle, location, playlistID, i, videoIDList, callback) {
    xhr = new XMLHttpRequest();
    xhr.open('GET', "http://gdata.youtube.com/feeds/api/playlists/" + playlistID + "?start-index=" + (50*i + 1) + "&max-results=50", true);
    var _this = this;
    xhr.onload = function() {
        var entries = xhr.responseXML.getElementsByTagName("entry");
        for(var j = 0; j < entries.length; j++) {
            try{ // being lazy
                videoIDList.push(entries[j].getElementsByTagNameNS("http://search.yahoo.com/mrss/", "player")[0].getAttribute("url").match(/\?v=([^&?']+)[&?']/)[1]);
            } catch(err) {}
        }
        var links = xhr.responseXML.getElementsByTagName("link");
        for(var j = 0; j < links.length; j++) {
            if(links[j].getAttribute("rel") == "next") {
                _this.buildVideoIDList(flashvars, documentTitle, location, playlistID, ++i, videoIDList, callback);
                return;
            }
        }
        // We've got the whole list of videoIDs
        var track = 0;
        var length = videoIDList.length;
        if(flashvars) {
            var videoID = getFlashVariable(flashvars, "video_id");
            if(!videoID) { // new YT AJAX player
                var matches = location.match(/[!&]v=([^&]+)(?:&|$)/);
                if(!matches) return;
                videoID = matches[1];
                flashvars = null;
            }
            for(var j = 0; j < videoIDList.length; j++) {
                if(videoIDList[0] == videoID) {track = j; break;}
                videoIDList.push(videoIDList.shift());
            }
        }
        var callbackForPlaylist = function(videoData) {
            videoData.playlistLength = length;
            videoData.startTrack = track;
            if(videoData.playlist[0].siteInfo) videoData.playlist[0].siteInfo.url += "&p=" + playlistID;
            callback(videoData);
        };
        // load the first video at once
        if(flashvars) _this.processElementFromFlashVars(flashvars, documentTitle, location, callbackForPlaylist);
        else _this.processElementFromVideoID(videoIDList[0], callbackForPlaylist);
        videoIDList.shift();
        // load the rest of the playlist 3 by 3
        _this.buildPlaylist(videoIDList, playlistID, true, 3, callback);
    };
    xhr.send(null);
};

YouTubeKiller.prototype.buildPlaylist = function(videoIDList, playlistID, isFirst, n, callback) {
    if(videoIDList.length == 0) return;
    var j = 0;
    var jmax = videoIDList.length;
    if(isFirst) {if(jmax > n-1) jmax = n-1;}
    else {if(jmax > n) jmax = n;} // load by groups of n
    var mediaData = {"loadAfter": true, "missed": 0, "playlist": []};
    var _this = this;
    var next = function(videoData) {
        // this actually works!!
        if(videoData.playlist.length > 0) {
            videoData.playlist[0].siteInfo.url += "&p=" + playlistID;
            mediaData.playlist.push(videoData.playlist[0]);
        } else { // playlist is 1 shorter than announced
            ++mediaData.missed;
        }
        ++j;
        if(j == jmax) {
            callback(mediaData);
            _this.buildPlaylist(videoIDList, playlistID, false, n, callback);
        } else _this.processElementFromVideoID(videoIDList.shift(), next);
    };
    this.processElementFromVideoID(videoIDList.shift(), next);
    return;
};

YouTubeKiller.prototype.getMediaDataFromURLMap = function(videoID, videoHash, urlMap) {
    var availableFormats = [];
    var formatInfo = urlMap.split(",");
    for (var i = 0; i < formatInfo.length; i++) {
        var format = formatInfo[i].split("|"); 
        availableFormats[format[0]] = format[1];
    }
    
    var posterURL = "http://i.ytimg.com/vi/" + videoID + "/hqdefault.jpg";
    // this is the 360p MP4 video URL, (almost) always available
    var videoURL = "http://www.youtube.com/get_video?fmt=18&asv=&video_id=" + videoID + "&t=" + videoHash;
    var badgeLabel = "H.264";
    
    /*
    Only 18, 22, 37, and 38 are MP4 playable nativey by QuickTime.
    Other containers are FLV (0, 5, 6, 34, 35, the latter two are H.264 360p and 480p),
    3GP (13,17), or WebM (43,45)
    */
    if(availableFormats[38] && safari.extension.settings["maxresolution"] > 3) {// 4K @_@
        badgeLabel = "4K&nbsp;H.264";
        videoURL = availableFormats[38];
    } else if(availableFormats[37] && safari.extension.settings["maxresolution"] > 2) {// 1080p
        badgeLabel = "HD&nbsp;H.264";
        videoURL = availableFormats[37];
    } else if(availableFormats[22] && safari.extension.settings["maxresolution"] > 1) {// 720p
        badgeLabel = "HD&nbsp;H.264";
        videoURL = availableFormats[22];
    } else if(availableFormats[35] && safari.extension.settings["maxresolution"] > 0 && safari.extension.settings["QTbehavior"] > 2 && canPlayFLV) {// 480p FLV
        videoURL = availableFormats[35];
    } else if(availableFormats[18]) {// <=360p
        videoURL = availableFormats[18];
    }
    return {"posterURL": posterURL, "videoURL": videoURL, "badgeLabel": badgeLabel};
};

YouTubeKiller.prototype.processElementFromFlashVars = function(flashvars, documentTitle, location, callback) {
    var videoID = getFlashVariable(flashvars, "video_id");
    // see http://apiblog.youtube.com/2010/03/upcoming-change-to-youtube-video-page.html:
    if(!videoID) { // new YT AJAX player (not yet used?)
        var matches = location.match(/[!&]v=([^&]+)(?:&|$)/);
        if(!matches) return;
        videoID = matches[1];
        this.processElementFromVideoID(videoID, callback);
        return;
    }
    var videoHash = getFlashVariable(flashvars, "t");
    if(!videoHash) { // channel page
        this.processElementFromVideoID(videoID, callback);
        return;
    }
    var urlMap = decodeURIComponent(getFlashVariable(flashvars, "fmt_url_map"));
    if(!urlMap) return;
    var title = decodeURIComponent(getFlashVariable(flashvars, "rec_title"));
    if(title) title = title.substring(4).replace(/\+/g, " ");
    else if(/^YouTube\s-\s/.test(documentTitle)) title = documentTitle.substring(10);
    
    this.finalizeProcessing(videoID, videoHash, urlMap, title, false, callback);
};

YouTubeKiller.prototype.processElementFromVideoID = function(videoID, callback) {
    if(!videoID) return; // needed!?
    var urlMapMatch = /\"fmt_url_map\":\s\"([^"]*)\"/; // works for both Flash and HTML5 Beta player pages
    var hashMatch = /\"t\":\s\"([^"]*)\"/;
    //var titleMatch = /\"rec_title\":\s\"Re:\s((?:\\\"|[^"])*)\"/; // not always available
    var titleMatch = /document\.title\s=\s'YouTube\s-\s((?:\\'|[^'])*)'/;
    var _this = this;
    var xhr = new XMLHttpRequest ();
    xhr.open("GET", "http://www.youtube.com/watch?v=" + videoID, true);
    xhr.onload = function() {
        var matches, title, urlMap, videoHash;
        matches = xhr.responseText.match(titleMatch);
        if(matches) title = matches[1].replace(/\\["'\/\\]/g, function(s){return s.charAt(1);});
        matches = xhr.responseText.match(urlMapMatch);
        if(matches) urlMap = matches[1].replace(/\\\//g,"/");
        matches = xhr.responseText.match(hashMatch);
        if(matches) videoHash = encodeURIComponent(matches[1]);
        
        if(urlMap && videoHash) {
            _this.finalizeProcessing(videoID, videoHash, urlMap, title, true, callback);
        } else { // happens if YT just removed content and didn't update its playlists yet
            callback({"playlist": []});
        }
    };
    xhr.send(null);
};

YouTubeKiller.prototype.finalizeProcessing = function(videoID, videoHash, urlMap, title, isEmbed, callback) {
    var x = this.getMediaDataFromURLMap(videoID, videoHash, urlMap);
    var downloadTitle = escape(title); // using escape here because YT needs latin1, and it cannot handle other Unicode chars anyway
    if(/%u/.test(downloadTitle)) downloadTitle = ""; // revert to 'videoplayback' if the title will be garbled
    var videoData = {
        "playlist": [{"title": title, "mediaType": "video", "posterURL": x.posterURL, "mediaURL": x.videoURL + "&title=" + downloadTitle}],
        "badgeLabel": x.badgeLabel
    };
    if(isEmbed) videoData.playlist[0].siteInfo = {"name": "YouTube", "url": "http://www.youtube.com/watch?v=" + videoID};
    callback(videoData);
};

