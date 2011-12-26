addKiller("IGN", {

"canKill": function(data) {
	return data.location.indexOf("ign.com") !== -1;
},

"process": function(data, callback) {

	if( !data.params.flashvars ) 
		return;
		
	var matches = /^config=(.*?)$/.exec(data.params.flashvars);		
	
	if( !matches )
		return;
			
	config = JSON.parse(matches[1]);
	
	var sources = [];
	
	config.clip.bitrates.forEach( function( bitrate, i ) {
		sources.push({"url": bitrate.url.replace("mp4:","http://assets.ign.com/") , "format":  bitrate.height + "p", "height": bitrate.height, "isNative": true});
	});
	
	callback({
		"playlist": [{
			"title": data.title,
			"sources": sources				
	 }]});

}
	
});