function QTKiller() {
    this.name = "QTKiller";
}


QTKiller.prototype.canKill = function(data) {
    // streaming does not seem supported by HTML5 video in Safari
    return (data.plugin == "QuickTime" && safari.extension.settings["replaceQT"] && data.src.substring(0,4) == "http" && data.src.substring(7,13) != "stream");
};


QTKiller.prototype.processElement = function(data, callback) {
    var playlist = null;
    if(data.presrc) playlist = [{"mediaType": "video", "mediaURL": data.presrc}, {"mediaType": "video", "mediaURL": data.src}];
    else playlist = [{"mediaType": "video", "mediaURL": data.src}];
    var videoData = {
        "noPlaylistControls": true,
        "playlist": playlist,
        "badgeLabel": "Video"
    };

    callback(videoData);
};