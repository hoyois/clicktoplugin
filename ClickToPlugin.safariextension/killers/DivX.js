var killer = new Object();
addKiller("DivX", killer);

killer.canKill = function(data) {
    return data.plugin === "DivX" && canPlayDivX;
};


killer.process = function(data, callback) {
    var videoData = {
        "playlist": [{"poster": data.params, "sources": [{"url": data.src, "isNative": false, "mediaType": "video"}]}]
    };
    callback(videoData);
};