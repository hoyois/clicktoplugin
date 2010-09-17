function DailymotionKiller() {
    this.name = "DailymotionKiller";
}

DailymotionKiller.prototype.canKill = function(data) {
    if(data.plugin != "Flash" || !safari.extension.settings["replaceFlash"]) return false;
    return (data.src.match("/dmplayerv4/") || data.src.match("www.dailymotion.com"));
};

DailymotionKiller.prototype.processElement = function(data, callback) {
    if(data.params) {
        this.processElementFromSequence(decodeURIComponent(getFlashVariable(data.params, "sequence")), callback);
        return;
    }
    // The vid has no flashvars... It has to be an embed
    var index = data.src.indexOf("/swf/");
    if(index == -1) return;
    videoID = data.src.substring(index + 5);
    index = videoID.indexOf("&");
    if(index != -1) videoID = videoID.substring(0,index);
    this.processElementFromVideoID(videoID, callback);
};

DailymotionKiller.prototype.processElementFromSequence = function(sequence, callback) {
    var posterURL = null;
    var videoURL = null;
    var badgeLabel = "H.264";
    if(safari.extension.settings["QTbehavior"] > 1 && canPlayFLV) {
        var URLindex = sequence.indexOf("sdURL");
        if (URLindex != -1) {
            var s = sequence.substring(URLindex+8);
            s = s.substring(0,s.indexOf("\""));
            videoURL = s.replace(/\\\//g,"/");
        }
    }
    var URLindex = sequence.indexOf("hqURL");
    if (URLindex != -1) {
        var s = sequence.substring(URLindex+8);
        s = s.substring(0,s.indexOf("\""));
        videoURL = s.replace(/\\\//g,"/");
    }
    if(safari.extension.settings["maxresolution"] > 1) {
        URLindex = sequence.indexOf("hdURL");
        if (URLindex != -1) {
            var s = sequence.substring(URLindex+8);
            s = s.substring(0,s.indexOf("\""));
            badgeLabel = "HD&nbsp;H.264";
            videoURL = s.replace(/\\\//g,"/");
        }
    }
    URLindex = sequence.indexOf("backgroundImageURL");
    if (URLindex != -1) {
        var s = sequence.substring(URLindex+21);
        s = s.substring(0,s.indexOf("\""));
        posterURL = s.replace(/\\\//g,"/");
    } /*else { // needed?
        URLindex = sequence.indexOf("videoPreviewURL");
        if (URLindex != -1) {
            var s = sequence.substring(URLindex+18);
            s = s.substring(0,s.indexOf("\""));
            posterURL = s.replace(/\\\//g,"/");
        }
    }*/
    var videoData = {
        "playlist": [{"mediaType": "video", "posterURL": posterURL, "mediaURL": videoURL}],
        "badgeLabel": badgeLabel
    };
    callback(videoData);
};

DailymotionKiller.prototype.processElementFromVideoID = function(videoID, callback) {
    var toMatch = /addVariable\(\"sequence\",\s*\"[^\"]*\"/; //"//
    var _this = this;
    var xhr = new XMLHttpRequest ();
    xhr.open("GET", "http://www.dailymotion.com/video/" + videoID, true);
    xhr.onload = function() {
        var sequence = xhr.responseText.match(toMatch)[0];
        var callbackForEmbed = function(videoData) {
            videoData.playlist[0].siteInfo = {"name": "Dailymotion", "url": "http://www.dailymotion.com/video/" + videoID};
            callback(videoData);
        }
        if(sequence) {_this.processElementFromSequence(decodeURIComponent(sequence), callbackForEmbed);}
    };
    xhr.send(null);
};
