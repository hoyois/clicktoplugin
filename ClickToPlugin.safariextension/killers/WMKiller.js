function WMKiller() {
    this.name = "WMKiller";
}

WMKiller.prototype.canKill = function(data) {
    return (data.plugin == "Flip4Mac" && canPlayWM);
};

WMKiller.prototype.processElement = function(data, callback) {
    var mediaType = canPlaySrcWithHTML5(data.src);
    if(!mediaType) return;
    var isAudio = mediaType.type === "audio";
    var sources = [{"url": data.src, "isNative": false}];
    var defaultSource = chooseDefaultSource(sources);
    
    var mediaData = {
        "playlist": [{"mediaType": "video", "sources": sources, "defaultSource": defaultSource}],
        "badgeLabel": isAudio ? "Audio" : "Video",
        "isAudio": isAudio
    };
    callback(mediaData);
};