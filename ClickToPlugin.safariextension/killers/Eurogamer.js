addKiller("Eurogamer", {

"canKill": function(data) {
	return data.location.indexOf("eurogamer.net") !== -1;
},

"process": function(data, callback) {
	console.log(data);
	var flashvars = parseFlashVariables(data.params.flashvars);
	console.log(flashvars);
	console.log( decodeURIComponent(flashvars.playlist) );
	var payload = /\[\[JSON\]\]\[(.*?)\]/.exec(decodeURIComponent(flashvars.playlist))[1];		
	payload = JSON.parse(payload);
	
	var sources = [];
	
	if( payload['hd.file'] )
		sources.push({"url": payload['hd.file'] , "format":  "HD", "height": 720, "isNative": 			true});					
	
	if( payload['hd.original'] )
		sources.push({"url": payload['hd.original'] , "format":  "SD", "height": 406, "isNative": 			true});					

	callback({
		"playlist": [{
			"title": data.title,
			"poster": payload.image,
			"sources": sources				
	 }]});
}
	
});