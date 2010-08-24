function SLKiller() {
    this.name = "SLKiller";
}


SLKiller.prototype.canKill = function(data) {
    return (data.plugin == "Silverlight" && safari.extension.settings["replaceSL"] && safari.extension.settings["QTbehavior"] > 1 && canPlayWM && (getSLVariable(data.params, "m") || getSLVariable(data.params, "fileurl")));
};


SLKiller.prototype.processElement = function(data, callback) {
    var videoURL = getSLVariable(data.params, "m");
    if(!videoURL) videoURL = getSLVariable(data.params, "fileurl");
    if(!videoURL.match(/\.((wm(?!x))|(asf))/)) return;
    var posterURL = getSLVariable(data.params, "thumbnail");
    
    var videoData = {
        "playlist": [{"mediaType": "video",  "posterURL": posterURL, "mediaURL": videoURL}],
        "badgeLabel": "Video"
    }
    callback(videoData);
};