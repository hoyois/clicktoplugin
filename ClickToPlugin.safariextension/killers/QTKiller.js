function QTKiller() {}

QTKiller.prototype.canKill = function(data) {
    // streaming does not seem supported by HTML5 video in Safari
    return (data.plugin === "QuickTime" && data.src.substring(0,4) === "http" && (!data.href || data.href.substring(0,4) === "http"));
};


QTKiller.prototype.process = function(data, callback) {
    var playlist = [{"sources": [{"url": data.src, "isNative": true, "mediaType": "video"}]}];
    if(data.href) playlist.push({"sources": [{"url": data.href, "isNative": true, "mediaType": "video"}]});
    var videoData = {
        "noPlaylistControls": true,
        "playlist": playlist
    };
    callback(videoData);
};