function BlipKiller() {
    this.name = "BlipKiller";
}

BlipKiller.prototype.canKill = function(data) {
    if(data.plugin != "Flash" || !safari.extension.settings["replaceFlash"]) return false;
    return data.src.indexOf("blip.tv") != -1;
};

BlipKiller.prototype.processElement = function(data, callback) {
    var isEmbed, url;
    var matches = data.location.match(/blip\.tv\/file\/([0-9]+)(?:[\/?]|$)/);
    if(!matches) matches = data.location.match(/[;?]id=([0-9]+)(?:;|$)/);
    if(matches) {
        url = "http://www.blip.tv/file/" + matches[1] + "/?skin=json&version=2&no_wrap=1";
    } else {
        matches = data.src.match(/blip\.tv\/play\/([^%]*)(?:%|$)/);
        if(matches) {
            url = "http://blip.tv/players/episode/" + matches[1] + "?skin=json&version=2&no_wrap=1";
            isEmbed = true;
        }
        else return;
    }
    
    var videoURL, siteInfo;
    var badgeLabel = "H.264";
    
    // USE JSON INSTEAD (has thumbnail info!)
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
        var json = JSON.parse(xhr.responseText);
        
        var ext;
        var availableFormats = new Array();
        for(var i = 0; i < json.additionalMedia.length; i++) {
            ext = json.additionalMedia[i].url.substr(-3);alert(ext);
            if(ext === "mp4" || ext === "m4v" || ext == "mov") {
                availableFormats[parseInt(json.additionalMedia[i].height)] = json.additionalMedia[i].url;
            }
        }
        
        for(var height in availableFormats) {
            if(height <= 360) videoURL = availableFormats[height];
            else if(safari.extension.settings["maxresolution"] > 0 && height <= 480) {
                videoURL = availableFormats[height];
            } else if((safari.extension.settings["maxresolution"] > 1 && height <= 720) || (safari.extension.settings["maxresolution"] > 2 && height <= 1080)) {
                videoURL = availableFormats[height];
                badgeLabel = "HD&nbsp;H.264";
            }
        }
        
        if(!videoURL) return;
        
        if(isEmbed) siteInfo = {"name": "Blip.tv", "url": "http://www.blip.tv/file/" + json.itemId};
        
        var videoData = {
            "playlist": [{"siteInfo": siteInfo, "mediaType": "video", "title": json.title, "posterURL": json.thumbnailUrl, "mediaURL": videoURL}],
            "badgeLabel": badgeLabel
        };
        callback(videoData);
    };
    xhr.send(null);
};
