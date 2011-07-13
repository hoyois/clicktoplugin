function YouTubeKiller() {}

YouTubeKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    if(data.src.indexOf("ytimg.com/") !== -1) {data.onsite = true; return true;}
    if(data.src.search(/youtube(-nocookie)?\.com\//) !== -1) {data.onsite = false; return true;}
    return false;
};

YouTubeKiller.prototype.process = function(data, callback) {
    if(data.onsite) {
        var flashvars = parseFlashVariables(data.params);
        flashvars.title = data.title;
        flashvars.location = data.location;
        
        var videoID = flashvars.video_id;
        if(!videoID) { // new YouTube AJAX player
            var match = data.location.match(/[!&]v=([^&]+)/);
            if(!match) return;
            videoID = match[1];
            flashvars = false;
        }
        if(!flashvars.t) flashvars = false; // channel page
        
        if(safari.extension.settings.usePlaylists) {
            var match = data.location.match(/(?:^|&)(?:p=|list=PL)([^&]+)/);
            if(match) {
                this.processFromPlaylistID(match[1], videoID, flashvars, callback);
                return;
            }
        }
        
        if(flashvars) this.processFromFlashVars(flashvars, callback);
        else this.processFromVideoID(videoID, callback);
        return;
    }
    
    // Embedded YT video
    var match = data.src.match(/\.com\/([vpe])\/([^&?]+)/);
    if(match) {
        if(match[1] === "v" || match[1] === "e") { // video
            this.processFromVideoID(match[2], callback);
        } else { // playlist
            this.processFromPlaylistID(match[2], false, false, callback);
        }
    }
};

YouTubeKiller.prototype.processFromPlaylistID = function(playlistID, videoID, flashvars, callback) {
    var _this = this;
    var processList = function(list) {
        var track = 0;
        var length = list.length;
        if(videoID) { // shift list so that videoID is first
            for(var i = 0; i < length; i++) {
                if(list[0] === videoID) {track = i; break;}
                list.push(list.shift());
            }
        }
        
        var callbackForPlaylist = function(videoData) {
            videoData.playlistLength = length;
            videoData.startTrack = track;
            if(videoData.playlist[0].siteInfo) videoData.playlist[0].siteInfo.url += "&p=" + playlistID;
            callback(videoData);
        };
        // load the first video at once
        if(flashvars) _this.processFromFlashVars(flashvars, callbackForPlaylist);
        else _this.processFromVideoID(list[0], callbackForPlaylist);
        list.shift();
        // load the rest of the playlist 3 by 3
        _this.buildPlaylist(playlistID, list, 3, callback);
    };
    this.buildVideoIDList(playlistID, 1, new Array(), processList);
};

YouTubeKiller.prototype.buildVideoIDList = function(playlistID, startIndex, videoIDList, processList) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://gdata.youtube.com/feeds/api/playlists/" + playlistID + "?start-index=" + startIndex + "&max-results=50", true);
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
                _this.buildVideoIDList(playlistID, startIndex + 50, videoIDList, processList);
                return;
            }
        }
        // If we're here we reached the end of the list
        processList(videoIDList);
    };
    xhr.send(null);
};

YouTubeKiller.prototype.buildPlaylist = function(playlistID, videoIDList, n, callback) {
    if(videoIDList.length === 0) return;
    var i = 0;
    var imax = videoIDList.length;
    if(imax > n) imax = n; // load by groups of n
    var mediaData = {"loadAfter": true, "missed": 0, "playlist": []};
    var _this = this;
    var next = function(videoData) {
        // this actually works!! feels like TeXing...
        if(videoData.playlist.length > 0) {
            videoData.playlist[0].siteInfo.url += "&p=" + playlistID;
            mediaData.playlist.push(videoData.playlist[0]);
        } else { // playlist is 1 shorter than announced
            ++mediaData.missed;
        }
        ++i;
        if(i === imax) {
            callback(mediaData);
            _this.buildPlaylist(playlistID, videoIDList, n, callback);
        } else _this.processFromVideoID(videoIDList.shift(), next);
    };
    this.processFromVideoID(videoIDList.shift(), next);
    return;
};

