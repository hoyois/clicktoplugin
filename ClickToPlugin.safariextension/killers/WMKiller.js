function WMKiller() {
	this.name = "WMKiller";
}


WMKiller.prototype.canKill = function(data) {
    return (data.plugin == "WM" && safari.extension.settings["replaceWM"] && safari.extension.settings["QTbehavior"] > 1 && canPlayWM && data.src.match(/\.((wm(?!x))|(asf))/i));
};

// should check media type...
WMKiller.prototype.processElement = function(data, callback) {
	var videoData = {
        "playlist": [{"mediaType": "video", "mediaURL": data.src}],
        "badgeLabel": "Video"
    };
	callback(videoData);
};