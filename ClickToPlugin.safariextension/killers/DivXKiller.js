function DivXKiller() {
    this.name = "DivXKiller";
}


DivXKiller.prototype.canKill = function(data) {
    if(!safari.extension.settings["replaceDivX"]) return false;
    return ((data.plugin == "DivX" || hasExt("divx", data.src)) && safari.extension.settings["QTbehavior"] > 1 && canPlayDivX);
};


DivXKiller.prototype.processElement = function(data, callback) {
    var videoData = {
        "playlist": [{"mediaType": "video", "posterURL": data.params, "mediaURL": data.src}],
        "badgeLabel": "Video"
    };
    callback(videoData);
};