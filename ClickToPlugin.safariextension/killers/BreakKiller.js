function BreakKiller() {}

BreakKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    if(data.src.indexOf(".break.com/static/") !== -1) {data.onsite = true; return true;}
    if(data.src.indexOf("embed.break.com/") !== -1) {data.onsite = false; return true;}
    return false;
};

BreakKiller.prototype.process = function(data, callback) {
    var videoURL, posterURL, videoHash, url;
    if(data.onsite) {
        var flashvars = parseFlashVariables(data.params);
        videoURL = flashvars.videoPath;//??
        posterURL = flashvars.thumbnailURL;
        videoHash = flashvars.icon;
        url = flashvars.sLink;
        if(!url) {
            var videoID = flashvars.iContentID;
            if(videoID) url = "http://view.break.com/" + videoID;
            else return;
        }
    } else {
        // only works with the newer [0-9] IDs...
        var matches = data.src.match(/embed\.break\.com\/([^?]+)/);
        if(matches) url = "http://view.break.com/" + matches[1];
        else return;
    }
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        var sources = new Array();
        if(!videoHash) {
            matches = xhr.responseText.match(/sGlobalToken=['"]([^'"]*)['"]/);
            if(!matches) return;
            videoHash = matches[1];
        }
        var matches = xhr.responseText.match(/sGlobalFileNameHDD=['"]([^'"]*)['"]/);
        if(matches) {
            sources.push({"url": matches[1].replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "720p MP4", "resolution": 720, "isNative": true, "mediaType": "video"});
        }
        matches = xhr.responseText.match(/sGlobalFileNameHD=['"]([^'"]*)['"]/);
        if(matches) {
            sources.push({"url": matches[1].replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "480p MP4", "resolution": 480, "isNative": true, "mediaType": "video"});
        }
        matches = xhr.responseText.match(/sGlobalFileName=['"]([^'"]*)['"]/);
        if(matches) {
            sources.push({"url": matches[1].replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "360p MP4", "resolution": 360, "isNative": true, "mediaType": "video"});
        }
        if(sources.length === 0) {
            if(videoURL) sources.push({"url": videoURL.replace(/\.flv$/, "").replace(/\.mp4$/, "") + ".mp4?" + videoHash, "format": "360p MP4", "resolution": 360, "isNative": true, "mediaType": "video"});
            else return;
        }
        
        var title, siteInfo;
        if(!posterURL) {
            matches = xhr.responseText.match(/sGlobalThumbnailURL=['"]([^'"]*)['"]/);
            if(matches) posterURL = matches[1];
        }
        matches = xhr.responseText.match(/!!!&amp;body=(.*?)%0d/);
        if(matches) title = decodeURIComponent(matches[1]);
        if(!data.onsite || data.location === "http://www.break.com/") siteInfo = {"name": "Break", "url": url};
        
        var videoData = {
            "playlist": [{"title": title, "posterURL": posterURL, "sources": sources, "siteInfo": siteInfo}]
        };
        callback(videoData);
    };
    xhr.send(null);
};
