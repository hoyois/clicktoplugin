function SLKiller() {
    this.name = "SLKiller";
}

SLKiller.prototype.canKill = function(data) {
    if(!data.plugin == "Silverlight" || !safari.extension.settings["replaceSL"]) return false;
    return (safari.extension.settings["QTbehavior"] > 1 && canPlayWM && (hasSLVariable(data.params, "m") || hasSLVariable(data.params, "fileurl")));
};

SLKiller.prototype.processElement = function(data, callback) {
    var mediaURL = decodeURIComponent(getSLVariable(data.params, "m"));
    if(!mediaURL) mediaURL = decodeURIComponent(getSLVariable(data.params, "fileurl"));
    var mediaType = willPlaySrcWithHTML5(mediaURL);
    if(!mediaType) return;
    var isAudio = mediaType == "audio";
    
    var mediaData = {
        "playlist": [{"mediaType": mediaType,  "posterURL": decodeURIComponent(getSLVariable(data.params, "thumbnail")), "mediaURL": mediaURL}],
        "badgeLabel": isAudio ? "Audio" : "Video",
        "isAudio": isAudio
    }
    callback(mediaData);
};