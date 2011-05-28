function WMKiller() {}

WMKiller.prototype.canKill = function(data) {
    return (data.plugin === "Flip4Mac" && canPlayWM);
};

WMKiller.prototype.process = function(data, callback) {
    var mediaInfo = getMediaInfo(data.src);
    if(!mediaInfo) return;
    var sources = [{"url": data.src, "isNative": false, "mediaType": mediaInfo.type}];
    
    var mediaData = {
        "playlist": [{"sources": sources}],
        "isAudio": mediaInfo.type === "audio"
    };
    callback(mediaData);
};