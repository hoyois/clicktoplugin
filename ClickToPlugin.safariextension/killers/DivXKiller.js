function DivXKiller() {}


DivXKiller.prototype.canKill = function(data) {
    return ((data.plugin === "DivX" || hasExt("divx", data.src)) && canPlayDivX);
};


DivXKiller.prototype.processElement = function(data, callback) {
    var videoData = {
        "playlist": [{"mediaType": "video", "posterURL": data.params, "sources": [{"url": data.src, "isNative": false}]}]
    };
    callback(videoData);
};