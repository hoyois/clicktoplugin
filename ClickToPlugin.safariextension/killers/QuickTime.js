var killer = new Object();
addKiller("QuickTime", killer);

killer.canKill = function(data) {
    // streaming does not seem supported by HTML5 video in Safari
    return data.plugin === "QuickTime" && data.src.substring(0,4) === "http" && (!data.href || data.href.substring(0,4) === "http");
};


killer.process = function(data, callback) {
    var isAudio = true;
    var playlist = new Array();
    var addTrack = function(url) {
        var ext = extInfo(url);
        if(!ext) return;
        var source = {"url": url, "isNative": ext.isNative, "mediaType": ext.mediaType};
        if(ext.mediaType === "video") isAudio = false;
        playlist.push({"sources": [source]});
    };
    addTrack(data.src);
    if(data.href) addTrack(data.href);
    var videoData = {
        "noPlaylistControls": true,
        "playlist": playlist,
        "isAudio": isAudio
    };
    callback(videoData);
};