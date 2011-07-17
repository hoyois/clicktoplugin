function FlowKiller() {}

FlowKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    if(!/(?:^|&)config=/.test(data.params)) return false;
    if(/flowplayer[^\/]*\.swf/i.test(data.src)) {return true;}
    if(/bimvid_player-[^\/.]*\.swf$/.test(data.src)) {data.bim = true; return true;}
};

FlowKiller.prototype.process = function(data, callback) {
    var config = JSON.parse(decodeURIComponent(parseFlashVariables(data.params).config));
    var baseURL;
    if(config.clip) baseURL = config.clip.baseUrl;
    
    var mediaURL, mediaInfo;
    var playlist = new Array();
    var isAudio = true;
    
    var parseTitle = function(title) {return title};
    if(data.bim) parseTitle = function(title) {return unescapeHTML(title.replace(/\+/g, " "));}
    
    if(config.playList) config.playlist = config.playList;
    if(typeof config.playlist === "object") {
        for(var i = 0; i < config.playlist.length; i++) {
            if(config.playlist[i].provider === "rtmp") continue;
            mediaURL = config.playlist[i].url;
            mediaInfo = getMediaInfo(mediaURL);
            if(mediaInfo) {
                if(config.playlist[i].baseUrl) baseURL = config.playlist[i].baseUrl;
                if(baseURL) {
                    if(!/\/$/.test(baseURL)) baseURL += "/";
                    mediaURL = baseURL + mediaURL;
                }
                playlist.push({"title": parseTitle(config.playlist[i].title), "posterURL": config.playlist[i].overlay, "sources": [{"url": mediaURL, "mediaType": mediaInfo.type, "isNative": mediaInfo.isNative}]}); // resolution:
                if(mediaInfo.type === "video") isAudio = false;
            }
        }
    } else if(config.clip) {
        if(config.clip.provider === "rtmp") return;
        mediaURL = config.clip.url;
        if(!mediaURL) return;
        mediaInfo = getMediaInfo(mediaURL);
        if(mediaInfo) {
            if(baseURL) {
                if(!/\/$/.test(baseURL)) baseURL += "/";
                mediaURL = baseURL + mediaURL;
            }
            playlist.push({"title": parseTitle(config.playlist[i].title), "posterURL": config.clip.overlay, "sources": [{"url": mediaURL, "mediaType": mediaInfo.type, "isNative": mediaInfo.isNative}]});
            if(mediaInfo.type === "video") isAudio = false;
        }
    } else return;
    
    var mediaData = {
        "playlist": playlist,
        "isAudio": isAudio
    };
    callback(mediaData);
};
