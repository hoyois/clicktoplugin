function WMKiller() {
    this.name = "WMKiller";
}

WMKiller.prototype.canKill = function(data) {
    return (data.plugin == "WM" && safari.extension.settings["replaceWM"] && safari.extension.settings["QTbehavior"] > 1 && canPlayWM);
};

WMKiller.prototype.processElement = function(data, callback) {
    var mediaType = willPlaySrcWithHTML5(data.src);
    if(!mediaType) return;
    var isAudio = mediaType == "audio";
    
    var mediaData = {
        "playlist": [{"mediaType": "video", "mediaURL": data.src}],
        "badgeLabel": isAudio ? "Audio" : "Video",
        "isAudio": isAudio
    };
    callback(mediaData);
};