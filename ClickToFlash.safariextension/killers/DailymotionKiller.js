function DailymotionKiller() {}

DailymotionKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    return (data.src.indexOf("/dmplayerv4/") !== -1 || data.src.indexOf("www.dailymotion.com") !== -1);
};

DailymotionKiller.prototype.process = function(data, callback) {
    if(/^http:\/\/www\.dailymotion\.com\/hub\//.test(data.location)) {
        var match = data.location.match(/#videoId=(.*)/);
        if(match) this.processFromVideoID(match[1], callback);
    } else if(data.params) {
        var sequence = parseFlashVariables(data.params).sequence;
        if(sequence) this.processFromSequence(decodeURIComponent(sequence), callback);
    } else {
        var match = data.src.match(/\/swf\/([^&]+)/);
        if(match) this.processFromVideoID(match[1], callback);
    }
};

DailymotionKiller.prototype.processFromSequence = function(sequence, callback) {
    // NOTE: sequence.replace(/\\'/g, "'") is JSON but it's so messy that regexp search is easier
    var posterURL, matches;
    var sources = new Array();
    
    // hd720URL (720p)
    matches = sequence.match(/\"hd720URL\":\"([^"]*)\"/);
    if(matches) {
        sources.push({"url": matches[1].replace(/\\\//g,"/"), "format": "720p MP4", "resolution": 720, "isNative": true, "mediaType": "video"});
    }
    // hqURL
    matches = sequence.match(/\"hqURL\":\"([^"]*)\"/);
    if(matches) {
        sources.push({"url": matches[1].replace(/\\\//g,"/"), "format": "SD MP4", "resolution": 360, "isNative": true, "mediaType": "video"});
    }
    // sdURL
    matches = sequence.match(/\"sdURL\":\"([^"]*)\"/);
    if(matches) {
        sources.push({"url": matches[1].replace(/\\\//g,"/"), "format": "LD MP4", "resolution": 240, "isNative": true, "mediaType": "video"});
    }
    
    matches = sequence.match(/\"videoPreviewURL\":\"([^"]*)\"/);
    if(matches) posterURL = matches[1].replace(/\\\//g,"/");
    
    var title;
    matches = sequence.match(/\"videoTitle\":\"((?:\\"|[^"])*)\"/);
    if(matches) title = unescape(matches[1].replace(/\+/g, " ").replace(/\\u/g, "%u").replace(/\\["'\/\\]/g, function(s){return s.charAt(1);}));
    
    var videoData = {
        "playlist": [{"title": title, "posterURL": posterURL, "sources": sources}]
    };
    callback(videoData);
};

DailymotionKiller.prototype.processFromVideoID = function(videoID, callback) {
    var sequenceMatch = /addVariable\(\"sequence\",\s*\"([^"]*)\"/;
    var _this = this;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://www.dailymotion.com/video/" + videoID, true);
    xhr.onload = function() {
        var matches = xhr.responseText.match(sequenceMatch);
        if(matches) {
            var callbackForEmbed = function(videoData) {
                videoData.playlist[0].siteInfo = {"name": "Dailymotion", "url": "http://www.dailymotion.com/video/" + videoID};
                callback(videoData);
            }
            _this.processFromSequence(decodeURIComponent(matches[1]), callbackForEmbed);
        }
    };
    xhr.send(null);
};
