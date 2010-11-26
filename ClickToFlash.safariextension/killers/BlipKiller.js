function BlipKiller() {
    this.name = "BlipKiller";
}

BlipKiller.prototype.canKill = function(data) {
    return data.src.indexOf("blip.tv/") != -1;
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
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
        var json = JSON.parse(xhr.responseText.replace(/\\'/g, "'")); // correct Blip.tv's invalid JSON
        
        var availableFormats = new Array();
        var hasH264Format = false;
        var ext, height, source;
        for(var i = 0; i < json.additionalMedia.length; i++) {
            ext = json.additionalMedia[i].url.substr(-3).toLowerCase();
            if(ext === "mp4" || ext === "m4v" || ext === "mov" || ext === "mpg") {
                hasH264Format = true;
                ext = true;
            } else {
                if((ext === "flv" && canPlayFLV) || (ext === "wmv" && canPlayWM)) ext = false;
                else continue;
            }
            height = parseInt(json.additionalMedia[i].height);
            if(json.additionalMedia[i].role === "Source") {
                source = {"height": height, "isH264": ext, "url": json.additionalMedia[i].url};
                continue;
            }
            if(availableFormats[height] && availableFormats[height].isH264) continue;
            availableFormats[height] = {"isSource": json.additionalMedia[i].role === "Source", "isH264": ext, "url": json.additionalMedia[i].url};
        }
        
        var assignVideoURL = function(height, isH264, url) {
            if(safari.extension.settings["QTbehavior"] === 0 && !isH264) return;
            if(safari.extension.settings["QTbehavior"] === 1 && !isH264 && hasH264Format) return;
            if(height <= 360 || (safari.extension.settings["maxresolution"] > 0 && height <= 480)) {
                videoURL = url;
                badgeLabel = isH264 ? "H.264" : "Video";
            }
            else if((safari.extension.settings["maxresolution"] > 1 && height <= 720) || (safari.extension.settings["maxresolution"] > 2 && height <= 1080)) {
                videoURL = url;
                badgeLabel = isH264 ? "HD&nbsp;H.264" : "HD&nbsp;Video";
            }
        };
        
        for(var h in availableFormats) {
            assignVideoURL(h, availableFormats[h].isH264, availableFormats[h].url);
        }
        if(source) assignVideoURL(source.height, source.isH264, source.url);
        
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
