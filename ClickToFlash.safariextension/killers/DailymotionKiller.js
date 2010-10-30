function DailymotionKiller() {
    this.name = "DailymotionKiller";
}

DailymotionKiller.prototype.canKill = function(data) {
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
    var posterURL, videoURL, matches;
    var badgeLabel = "H.264";
    // sdURL (FLV only)
    if(safari.extension.settings["QTbehavior"] > 1 && canPlayFLV) {
        matches = sequence.match(/\"sdURL\":\"([^"]*)\"/);
        if(matches) videoURL = matches[1].replace(/\\\//g,"/");
    }
    // hqURL (<=480p)
    matches = sequence.match(/\"hqURL\":\"([^"]*)\"/);
    if(matches) videoURL = matches[1].replace(/\\\//g,"/");
    if(safari.extension.settings["maxresolution"] > 1) {
        matches = sequence.match(/\"hdURL\":\"([^"]*)\"/);
        if(matches) {
            videoURL = matches[1].replace(/\\\//g,"/");
            badgeLabel = "HD&nbsp;H.264";
        }
    }
    // hdURL (720p)
    matches = sequence.match(/\"backgroundImageURL\":\"([^"]*)\"/);
    if(matches) posterURL = matches[1].replace(/\\\//g,"/");
    
    var title;
    matches = sequence.match(/\"videoTitle\":\"((?:\\"|[^"])*)\"/);
    if(matches) title = unescape(matches[1].replace(/\+/g, " ").replace(/\\u/g, "%u").replace(/\\["'\/\\]/g, function(s){return s.charAt(1);}));
    
    var videoData = {
        "playlist": [{"mediaType": "video", "title": title, "posterURL": posterURL, "mediaURL": videoURL}],
        "badgeLabel": badgeLabel
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
