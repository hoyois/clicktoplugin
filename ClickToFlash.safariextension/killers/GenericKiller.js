function GenericKiller() {
    this.name = "GenericKiller";
}

GenericKiller.prototype.canKill = function(data) {
    // streams are not supported
    return (!hasFlashVariable(data.params, "streamer") && (hasFlashVariable(data.params, "file") || hasFlashVariable(data.params, "load") || hasFlashVariable(data.params, "playlistfile") || hasFlashVariable(data.params, "src") || hasFlashVariable(data.params, "mp3")));
};

GenericKiller.prototype.processElement = function(data, callback) {
    var playlistURL = decodeURIComponent(getFlashVariable(data.params, "playlistfile")); // JW player & TS player
    var sourceURL = decodeURIComponent(getFlashVariable(data.params, "file")); // JW player
    if(!sourceURL) sourceURL = decodeURIComponent(getFlashVariable(data.params, "load")); // TS player
    if(!sourceURL) sourceURL = decodeURIComponent(getFlashVariable(data.params, "src")); // generic player
    if(!sourceURL) sourceURL = decodeURIComponent(getFlashVariable(data.params, "mp3"));
    
    // Playlist support
    if(safari.extension.settings["usePlaylists"]) {
        if(playlistURL) {
            this.processElementFromPlaylist(playlistURL, data.baseURL, decodeURIComponent(getFlashVariable(data.params, "image")), getFlashVariable(data.params, "item"), callback);
            return;
        }
        if(hasExt("xml", sourceURL)) {
            this.processElementFromPlaylist(sourceURL, data.baseURL, decodeURIComponent(getFlashVariable(data.params, "image")), getFlashVariable(data.params, "item"), callback);
            return;
        }
    }
    
    var sourceURL2 = getFlashVariable(data.params, "real_file");
    if(sourceURL2) sourceURL = decodeURIComponent(sourceURL2);
    
    var mediaType = willPlaySrcWithHTML5(sourceURL);
    if(!mediaType) return;
    var isAudio = mediaType == "audio";

    var mediaData = {
        "playlist": [{"mediaType": mediaType, "posterURL": decodeURIComponent(getFlashVariable(data.params, "image")), "mediaURL": sourceURL}],
        "badgeLabel": isAudio ? "Audio" : "Video",
        "isAudio": isAudio
    };
    callback(mediaData);
};

GenericKiller.prototype.processElementFromPlaylist = function(playlistURL, baseURL, posterURL, track, callback) {
    var handlePlaylistData = function(playlistData) {
        playlistData.badgeLabel = playlistData.playlist[0].mediaType == "audio" ? "Audio" : "Video";
        callback(playlistData);
    };
    
    playlistURL = makeAbsoluteURL(playlistURL, baseURL);
    parseXSPFPlaylist(playlistURL, posterURL, track, handlePlaylistData);
};

