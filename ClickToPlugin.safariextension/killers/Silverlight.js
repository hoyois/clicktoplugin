addKiller("Silverlight", {

"canKill": function(data) {
	if(data.type !== "application/x-silverlight-2") return false;
	var match = /(?:^|,)(m|fileurl|mediaurl)=/.exec(data.params.initparams);
	if(match) {data.file = match[1]; return true;}
	return false;
},

"process": function(data, callback) {
	var SLvars = parseSLVariables(data.params.initparams);
	var mediaURL = decodeURIComponent(SLvars[data.file]);
	var source = HTML5.urlInfo(mediaURL);
	
	var audioOnly = false;
	var sources = [];
	if(source) {
		source.url = mediaURL;
		sources.push(source);
		audioOnly = source.isAudio;
	}
	
	var posterURL;
	if(SLvars.thumbnail) posterURL = decodeURIComponent(SLvars.thumbnail);
	
	callback({
		"playlist": [{"poster": posterURL, "sources": sources}],
		"audioOnly": audioOnly
	});
}

});