YouTubeKiller.prototype.processFromFlashVars = function(flashvars, callback) {
    if(!flashvars.fmt_url_map) return;
    var urlMap = decodeURIComponent(flashvars.fmt_url_map);
    var title;
    if(flashvars.rec_title) title = decodeURIComponent(flashvars.rec_title).substring(4).replace(/\+/g, " ");
    else if(/^YouTube\s-\s/.test(flashvars.title)) title = flashvars.title.slice(11, -2);

    this.finalizeProcessing(flashvars.video_id, urlMap, title, callback);
};

YouTubeKiller.prototype.processFromVideoID = function(videoID, callback) {
    var urlMapMatch = /\"fmt_url_map\":\s\"([^"]*)/; // works for both Flash and HTML5 Beta player pages
    var titleMatch = /<meta name=\"title\" content=\"([^"]*)\">/;
    var _this = this;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://www.youtube.com/watch?v=" + videoID, true);
    xhr.onload = function() {
        var matches, title, urlMap;
        matches = xhr.responseText.match(titleMatch);
        if(matches) {
            title = unescapeHTML(matches[1]);
        }
        matches = xhr.responseText.match(urlMapMatch);
        if(matches) urlMap = parseUnicode(matches[1].replace(/\\\//g,"/"));
        
        if(urlMap) {
            var callbackForEmbed = function(videoData) {
                videoData.playlist[0].siteInfo = {"name": "YouTube", "url": "http://www.youtube.com/watch?v=" + videoID};
                callback(videoData);
            };
            _this.finalizeProcessing(videoID, urlMap, title, callbackForEmbed);
        } else { // happens if YT just removed content and didn't update its playlists yet
            callback({"playlist": []});
        }
    };
    xhr.send(null);
};

YouTubeKiller.prototype.finalizeProcessing = function(videoID, urlMap, title, callback) {
    var downloadTitle = escape(title); // using escape here because YT needs latin1, and it cannot handle other Unicode chars anyway
    if(/%u/.test(downloadTitle)) downloadTitle = ""; // revert to 'videoplayback' if the title will be garbled (WTF youtube?)
    
    var sources = new Array();
    
    /*
    Only 18, 22, 37, and 38 are MP4 playable natively by QuickTime.
    Other containers are FLV (5, 34, 35, the latter two are H.264 360p and 480p),
    3GP (17), or WebM (43,45) [17,43,45 do not appear in the flashvars!]
    */
    var formatList = urlMap.split(",");
    for(var i = 0; i < formatList.length; i++) {
        var x = formatList[i].split("|");
        if(x[0] === "38") {
            sources.push({"url": x[1] + "&title=" + downloadTitle, "format": "4K MP4", "resolution": 2304, "isNative": true, "mediaType": "video"});
        } else if(x[0] === "37") {
            sources.push({"url": x[1] + "&title=" + downloadTitle, "format": "1080p MP4", "resolution": 1080, "isNative": true, "mediaType": "video"});
        } else if(x[0] === "22") {
            sources.push({"url": x[1] + "&title=" + downloadTitle, "format": "720p MP4", "resolution": 720, "isNative": true, "mediaType": "video"});
        } else if(x[0] === "18") {
            sources.push({"url": x[1] + "&title=" + downloadTitle, "format": "360p MP4", "resolution": 360, "isNative": true, "mediaType": "video"});
        } else if(x[0] === "35" && canPlayFLV) {
            sources.push({"url": x[1] + "&title=" + downloadTitle, "format": "480p FLV", "resolution": 480, "isNative": false, "mediaType": "video"});
        } else if(x[0] === "34" && canPlayFLV) {
            sources.push({"url": x[1] + "&title=" + downloadTitle, "format": "360p FLV", "resolution": 360, "isNative": false, "mediaType": "video"});
        } else if(x[0] === "5" && canPlayFLV) {
            sources.push({"url": x[1] + "&title=" + downloadTitle, "format": "240p FLV", "resolution": 240, "isNative": false, "mediaType": "video"});
        }
    }
    
    // var videoURL = "http://www.youtube.com/get_video?fmt=18&asv=&video_id=" + videoID + "&t=" + videoHash; 
    
    var posterURL = "http://i.ytimg.com/vi/" + videoID + "/hqdefault.jpg";
    var videoData = {
        "playlist": [{"title": title, "posterURL": posterURL, "sources": sources}]
    };
    callback(videoData);
};

