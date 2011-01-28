function SLKiller() {}

SLKiller.prototype.canKill = function(data) {
    if(!data.plugin == "Silverlight") return false;
    if(hasSLVariable(data.params, "m")) {data.file = "m"; return true;}
    if(hasSLVariable(data.params, "fileurl")) {data.file = "fileurl"; return true;}
    if(hasSLVariable(data.params, "mediaurl")) {data.file = "mediaurl"; return true;}
    return false;
};

SLKiller.prototype.processElement = function(data, callback) {
    var mediaURL = decodeURIComponent(getSLVariable(data.params, data.file));
    var mediaType = canPlaySrcWithHTML5(mediaURL);
    if(!mediaType) return;
    if(!mediaType.isNative && !canPlayWM) return;
    
    var sources = [{"url": mediaURL, "isNative": mediaType.isNative}];
    
    var mediaData = {
        "playlist": [{"mediaType": mediaType,  "posterURL": decodeURIComponent(getSLVariable(data.params, "thumbnail")), "sources": sources}],
        "isAudio": mediaType.type === "audio"
    }
    callback(mediaData);
};