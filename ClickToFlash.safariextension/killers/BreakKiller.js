function BreakKiller() {
    this.name = "BreakKiller";
}

BreakKiller.prototype.canKill = function(data) {
    if(data.src.indexOf(".break.com/static/") != -1) {data.onsite = true; return true;}
    if(data.src.indexOf("embed.break.com/") != -1) {data.onsite = false; return true;}
    return false;
};

BreakKiller.prototype.processElement = function(data, callback) {
    var videoURL, videoHash, url;
    if(data.onsite) {
        videoURL = getFlashVariable(data.params, "videoPath");
        videoHash = getFlashVariable(data.params, "icon");
        url = getFlashVariable(data.params, "sLink");
        if(!url) {
            var videoID = getFlashVariable(data.params, "iContentID");
            if(videoID) url = "http://view.break.com/" + videoID;
            else return;
        }
    } else {
        // only works with the newer [0-9] IDs...
        var matches = data.src.match(/embed\.break\.com\/([^?]+)(?:\?|$)/);
        if(matches) url = "http://view.break.com/" + matches[1];
        else return;
    }
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        var badgeLabel = "H.264";
        var matches = xhr.responseText.match(/sGlobalFileNameHDD=['"]([^'"]*)['"]/);
        if(safari.extension.settings["maxresolution"] > 1 && matches) {
            videoURL = matches[1];
            badgeLabel = "HD&nbsp;H.264";
        } else {
            matches = xhr.responseText.match(/sGlobalFileNameHD=['"]([^'"]*)['"]/);
            if(safari.extension.settings["maxresolution"] > 0 && matches) videoURL = matches[1];
            else {
                matches = xhr.responseText.match(/sGlobalFileName=['"]([^'"]*)['"]/);
                if(matches) videoURL = matches[1];
            }
        }
        if(!videoURL) return;
        videoURL = videoURL.replace(/\.flv$/, ".mp4");
        if(!/\.mp4$/.test(videoURL)) videoURL += ".mp4";
        
        if(!videoHash) {
            matches = xhr.responseText.match(/sGlobalToken=['"]([^'"]*)['"]/);
            if(!matches) return;
            videoHash = matches[1];
        }
        videoURL += "?" + videoHash;
        
        var posterURL, title, siteInfo;
        matches = xhr.responseText.match(/sGlobalThumbnailURL=['"]([^'"]*)['"]/);
        if(matches) posterURL = matches[1];
        matches = xhr.responseText.match(/!!!&amp;body=(.*?)%0d/);
        if(matches) title = decodeURIComponent(matches[1]);
        if(!data.onsite || data.location === "http://www.break.com/") siteInfo = {"name": "Break.com", "url": url};

        var videoData = {
            "playlist": [{"mediaType": "video", "title": title, "posterURL": posterURL, "mediaURL": videoURL, "siteInfo": siteInfo}],
            "badgeLabel": badgeLabel
        };
        callback(videoData);
    };
    xhr.send(null);
};
