function QTKiller() {}


QTKiller.prototype.canKill = function(data) {
    // streaming does not seem supported by HTML5 video in Safari
    return (data.plugin == "QuickTime" && data.src.substring(0,4) == "http" && (!data.href || data.href.substring(0,4) == "http"));
};


QTKiller.prototype.processElement = function(data, callback) {
    var playlist = [{"mediaType": "video", "sources": [{"url": data.src}], "defaultSource": 0}];
    if(data.href) playlist.push({"mediaType": "video", "sources": [{"url": data.href}], "defaultSource": 0});
    var videoData = {
        "noPlaylistControls": true,
        "playlist": playlist,
        "badgeLabel": "H.264"
    };

    callback(videoData);
};