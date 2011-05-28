function QTKiller() {}

QTKiller.prototype.canKill = function(data) {
    // streaming does not seem supported by HTML5 video in Safari
    return (data.plugin === "QuickTime" && data.src.substring(0,4) === "http" && (!data.href || data.href.substring(0,4) === "http"));
};


QTKiller.prototype.process = function(data, callback) {
    var isAudio = true;
    var playlist = new Array();
    var addTrack = function(url) {
        var mediaInfo = getMediaInfo(url);
        if(!mediaInfo) return;
        var source = {"url": url, "isNative": mediaInfo.isNative, "mediaType": mediaInfo.type};
        if(mediaInfo.type === "video") isAudio = false;
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