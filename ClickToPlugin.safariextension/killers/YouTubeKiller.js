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
        if(safari.extension.settings.usePlaylists) {
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
                this.buildVideoIDList(flashvars, data.title, data.location, playlistID, 0, new Array(), callback);
            } else this.processFromFlashVars(flashvars, data.title, data.location, callback);
        } else this.processFromFlashVars(flashvars, data.title, data.location, callback);
        return;
    }
    // Embedded YT video
    var matches = data.src.match(/\.com\/([vpe])\/([^&?]+)/);
    if(matches) {
        if(matches[1] === "v" || matches[1] === "e") { // video
            this.processFromVideoID(matches[2], callback);
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
            if(links[j].getAttribute("rel") === "next") {
                _this.buildVideoIDList(flashvars, documentTitle, location, playlistID, ++i, videoIDList, callback);
                return;
            }
        }
        // We've got the whole list of videoIDs
        var track = 0;
        var length = videoIDList.length;
        if(flashvars) {
            var videoID = flashvars.video_id;
            if(!videoID) { // new YT AJAX player
                var matches = location.match(/[!&]v=([^&]+)/);
                if(!matches) return;
                videoID = matches[1];
                flashvars = null;
            }
            for(var j = 0; j < videoIDList.length; j++) {
                if(videoIDList[0] === videoID) {track = j; break;}
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
        if(flashvars) _this.processFromFlashVars(flashvars, documentTitle, location, callbackForPlaylist);
        else _this.processFromVideoID(videoIDList[0], callbackForPlaylist);
        videoIDList.shift();
        // load the rest of the playlist 3 by 3
        _this.buildPlaylist(videoIDList, playlistID, true, 3, callback);
    };
    xhr.send(null);
};

YouTubeKiller.prototype.buildPlaylist = function(videoIDList, playlistID, isFirst, n, callback) {
    if(videoIDList.length === 0) return;
    var j = 0;
    var jmax = videoIDList.length;
    if(isFirst) {if(jmax > n-1) jmax = n-1;}
    else {if(jmax > n) jmax = n;} // load by groups of n
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
        ++j;
        if(j === jmax) {
            callback(mediaData);
            _this.buildPlaylist(videoIDList, playlistID, false, n, callback);
        } else _this.processFromVideoID(videoIDList.shift(), next);
    };
    this.processFromVideoID(videoIDList.shift(), next);
    return;
};

YouTubeKiller.prototype.processFromFlashVars = function(flashvars, documentTitle, location, callback) {
    var videoID = flashvars.video_id;
    // see http://apiblog.youtube.com/2010/03/upcoming-change-to-youtube-video-page.html:
    if(!videoID) { // new YT AJAX player (not yet used?)
        var matches = location.match(/[!&]v=([^&]+)/);
        if(!matches) return;
        videoID = matches[1];
        this.processFromVideoID(videoID, callback);
        return;
    }
    
    if(!flashvars.t) { // channel page
        this.processFromVideoID(videoID, callback);
        return;
    }
    if(!flashvars.fmt_url_map) return;
    var urlMap = decodeURIComponent(flashvars.fmt_url_map);
    var title;
    if(flashvars.rec_title) title = decodeURIComponent(flashvars.rec_title).substring(4).replace(/\+/g, " ");
    else if(/^YouTube\s-\s/.test(documentTitle)) title = documentTitle.substring(10);
    
    this.finalizeProcessing(videoID, urlMap, title, false, callback);
};

YouTubeKiller.prototype.processFromVideoID = function(videoID, callback) {
    if(!videoID) return; // needed!?
    var urlMapMatch = /\"fmt_url_map\":\s\"([^"]*)\"/; // works for both Flash and HTML5 Beta player pages
    var titleMatch = /document\.title\s=\s'YouTube\s-\s('?)(.*)/;
    var _this = this;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://www.youtube.com/watch?v=" + videoID, true);
    xhr.onload = function() {
        var matches, title, urlMap;
        matches = xhr.responseText.match(titleMatch);
        if(matches) {
            title = matches[2].replace(/\\["'\/\\]/g, function(s){return s.charAt(1);});
            title = parseUnicode(title.substring(matches[1] ? 4 : 0, title.length - 2));
        }
        matches = xhr.responseText.match(urlMapMatch);
        if(matches) urlMap = parseUnicode(matches[1].replace(/\\\//g,"/"));
        
        if(urlMap) {
            _this.finalizeProcessing(videoID, urlMap, title, true, callback);
        } else { // happens if YT just removed content and didn't update its playlists yet
            callback({"playlist": []});
        }
    };
    xhr.send(null);
};

YouTubeKiller.prototype.finalizeProcessing = function(videoID, urlMap, title, isEmbed, callback) {
    var downloadTitle = escape(title); // using escape here because YT needs latin1, and it cannot handle other Unicode chars anyway
    if(/%u/.test(downloadTitle)) downloadTitle = ""; // revert to 'videoplayback' if the title will be garbled (WTF youtube?)
    
    var sources = new Array(); // all playable video sources
        
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
    if(isEmbed) videoData.playlist[0].siteInfo = {"name": "YouTube", "url": "http://www.youtube.com/watch?v=" + videoID};
    callback(videoData);
};

