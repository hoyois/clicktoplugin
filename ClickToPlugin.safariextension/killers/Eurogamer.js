addKiller("Eurogamer", {

"canKill": function(data) {
	return data.location.indexOf("eurogamer.net") !== -1;
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	var matches = /\[\[JSON\]\]\[(.*?)\]/.exec(decodeURIComponent(flashvars.playlist));
	
	if( !matches || matches < 2 )
		return;
				
	var payload = JSON.parse(matches[1]);
	
	var sources = [];
	
	if( payload['hd.file'] )
		sources.push({"url": payload['hd.file'] , "format":  "HD", "height": 720, "isNative": 			true});					
	
	if( payload['hd.original'] )
		sources.push({"url": payload['hd.original'] , "format":  "SD", "height": 406, "isNative": 			true});		
	
	var initScript = '\
		if( Playlist && Playlist.width ) {\
			mediaElement.parentElement.style.setProperty("width", Playlist.width + "px", "important");\
			mediaElement.style.setProperty("width", Playlist.width + "px", "important");\
		}\
		\
		if( Playlist && Playlist.height ) {\
			mediaElement.parentElement.style.setProperty("height", Playlist.height + "px", "important");\
			mediaElement.style.setProperty("height", Playlist.height + "px", "important");\
		}\
	';
	
	callback({
		"initScript": initScript,
		"playlist": [{
			"title": data.title,
			"poster": payload.image,
			"sources": sources				
	 }]});
}
	
});