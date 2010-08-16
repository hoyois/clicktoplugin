function JWKiller() {
	this.name = "JWKiller";
}

JWKiller.prototype.canKill = function(data) {
	if(data.plugin != "Flash" || !safari.extension.settings["replaceFlash"]) return false;
    return (getFlashVariable(data.params, "file") || getFlashVariable(data.params, "playlistfile"));
};

JWKiller.prototype.processElement = function(data, callback) {
	var playlistURL = getFlashVariable(data.params, "playlistfile");
    var sourceURL = getFlashVariable(data.params, "file");
	var posterURL = getFlashVariable(data.params, "image");
	
	if(safari.extension.settings["usePlaylists"]) {
		if(playlistURL) {
			this.processElementFromPlaylist(playlistURL, getFlashVariable(data.params, "item"), posterURL, callback);
			return;
		}
		if(sourceURL.match(".xml")) {
			this.processElementFromPlaylist(sourceURL, getFlashVariable(data.params, "item"), posterURL, callback);
			return;
		}
	}
    
	var sourceURL2 = getFlashVariable(data.params, "real_file");
	if(sourceURL2) sourceURL = sourceURL2;
	
	var mediaType = checkSrc(sourceURL);
	if(!mediaType) return;

	var mediaData = {
        "playlist": [{"mediaType": mediaType, "posterURL": makeAbsoluteURI(posterURL), "mediaURL": makeAbsoluteURI(sourceURL)}],
        "badgeLabel": (mediaType == "video") ? "Video" : "Audio"
    };
	callback(mediaData);
};

// put a more complete function in globalfunctions.js
function checkSrc(sourceURL) {
	if (sourceURL.match(/(.mp4)|(.mpe{0,1}g)/i)) return "video";
	if(safari.extension.settings["QTbehavior"] > 1 && canPlayFLV && sourceURL.match(/.flv/i)) return "video";
	if(safari.extension.settings["QTbehavior"] > 1 && canPlayWM && sourceURL.match(/(.wmv)|(.asf)/i)) return "video";
	if(sourceURL.match(/(.mp3)|(.wav)|(.aiff)|(.aac)/i)) return "audio";
	if(safari.extension.settings["QTbehavior"] > 1 && canPlayWM && sourceURL.match(/.wma/i)) return "audio";
	return false;
};

JWKiller.prototype.processElementFromPlaylist = function(playlistURL, track, posterURL, callback) {
	var req = new XMLHttpRequest();
	var startTrack = track;
	playlistURL = makeAbsoluteURI(playlistURL);
    req.open('GET', playlistURL, true);
    req.onload = function() {
        var x = req.responseXML.getElementsByTagName("track");
		if(!(track >= 0 && track < x.length)) track = 0;
		var playlist = new Array();
		var url = "";
		var list = null;
		var title = "";
		var poster = null;
		for(var i = 0; i < x.length; i++) {
			list = x[(i + track) % x.length].getElementsByTagName("location");
			if(list.length > 0) url = list[0].firstChild.nodeValue;
			else url = "";
			list = x[(i + track) % x.length].getElementsByTagName("title");
			if(list.length > 0) title = list[0].firstChild.nodeValue;
			else title = "";
			list = x[(i + track) % x.length].getElementsByTagName("image");
			if(list.length > 0) poster = list[0].firstChild.nodeValue;
			else poster = "";
			var mediaType = checkSrc(url);
			if(mediaType) {
				playlist.push({"title": title, "mediaType": mediaType, "posterURL": makeAbsoluteURI(poster), "mediaURL": makeAbsoluteURI(url)});
				if(mediaType == "video") isAudio = false;
			} else {
				if(i >= x.length - track) --startTrack;
			}
		}
		if(playlist.length == 0) return;
		if(!playlist[0].posterURL) playlist[0].posterURL = makeAbsoluteURI(posterURL);
        var mediaData = {
			"startTrack": startTrack,
			"isAudio": isAudio,
	        "playlist": playlist,
	        "badgeLabel": isAudio ? "Audio" : "Video"
	    };
		callback(mediaData);
    };
	// BEGIN DEBUG
    if(safari.extension.settings["debug"]) {
        if(!confirm("Killer '" + this.name + "' is about to send an asynchronous AJAX request to:\n\n" + playlistURL)) return;
    }
    // END DEBUG
    req.send(null);
};

