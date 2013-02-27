addKiller("Silverlight", {

"canKill": function(data) {
	if(data.type !== "application/x-silverlight-2") return false;
	var match = /(?:^|,)\s*(m|fileurl|mediaurl|link)=/.exec(data.params.initparams);
	if(match) {data.file = match[1]; return true;}
	return false;
},

"process": function(data, callback) {
	var SLvars = parseSLVariables(data.params.initparams);
	var mediaURL = decodeURIComponent(SLvars[data.file]);
	var info = urlInfo(mediaURL);
	
	var audioOnly = false;
	var sources = [];
	if(info) {
		info.url = mediaURL;
		sources.push(info);
		audioOnly = info.isAudio;
	}
	
	var posterURL;
	if(SLvars.thumbnail) posterURL = decodeURIComponent(SLvars.thumbnail);
	
	callback({
		"playlist": [{"poster": posterURL, "sources": sources}],
		"audioOnly": audioOnly
	});
}

});
