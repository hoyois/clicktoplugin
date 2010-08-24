function JWKiller() {
    this.name = "JWKiller";
}

JWKiller.prototype.canKill = function(data) {
    if(data.plugin != "Flash" || !safari.extension.settings["replaceFlash"]) return false;
    // streams are not supported
    return (!getFlashVariable(data.params, "streamer") && (getFlashVariable(data.params, "file") || getFlashVariable(data.params, "playlistfile")));
};

JWKiller.prototype.processElement = function(data, callback) {
    var playlistURL = getFlashVariable(data.params, "playlistfile");
    var sourceURL = getFlashVariable(data.params, "file");
    var posterURL = getFlashVariable(data.params, "image");
    
    if(safari.extension.settings["usePlaylists"]) {
        if(playlistURL) {
            this.processElementFromPlaylist(playlistURL, data.location, getFlashVariable(data.params, "item"), posterURL, callback);
            return;
        }
        if(/.xml($|\?)/i.test(sourceURL)) {
            this.processElementFromPlaylist(sourceURL, data.location, getFlashVariable(data.params, "item"), posterURL, callback);
            return;
        }
    }
    
    var sourceURL2 = getFlashVariable(data.params, "real_file");
    if(sourceURL2) sourceURL = sourceURL2;
    
    var mediaType = checkSrc(sourceURL);
    if(!mediaType) return;

    var mediaData = {
        "playlist": [{"mediaType": mediaType, "posterURL": makeAbsoluteURI(posterURL, data.location), "mediaURL": makeAbsoluteURI(sourceURL, data.location)}],
        "badgeLabel": (mediaType == "video") ? "Video" : "Audio"
    };
    callback(mediaData);
};

// put a more complete function in globalfunctions.js
function checkSrc(sourceURL) {
    if (sourceURL.match(/.mp4|.mpe{0,1}g|.mov/i)) return "video";
    if(safari.extension.settings["QTbehavior"] > 1 && canPlayFLV && sourceURL.match(/.flv/i)) return "video";
    if(safari.extension.settings["QTbehavior"] > 1 && canPlayWM && sourceURL.match(/.wmv|.asf/i)) return "video";
    if(sourceURL.match(/.mp3|.wav|.aiff|.aac/i)) return "audio";
    if(safari.extension.settings["QTbehavior"] > 1 && canPlayWM && sourceURL.match(/.wma/i)) return "audio";
    return false;
};

JWKiller.prototype.processElementFromPlaylist = function(playlistURL, location, track, posterURL, callback) {
    var req = new XMLHttpRequest();
    var startTrack = track;
    playlistURL = makeAbsoluteURI(playlistURL, location);
    req.open('GET', playlistURL, true);
    req.onload = function() {
        var isAudio = true;
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
            else if(i == 0) return;
            else continue;
            list = x[(i + track) % x.length].getElementsByTagName("title");
            if(list.length > 0) title = list[0].firstChild.nodeValue;
            else title = "";
            list = x[(i + track) % x.length].getElementsByTagName("image");
            if(list.length > 0) poster = list[0].firstChild.nodeValue;
            else poster = "";
            var mediaType = checkSrc(url);
            if(mediaType) {
                playlist.push({"title": title, "mediaType": mediaType, "posterURL": makeAbsoluteURI(poster, location), "mediaURL": makeAbsoluteURI(url, location)});
                if(mediaType == "video") isAudio = false;
            } else {
                if(i == 0) return;
                if(i >= x.length - track) --startTrack;
            }
        }
        if(!playlist[0].posterURL) playlist[0].posterURL = makeAbsoluteURI(posterURL, location);
        var mediaData = {
            "startTrack": startTrack,
            "isAudio": isAudio,
            "playlist": playlist,
            "badgeLabel": playlist[0].mediaType == "audio" ? "Audio" : "Video"
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

