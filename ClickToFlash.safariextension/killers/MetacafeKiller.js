function MetacafeKiller() {}

MetacafeKiller.prototype.canKill = function(data) {
    return (data.src.indexOf(".mcstatic.com/Flash/vp/") != -1 || data.src.indexOf("metacafe.com/fplayer/") != -1);
};

MetacafeKiller.prototype.processElement = function(data, callback) {
    if(hasFlashVariable(data.params, "mediaData")) {
        this.processElementFromFlashvars(data.params, null, callback);
    } else {
        var matches = data.src.match(/metacafe\.com\/fplayer\/([0-9]*)\//);
        if(matches) this.processElementFromVideoID(matches[1], callback);
        return;
    }
};

MetacafeKiller.prototype.processElementFromFlashvars = function(flashvars, siteInfo, callback) {
    var mediaList = JSON.parse(decodeURIComponent(getFlashVariable(flashvars, "mediaData")));
    for(var type in mediaList) {
        mediaList[type] = mediaList[type].mediaURL + "?__gda__=" + mediaList[type].key;
    }
    var sources = new Array();
    
    if(mediaList.highDefinitionMP4) {
        sources.push({"url": mediaList.highDefinitionMP4, "format": "HD MP4", "resolution": 720, "isNative": true});
    }
    if(mediaList.MP4) {
        sources.push({"url": mediaList.MP4, "format": "SD MP4", "resolution": 360, "isNative": true});
    }
    if(canPlayFLV && mediaList.flv) {
        sources.push({"url": mediaList.flv, "format": "SD FLV", "resolution": 360, "isNative": false});
    }
    
    var title = decodeURIComponent(getFlashVariable(flashvars, "title"));
    
    var videoData = {
        "playlist": [{"mediaType": "video", "title": title, "sources": sources, "siteInfo": siteInfo}]
    };
    callback(videoData);
};

MetacafeKiller.prototype.processElementFromVideoID = function(videoID, callback) {
    var xhr = new XMLHttpRequest();
    var url = "http://www.metacafe.com/watch/" + videoID;
    var siteInfo = {"name": "Metacafe", "url": url};
    xhr.open('GET', url, true);
    var _this = this;
    xhr.onload = function() {
        var matches = xhr.responseText.match(/name=\"flashvars\"\svalue=\"([^"]*)\"/);
        if(matches) _this.processElementFromFlashvars(matches[1], siteInfo, callback);
    };
    xhr.send(null);
};

