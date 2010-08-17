function DivXKiller() {
	this.name = "DivXKiller";
}


DivXKiller.prototype.canKill = function(data) {
    return (data.plugin == "DivX" && safari.extension.settings["QTbehavior"] > 1 && canPlayFLV);
};


DivXKiller.prototype.processElement = function(data, callback) {
	var videoData = {
        "playlist": [{"mediaType": "video", "posterURL": data.image, "mediaURL": data.src}],
        "badgeLabel": "Video"
    };
	callback(videoData);
};