function QTKiller() {}

QTKiller.prototype.canKill = function(data) {
    // streaming does not seem supported by HTML5 video in Safari
    return (data.plugin === "QuickTime" && data.src.substring(0,4) === "http" && (!data.href || data.href.substring(0,4) === "http"));
};


QTKiller.prototype.process = function(data, callback) {
    var isAudio = true;
    var playlist = new Array();
    var addTrack = function(url) {
        var source = {"url": url, "isNative": true, "mediaType": "video"};
        var mediaType = canPlaySrcWithHTML5(url);
        if(mediaType && mediaType.type === "audio") source.mediaType = "audio";
        else isAudio = false;
        playlist.push({"sources": [source]});
    };
    addTrack(data.src);
    if(data.href) addTrack(data.href);
    var videoData = {
        "noPlaylistControls": true,
        "playlist": playlist,
        "isAudio": isAudio
    };
    callback(videoData);
};