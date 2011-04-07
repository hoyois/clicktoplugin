function FacebookKiller() {}

FacebookKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    return /^https?:\/\/s-static\.ak\.facebook\.com\/rsrc\.php\/v[1-9]\/[a-zA-Z0-9]{2}\/r\/[0-9a-zA-Z_-]*\.swf/.test(data.src);
};

FacebookKiller.prototype.process = function(data, callback) {
    var flashvars = parseFlashVariables(data.params);
    if(flashvars.video_href) this.processFromHref(decodeURIComponent(flashvars.video_href), callback);
    else this.processFromFlashVars(flashvars, callback);
};

FacebookKiller.prototype.processFromFlashVars = function(flashvars, callback) {try{
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
    callback(videoData);}catch(e){alert(e)}
};

FacebookKiller.prototype.processFromHref = function(url, callback) {
    var _this = this;
    var xhr = new XMLHttpRequest();
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

