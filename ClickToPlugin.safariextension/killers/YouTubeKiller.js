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
        if(/\s-\sYouTube$/.test(data.title)) flashvars.title = data.title.slice(1, -12);
        
        var videoID = flashvars.video_id;
        if(!videoID) { // YouTube AJAX player
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

YouTubeKiller.prototype.processFromFlashVars = function(flashvars, callback) {
    if(!flashvars.url_encoded_fmt_stream_map) return;
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
            sources.push({"url": videoURL, "format": "4K MP4", "resolution": 2304, "isNative": true, "mediaType": "video"});
        } else if(x.itag === "37") {
            sources.push({"url": videoURL, "format": "1080p MP4", "resolution": 1080, "isNative": true, "mediaType": "video"});
        } else if(x.itag === "22") {
            sources.push({"url": videoURL, "format": "720p MP4", "resolution": 720, "isNative": true, "mediaType": "video"});
        } else if(x.itag === "18") {
            sources.push({"url": videoURL, "format": "360p MP4", "resolution": 360, "isNative": true, "mediaType": "video"});
        } else if(x.itag === "35" && canPlayFLV) {
            sources.push({"url": videoURL, "format": "480p FLV", "resolution": 480, "isNative": false, "mediaType": "video"});
        } else if(x.itag === "34" && canPlayFLV) {
            sources.push({"url": videoURL, "format": "360p FLV", "resolution": 360, "isNative": false, "mediaType": "video"});
        } else if(x.itag === "5" && canPlayFLV) {
            sources.push({"url": videoURL, "format": "240p FLV", "resolution": 240, "isNative": false, "mediaType": "video"});
        } /*else if(x.itag === "45" && canPlayWebM) {
            sources.push({"url": videoURL, "format": "720p WebM", "resolution": 720, "isNative": false, "mediaType": "video"});
        } else if(x.itag === "44" && canPlayWebM) {
            sources.push({"url": videoURL, "format": "480p WebM", "resolution": 480, "isNative": false, "mediaType": "video"});
        } else if(x.itag === "43" && canPlayWebM) {
            sources.push({"url": videoURL, "format": "360p WebM", "resolution": 360, "isNative": false, "mediaType": "video"});
        }*/
    }
    
    var posterURL;
    if(flashvars.iurlmaxres) posterURL = decodeURIComponent(flashvars.iurlmaxres);
    else if(flashvars.iurlsd) posterURL = decodeURIComponent(flashvars.iurlsd);
    else posterURL = "https://i.ytimg.com/vi/" + flashvars.video_id + "/hqdefault.jpg";
        
    var videoData = {
        "playlist": [{"title": flashvars.title, "posterURL": posterURL, "sources": sources}]
    };
    callback(videoData);
};

YouTubeKiller.prototype.processFromVideoID = function(videoID, callback) {
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
            _this.processFromFlashVars(flashvars, callbackForEmbed);
        } else { // happens if YT just removed content and didn't update its playlists yet
            callback({"playlist": []});
        }
    };
    xhr.send(null);
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

