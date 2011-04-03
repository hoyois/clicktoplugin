function DivXKiller() {}


DivXKiller.prototype.canKill = function(data) {
    return ((data.plugin === "DivX" || hasExt("divx", data.src)) && canPlayDivX);
};


DivXKiller.prototype.process = function(data, callback) {
    var videoData = {
        "playlist": [{"posterURL": data.params, "sources": [{"url": data.src, "isNative": false, "mediaType": "video"}]}]
    };
    callback(videoData);
};