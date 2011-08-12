var killer = new Object();
addKiller("Silverlight", killer);

killer.canKill = function(data) {
    if(!data.plugin === "Silverlight") return false;
    var matches = data.params.match(/(?:^|,)(m|fileurl|mediaurl)=/);
    if(matches) {data.file = matches[1]; return true;}
    return false;
};

killer.process = function(data, callback) {
    var SLvars = parseSLVariables(data.params);
    var mediaURL = decodeURIComponent(SLvars[data.file]);
    var mediaInfo = getInfoFromExt(extractExt(mediaURL));
    
    var sources = new Array();
    if(mediaInfo && (mediaInfo.isNative || canPlayWM)) sources.push({"url": mediaURL, "isNative": mediaInfo.isNative, "mediaType": mediaInfo});
    
    var posterURL;
    if(SLvars.thumbnail) posterURL = decodeURIComponent(SLvars.thumbnail);
    
    var mediaData = {
        "playlist": [{"poster": posterURL, "sources": sources}],
        "isAudio": mediaInfo.mediaType === "audio"
    }
    callback(mediaData);
};