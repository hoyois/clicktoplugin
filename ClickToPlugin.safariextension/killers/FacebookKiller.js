function FacebookKiller() {}

FacebookKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    return /^https?:\/\/s-static\.ak\.facebook\.com\/rsrc\.php\/v[1-9]\/[a-zA-Z0-9]{2}\/r\/[a-zA-Z0-9_-]*\.swf/.test(data.src) || data.src.indexOf("www.facebook.com/v/") !== -1;
};

FacebookKiller.prototype.process = function(data, callback) {
    if(data.params) {
        var flashvars = parseFlashVariables(data.params);
        if(flashvars.video_href && flashvars.video_id) this.processFromVideoID(flashvars.video_id, callback);
        else this.processFromFlashVars(flashvars, callback);
        return;
    }
    // Embedded video
    var match = data.src.match(/\.com\/v\/([^&?]+)/);
    if(match) this.processFromVideoID(match[1], callback);
};

FacebookKiller.prototype.processFromFlashVars = function(flashvars, callback) {
    var sources = new Array();
    var isHD = flashvars.video_has_high_def === "1";
    if(flashvars.highqual_src) {
        sources.push({"url": decodeURIComponent(flashvars.highqual_src), "format": isHD ? "720p MP4" : "HQ MP4", "resolution": isHD ? 720 : 600, "isNative": true, "mediaType": "video"});
        if(flashvars.lowqual_src) sources.push({"url": decodeURIComponent(flashvars.lowqual_src), "format": "240p MP4", "resolution": 240, "isNative": true, "mediaType": "video"});
    } else if(flashvars.video_src) {
        sources.push({"url": decodeURIComponent(flashvars.video_src), "format": "240p MP4", "resolution": 240, "isNative": true, "mediaType": "video"});
    } else return;
    
    var posterURL, title;
    if(flashvars.thumb_url) posterURL = decodeURIComponent(flashvars.thumb_url);
    if(flashvars.video_title) title = decodeURIComponent(flashvars.video_title).replace(/\+/g, " ");
    var videoData = {
        "playlist": [{"title": title, "posterURL": posterURL, "sources": sources}]
    };
    callback(videoData);
};

FacebookKiller.prototype.processFromVideoID = function(videoID, callback) {
    var _this = this;
    var xhr = new XMLHttpRequest();
    var url = "https://www.facebook.com/video/video.php?v=" + videoID;
    xhr.open("GET", url, true);
    xhr.onload = function() {
        var callbackForEmbed = function(videoData) {
            videoData.playlist[0].siteInfo = {"name": "Facebook", "url": url};
            callback(videoData);
        };
        var regex = new RegExp("addVariable\\(\"([a-z_]*)\", \"([^\"]*)\"\\);", "g");
        _this.processFromFlashVars(parseWithRegExp(xhr.responseText, regex, parseUnicode), callbackForEmbed);
    };
    xhr.send(null);
};

