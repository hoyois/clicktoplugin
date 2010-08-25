function QTKiller() {
    this.name = "QTKiller";
}


QTKiller.prototype.canKill = function(data) {
    // streaming does not seem supported by HTML5 video in Safari
    return (data.plugin == "QuickTime" && safari.extension.settings["replaceQT"] && data.src.substring(0,4) == "http" && (!data.href || data.href.substring(0,4) == "http"));
};


QTKiller.prototype.processElement = function(data, callback) {
    var playlist = [{"mediaType": "video", "mediaURL": data.src}];
    if(data.href) playlist.push({"mediaType": "video", "mediaURL": data.href});
    var videoData = {
        "noPlaylistControls": true,
        "playlist": playlist,
        "badgeLabel": "Video"
    };

    callback(videoData);
};