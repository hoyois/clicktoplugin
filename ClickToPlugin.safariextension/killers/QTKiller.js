function QTKiller() {}


QTKiller.prototype.canKill = function(data) {
    // streaming does not seem supported by HTML5 video in Safari
    return (data.plugin == "QuickTime" && data.src.substring(0,4) == "http" && (!data.href || data.href.substring(0,4) == "http"));
};


QTKiller.prototype.processElement = function(data, callback) {
    var playlist = [{"mediaType": "video", "sources": [{"url": data.src, "isNative": true}]}];
    if(data.href) playlist.push({"mediaType": "video", "sources": [{"url": data.href, "isNative": true}]});
    var videoData = {
        "noPlaylistControls": true,
        "playlist": playlist
    };
    callback(videoData);
};