var killer = new Object();
addKiller("Silverlight", killer);

killer.canKill = function(data) {
	if(!data.plugin === "Silverlight") return false;
	var match = data.params.match(/(?:^|,)(m|fileurl|mediaurl)=/);
	if(match) {data.file = match[1]; return true;}
	return false;
};

killer.process = function(data, callback) {
	var SLvars = parseSLVariables(data.params);
	var mediaURL = decodeURIComponent(SLvars[data.file]);
	var ext = extInfo(mediaURL);
	
	var sources = new Array();
	if(ext) sources.push({"url": mediaURL, "isNative": ext.isNative, "mediaType": ext.mediaType});
	
	var posterURL;
	if(SLvars.thumbnail) posterURL = decodeURIComponent(SLvars.thumbnail);
	
	var mediaData = {
		"playlist": [{"poster": posterURL, "sources": sources}],
		"isAudio": ext.mediaType === "audio"
	}
	callback(mediaData);
};