var killer = new Object();
addKiller("WindowsMedia", killer);

killer.canKill = function(data) {
    return data.plugin === "Windows Media" && canPlayWM;
};

killer.process = function(data, callback) {
    var mediaInfo = getInfoFromExt(extractExt(data.src));
    if(!mediaInfo) return;
    var sources = [{"url": data.src, "isNative": false, "mediaType": mediaInfo.mediaType}];
    
    var mediaData = {
        "playlist": [{"sources": sources}],
        "isAudio": mediaInfo.mediaType === "audio"
    };
    callback(mediaData);
};