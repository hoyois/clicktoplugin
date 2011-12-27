addKiller("IGN", {

"canKill": function(data) {
	return (data.location.indexOf("ign.com") !== -1 && data.src.indexOf("embed.swf") !== -1);
},

"process": function(data, callback) {
	if( !data.params.flashvars ) 
		return;
		
	var flashvars = parseFlashVariables(data.params.flashvars);	
	var config;	
	var sources = [];
	var configUrl = data.location + ".config";
	
	if ( flashvars.url ) {
		configUrl = decodeURIComponent(flashvars.url) + ".config";
	} else if ( flashvars.config ) {
		config = JSON.parse(flashvars.config);
		sources = this.processPlaylist(config.playlist[0]);
		
		callback({
			"playlist": [{
				"title": data.title,
				"sources": sources
		 }]});

		return;
	}
	
	_this = this;
	var xhr = new XMLHttpRequest();
	xhr.open('GET', configUrl, true);
	xhr.onload = function() {
		config = JSON.parse( xhr.responseText );
		sources = _this.processPlaylist(config.playlist[1]);
		
		callback({
			"playlist": [{
				"title": data.title,
				"sources": sources,
				"poster": config.playlist[0].url			
		 }]});
	};
	xhr.send();

	return;
},



"processPlaylist": function(playlist) {
	var sources = [];
	
	if( playlist.bitrates )
		playlist.bitrates.forEach( function( bitrate ) {
			if( bitrate.height && bitrate.url )
				sources.push({"url": bitrate.url.replace("mp4:","http://assets.ign.com/") , "format":  bitrate.height + "p", "height": bitrate.height, "isNative": true});
		});
	
	return sources;
}
	
});