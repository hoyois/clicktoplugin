function WMKiller() {}

WMKiller.prototype.canKill = function(data) {
    return (data.plugin == "Flip4Mac" && canPlayWM);
};

WMKiller.prototype.processElement = function(data, callback) {
    var mediaType = canPlaySrcWithHTML5(data.src);
    if(!mediaType) return;
    var sources = [{"url": data.src, "isNative": false}];
    
    var mediaData = {
        "playlist": [{"mediaType": mediaType.type, "sources": sources}],
        "isAudio": mediaType.type === "audio"
    };
    callback(mediaData);
};