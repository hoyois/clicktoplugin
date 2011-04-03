function SLKiller() {}

SLKiller.prototype.canKill = function(data) {
    if(!data.plugin === "Silverlight") return false;
    if(hasSLVariable(data.params, "m")) {data.file = "m"; return true;}
    if(hasSLVariable(data.params, "fileurl")) {data.file = "fileurl"; return true;}
    if(hasSLVariable(data.params, "mediaurl")) {data.file = "mediaurl"; return true;}
    return false;
};

SLKiller.prototype.process = function(data, callback) {
    var SLvars = parseSLVariables(data.params);
    var mediaURL = decodeURIComponent(SLvars[data.file]);
    var mediaType = canPlaySrcWithHTML5(mediaURL);
    
    var sources = new Array();
    if(mediaType && (mediaType.isNative || canPlayWM)) sources.push({"url": mediaURL, "isNative": mediaType.isNative, "mediaType": mediaType});
    
    var mediaData = {
        "playlist": [{"posterURL": decodeURIComponent(SLvars.thumbnail), "sources": sources}],
        "isAudio": mediaType.type === "audio"
    }
    callback(mediaData);
};