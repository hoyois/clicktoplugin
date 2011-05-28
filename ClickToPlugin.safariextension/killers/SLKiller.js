function SLKiller() {}

SLKiller.prototype.canKill = function(data) {
    if(!data.plugin === "Silverlight") return false;
    var matches = data.params.match(/(?:^|,)(m|fileurl|mediaurl)=/);
    if(matches) {data.file = matches[1]; return true;}
    return false;
};

SLKiller.prototype.process = function(data, callback) {
    var SLvars = parseSLVariables(data.params);
    var mediaURL = decodeURIComponent(SLvars[data.file]);
    var mediaInfo = getMediaInfo(mediaURL);
    
    var sources = new Array();
    if(mediaInfo && (mediaInfo.isNative || canPlayWM)) sources.push({"url": mediaURL, "isNative": mediaInfo.isNative, "mediaType": mediaInfo});
    
    var posterURL;
    if(SLvars.thumbnail) posterURL = decodeURIComponent(SLvars.thumbnail);
    
    var mediaData = {
        "playlist": [{"posterURL": posterURL, "sources": sources}],
        "isAudio": mediaInfo.type === "audio"
    }
    callback(mediaData);
};