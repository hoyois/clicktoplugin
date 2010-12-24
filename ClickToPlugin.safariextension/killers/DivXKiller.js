function DivXKiller() {
    this.name = "DivXKiller";
}


DivXKiller.prototype.canKill = function(data) {
    return ((data.plugin == "DivX" || hasExt("divx", data.src)) && canPlayDivX);
};


DivXKiller.prototype.processElement = function(data, callback) {
    var sources = [{"url": data.src, "isNative": false}];
    var defaultSource = chooseDefaultSource(sources);
    var videoData = {
        "playlist": [{"mediaType": "video", "posterURL": data.params, "sources": sources, "defaultSource": defaultSource}],
        "badgeLabel": makeLabel(sources[defaultSource])
    };
    callback(videoData);
};