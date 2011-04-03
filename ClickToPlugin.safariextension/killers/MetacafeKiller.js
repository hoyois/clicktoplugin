function MetacafeKiller() {}

MetacafeKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    return (data.src.indexOf(".mcstatic.com/Flash/vp/") !== -1 || data.src.indexOf("metacafe.com/fplayer/") !== -1);
};

MetacafeKiller.prototype.process = function(data, callback) {
    if(hasFlashVariable(data.params, "mediaData")) {
        this.processFromFlashVars(parseFlashVariables(data.params), null, callback);
    } else {
        var matches = data.src.match(/metacafe\.com\/fplayer\/([0-9]*)\//);
        if(matches) this.processFromVideoID(matches[1], callback);
        return;
    }
};

MetacafeKiller.prototype.processFromFlashVars = function(flashvars, siteInfo, callback) {
    if(!flashvars.mediaData) return;
    var mediaList = JSON.parse(decodeURIComponent(flashvars.mediaData));
    for(var type in mediaList) {
        mediaList[type] = mediaList[type].mediaURL + "?__gda__=" + mediaList[type].key;
    }
    var sources = new Array();
    
    if(mediaList.highDefinitionMP4) {
        sources.push({"url": mediaList.highDefinitionMP4, "format": "HD MP4", "resolution": 720, "isNative": true, "mediaType": "video"});
    }
    if(mediaList.MP4) {
        sources.push({"url": mediaList.MP4, "format": "SD MP4", "resolution": 360, "isNative": true, "mediaType": "video"});
    }
    if(canPlayFLV && mediaList.flv) {
        sources.push({"url": mediaList.flv, "format": "SD FLV", "resolution": 360, "isNative": false, "mediaType": "video"});
    }
    
    var title;
    if(flashvars.title)  title = decodeURIComponent(flashvars.title);
    
    var videoData = {
        "playlist": [{"title": title, "sources": sources, "siteInfo": siteInfo}]
    };
    callback(videoData);
};

MetacafeKiller.prototype.processFromVideoID = function(videoID, callback) {
    var xhr = new XMLHttpRequest();
    var url = "http://www.metacafe.com/watch/" + videoID;
    var siteInfo = {"name": "Metacafe", "url": url};
    xhr.open('GET', url, true);
    var _this = this;
    xhr.onload = function() {
        var matches = xhr.responseText.match(/name=\"flashvars\"\svalue=\"([^"]*)\"/);
        if(matches) _this.processFromFlashVars(matches[1], siteInfo, callback);
    };
    xhr.send(null);
};

