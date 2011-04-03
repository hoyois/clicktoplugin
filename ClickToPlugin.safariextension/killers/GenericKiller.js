function GenericKiller() {}

GenericKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    var matches = data.params.match(/(?:^|&)(file|load|playlistfile|src|mp3|mp3url|soundFile|url|file_url)=/);
    if(matches) {data.file = matches[1]; return true;}
    // other video flashvars: wmvUrl/flvUrl (gvideoplayer.swf)
    matches = data.src.match(/[?&](file|mp3|playlist_url)=/);
    if(matches) {data.hash = matches[1]; return true;}
    return false;
};

GenericKiller.prototype.process = function(data, callback) {
    var flashvars = parseFlashVariables(data.params);
    if(flashvars.streamer && flashvars.streamer.substring(0,4) === "rtmp") return;
    var baseURL = data.src; // used to resolve video URLs
    if(flashvars.netstreambasepath) baseURL = decodeURIComponent(flashvars.netstreambasepath);
    
    // get media and poster URL
    var sourceURL, posterURL;
    if(data.file) {
        sourceURL = decodeURIComponent(flashvars[data.file]);
        switch(data.file) {
            case "file_url":
                if(flashvars.poster_url) posterURL = decodeURIComponent(flashvars.poster_url);
                break;
            default:
                if(flashvars.image) posterURL = decodeURIComponent(flashvars.image);
        }
    } else {
        sourceURL = data.src.match(new RegExp("[?&]" + data.hash + "=([^&]*)"));
        if(sourceURL) {
            sourceURL = decodeURIComponent(sourceURL[1]);
            posterURL = data.src.match(/[?&]image=([^&]*)/);
            if(posterURL) posterURL = decodeURIComponent(posterURL[1]);
        }
    }
    
    if(!sourceURL) return;
    var isPlaylist = data.file === "playlistfile" || data.hash === "playlist_url" || hasExt("xml|xspf", sourceURL);
    
    // Site-specific decoding
    if(/player_mp3_maxi\.swf$/.test(data.src)) sourceURL = sourceURL.replace(/\+/g, "%20");
    
    // Playlist support
    if(isPlaylist) {
        if(!safari.extension.settings.usePlaylists) return;
        this.processFromPlaylist(makeAbsoluteURL(sourceURL, data.baseURL), baseURL, posterURL, flashvars.item, callback);
        return;
    }
    
    var sourceURL2 = flashvars.real_file;
    if(sourceURL2) sourceURL = decodeURIComponent(sourceURL2);
    sourceURL2 = flashvars["hd.file"];
    
    var sources = new Array();
    if(sourceURL2) {
        var mediaType = canPlaySrcWithHTML5(sourceURL2);
        if(mediaType) sources.push({"url": makeAbsoluteURL(sourceURL2, baseURL), "format": "HD", "isNative": m.isNative, "resolution": 720, "mediaType": mediaType.type});
    }
    
    mediaType = canPlaySrcWithHTML5(sourceURL);
    if(mediaType) sources.push({"url": makeAbsoluteURL(sourceURL, baseURL), "format": sources[0] ? "SD" : "", "isNative": mediaType.isNative, "mediaType": mediaType.type});
    
    var mediaData = {
        "playlist": [{"posterURL": posterURL, "sources": sources}],
        "isAudio": mediaType.type === "audio"
    };
    callback(mediaData);
};

GenericKiller.prototype.processFromPlaylist = function(playlistURL, baseURL, posterURL, track, callback) {
    var handlePlaylistData = function(playlistData) {
        callback(playlistData);
    };
    parseXSPFPlaylist(playlistURL, baseURL, posterURL, track, handlePlaylistData);
};

