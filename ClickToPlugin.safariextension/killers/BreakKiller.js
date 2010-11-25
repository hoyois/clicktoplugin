function BreakKiller() {
    this.name = "BreakKiller";
}

BreakKiller.prototype.canKill = function(data) {
    if(data.plugin != "Flash" || !safari.extension.settings["replaceFlash"]) return false;
    if(data.src.indexOf(".break.com/static/") != -1) {data.onsite = true; return true;}
    if(data.src.indexOf("embed.break.com/") != -1) {data.onsite = false; return true;}
    return false;
};

BreakKiller.prototype.processElement = function(data, callback) {
    /*var videoURL = getFlashVariable(data.params, "videoPath");
    videoURL = videoURL.replace(/flv$/, "mp4");*/
    //var videoHash = getFlashVariable(data.params, "icon");
    
    var url;
    if(data.onsite) {
        url = getFlashVariable(data.params, "sLink");
        if(!url) url = "http://view.break.com/" + getFlashVariable(data.params, "iContentID");
    } else {
        // WARNING only works with [0-9] IDs...
        var matches = data.src.match(/embed\.break\.com\/([^?]+)(?:\?|$)/);
        if(matches) url = "http://view.break.com/" + matches[1];
        else return;
    }
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        var videoURL;
        var badgeLabel = "H.264";
        var matches = xhr.responseText.match(/sGlobalFileNameHDD='([^']*)'/);
        if(safari.extension.settings["maxresolution"] > 1 && matches) {
            videoURL = matches[1];
            badgeLabel = "HD&nbsp;H.264";
        } else {
            matches = xhr.responseText.match(/sGlobalFileNameHD='([^']*)'/);
            if(safari.extension.settings["maxresolution"] > 0 && matches) videoURL = matches[1];
            else {
                matches = xhr.responseText.match(/sGlobalFileName='([^']*)'/);
                if(matches) videoURL = matches[1];
            }
        }
        if(!videoURL) return;
        if(!/.mp4$/.test(videoURL)) videoURL += ".mp4";
        
        matches = xhr.responseText.match(/sGlobalToken='([^']*)'/);
        if(!matches) return;
        videoURL += "?" + matches[1];
        
        var posterURL, title, siteInfo;
        matches = xhr.responseText.match(/sGlobalThumbnailURL='([^']*)'/);
        if(matches) posterURL = matches[1];
        matches = xhr.responseText.match(/id="vid_title"\scontent="([^"]*)">/);
        if(matches) title = matches[1];
        if(!data.onsite || data.location === "http://www.break.com/") siteInfo = {"name": "Break.com", "url": url};
        //var posterURL = getFlashVariable(data.params, "thumbnailURL");
        //var title = decodeURIComponent(getFlashVariable(data.params, "sVidTitle"));

        var videoData = {
            "playlist": [{"mediaType": "video", "title": title, "posterURL": posterURL, "mediaURL": videoURL, "siteInfo": siteInfo}],
            "badgeLabel": badgeLabel
        };
        callback(videoData);
    };
    xhr.send(null);
};
