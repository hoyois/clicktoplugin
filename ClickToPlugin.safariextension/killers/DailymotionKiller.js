function DailymotionKiller() {}

DailymotionKiller.prototype.canKill = function(data) {
    if(data.plugin != "Flash") return false;
    return (data.src.indexOf("/dmplayerv4/") != -1 || data.src.indexOf("www.dailymotion.com") != -1);
};

DailymotionKiller.prototype.processElement = function(data, callback) {
    if(data.params) {
        this.processElementFromSequence(decodeURIComponent(getFlashVariable(data.params, "sequence")), callback);
        return;
    }
    // The vid has no flashvars... It has to be an embed
    var matches = data.src.match(/\/swf\/([^&]+)(?:&|$)/);
    if(matches) this.processElementFromVideoID(matches[1], callback);
};

DailymotionKiller.prototype.processElementFromSequence = function(sequence, callback) {
    // NOTE: sequence.replace(/\\'/g, "'") is JSON but it's so messy that regexp search is easier
    var posterURL, matches;
    var sources = new Array();
    
    // hdURL (720p)
    matches = sequence.match(/\"hdURL\":\"([^"]*)\"/);
    if(matches) {
        sources.push({"url": matches[1].replace(/\\\//g,"/"), "format": "HD MP4", "resolution": 720, "isNative": true});
    }
    // hqURL (<=480p)
    matches = sequence.match(/\"hqURL\":\"([^"]*)\"/);
    if(matches) {
        sources.push({"url": matches[1].replace(/\\\//g,"/"), "format": "HQ MP4", "resolution": 360, "isNative": true});
    }
    // sdURL (FLV only)
    if(canPlayFLV) {
        matches = sequence.match(/\"sdURL\":\"([^"]*)\"/);
        if(matches) {
            sources.push({"url": matches[1].replace(/\\\//g,"/"), "format": "SD FLV", "resolution": 240, "isNative": false});
        }
    }
    
    matches = sequence.match(/\"backgroundImageURL\":\"([^"]*)\"/);
    if(matches) posterURL = matches[1].replace(/\\\//g,"/");
    
    var title;
    matches = sequence.match(/\"videoTitle\":\"((?:\\"|[^"])*)\"/);
    if(matches) title = unescape(matches[1].replace(/\+/g, " ").replace(/\\u/g, "%u").replace(/\\["'\/\\]/g, function(s){return s.charAt(1);}));
    
    var videoData = {
        "playlist": [{"mediaType": "video", "title": title, "posterURL": posterURL, "sources": sources}]
    };
    callback(videoData);
};

DailymotionKiller.prototype.processElementFromVideoID = function(videoID, callback) {
    var sequenceMatch = /addVariable\(\"sequence\",\s*\"([^"]*)\"/;
    var _this = this;
    var xhr = new XMLHttpRequest ();
    xhr.open("GET", "http://www.dailymotion.com/video/" + videoID, true);
    xhr.onload = function() {
        var matches = xhr.responseText.match(sequenceMatch);
        if(matches) {
            var callbackForEmbed = function(videoData) {
                videoData.playlist[0].siteInfo = {"name": "Dailymotion", "url": "http://www.dailymotion.com/video/" + videoID};
                callback(videoData);
            }
            _this.processElementFromSequence(decodeURIComponent(matches[1]), callbackForEmbed);
        }
    };
    xhr.send(null);
};
