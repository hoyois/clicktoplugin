var killer = {};
addKiller("Silverlight", killer);

killer.canKill = function(data) {
	if(!data.plugin === "Silverlight") return false;
	var match = /(?:^|,)(m|fileurl|mediaurl)=/.exec(data.params.initparams);
	if(match) {data.file = match[1]; return true;}
	return false;
};

killer.process = function(data, callback) {
	var SLvars = parseSLVariables(data.params.initparams);
	var mediaURL = decodeURIComponent(SLvars[data.file]);
	var ext = extInfo(mediaURL);
	
	var sources = [];
	if(ext) sources.push({"url": mediaURL, "isNative": ext.isNative, "mediaType": ext.mediaType});
	
	var posterURL;
	if(SLvars.thumbnail) posterURL = decodeURIComponent(SLvars.thumbnail);
	
	callback({
		"playlist": [{"poster": posterURL, "sources": sources}],
		"isAudio": ext && ext.mediaType === "audio"
	});
};