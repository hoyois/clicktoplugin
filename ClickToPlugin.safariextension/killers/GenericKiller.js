function GenericKiller() {}

GenericKiller.prototype.canKill = function(data) {
    if(data.plugin != "Flash") return false;
    if(hasFlashVariable(data.params, "file")) {data.file = "file"; return true;}
    if(hasFlashVariable(data.params, "load")) {data.file = "load"; return true;}
    if(hasFlashVariable(data.params, "playlistfile")) {data.playlist = "playlistfile"; return true;}
    if(hasFlashVariable(data.params, "src")) {data.file = "src"; return true;}
    if(hasFlashVariable(data.params, "mp3")) {data.file = "mp3"; return true;}
    if(hasFlashVariable(data.params, "soundFile")) {data.file = "soundFile"; return true;}
    if(hasFlashVariable(data.params, "url")) {data.file = "url"; return true;}
    if(hasFlashVariable(data.params, "file_url")) {data.file = "file_url"; return true;}
    // other video flashvars: wmvUrl/flvUrl (gvideoplayer.swf)
    if(/[?&]file=/.test(data.src)) return true;
    return false;
};

GenericKiller.prototype.processElement = function(data, callback) {
    if(getFlashVariable(data.params, "streamer").substring(0,4) === "rtmp") return;
    var baseURL = decodeURIComponent(getFlashVariable(data.params, "netstreambasepath"));
    if(!baseURL) baseURL = data.src; // to resolve video URLs
    
    var sources = new Array();
    var playlistURL = decodeURIComponent(getFlashVariable(data.params, data.playlist)); // JW player & TS player
    var sourceURL = decodeURIComponent(getFlashVariable(data.params, data.file));
    if(!sourceURL) {
        sourceURL = data.src.match(/[?&]file=([^&]*)(?:&|$)/);
        if(sourceURL) sourceURL = decodeURIComponent(sourceURL[1]);
        else return;
    }
    // Site-specific decoding
    if(/player_mp3_maxi\.swf$/.test(data.src)) sourceURL = sourceURL.replace(/\+/g, "%20");
    
    var posterURL;
    switch(data.file) {
        case "file_url":
            posterURL = decodeURIComponent(getFlashVariable(data.params, "poster_url"));
            break;
        default:
            posterURL = decodeURIComponent(getFlashVariable(data.params, "image"));
    }
    // other image flashvars: sScreenshotUrl (gvideoplayer.swf), thumbnail (?)
    if(!posterURL) {
        posterURL = data.src.match(/[?&]image=([^&]*)(?:&|$)/);
        if(posterURL) posterURL = decodeURIComponent(posterURL[1]);
    }
    
    // Playlist support
    if(safari.extension.settings.usePlaylists) {
        // playlist URLs are resolved wrt HTML, while video URLs (even within playlists) are resolved wrt the SWF...
        if(playlistURL) {
            this.processElementFromPlaylist(makeAbsoluteURL(playlistURL, data.baseURL), baseURL, posterURL, getFlashVariable(data.params, "item"), callback);
            return;
        }
        if(hasExt("xml", sourceURL)) {
            this.processElementFromPlaylist(makeAbsoluteURL(sourceURL, data.baseURL), baseURL, posterURL, getFlashVariable(data.params, "item"), callback);
            return;
        }
    }
    
    var sourceURL2 = getFlashVariable(data.params, "real_file");
    if(sourceURL2) sourceURL = decodeURIComponent(sourceURL2);
    
    var mediaType = canPlaySrcWithHTML5(sourceURL);
    if(!mediaType) return;
    
    sourceURL2 = getFlashVariable(data.params, "hd.file");
    if(sourceURL2) {
        var m = canPlaySrcWithHTML5(sourceURL2);
        if(m) sources.push({"url": makeAbsoluteURL(sourceURL2, baseURL), "format": "HD", "isNative": m.isNative, "resolution": 720});
    }
    
    sources.push({"url": makeAbsoluteURL(sourceURL, baseURL), "format": sources[0] ? "SD" : "", "isNative": mediaType.isNative});
    
    var mediaData = {
        "playlist": [{"mediaType": mediaType.type, "posterURL": posterURL, "sources": sources}],
        "isAudio": mediaType.type === "audio"
    };
    callback(mediaData);
};

GenericKiller.prototype.processElementFromPlaylist = function(playlistURL, baseURL, posterURL, track, callback) {
    var handlePlaylistData = function(playlistData) {
        callback(playlistData);
    };
    parseXSPFPlaylist(playlistURL, baseURL, posterURL, track, handlePlaylistData);
};

