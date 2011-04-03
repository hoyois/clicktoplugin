function BlipKiller() {}

BlipKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    return data.src.indexOf("blip.tv/") !== -1;
};

BlipKiller.prototype.process = function(data, callback) {
    var isEmbed, url;
    var matches = data.location.match(/blip\.tv\/file\/([0-9]+)(?:[\/?]|$)/);
    if(!matches) matches = data.location.match(/[;?]id=([0-9]+)(?:;|$)/);
    if(matches) {
        url = "http://www.blip.tv/file/" + matches[1] + "/?skin=json&version=2&no_wrap=1";
    } else {
        matches = data.src.match(/blip\.tv\/play\/([^%]*)/);
        if(matches) {
            url = "http://blip.tv/players/episode/" + matches[1] + "?skin=json&version=2&no_wrap=1";
            isEmbed = true;
        }
        else return;
    }
    
    var sources = new Array();
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
        var json = JSON.parse(xhr.responseText.replace(/\\'/g, "'")); // correct Blip.tv's invalid JSON
        
        var ext, format, isNative;
        for(var i = 0; i < json.additionalMedia.length; i++) {
            ext = json.additionalMedia[i].url.substr(json.additionalMedia[i].url.lastIndexOf(".") + 1).toUpperCase();
            if(ext === "MP4" || ext === "M4V" || ext === "MOV" || ext === "MPG" || ext === "MPEG" || ext === "MP3") isNative = true;
            else if((ext === "FLV" && canPlayFLV) || (ext === "WMV" && canPlayWM)) isNative = false;
            else continue;
            
            format = json.additionalMedia[i].role + " (" + json.additionalMedia[i].width + "x" + json.additionalMedia[i].height + ") " + ext;
            /*if(json.additionalMedia[i].role === "Source") {
                bestSource = sources.length;
            }*/
            sources.push({"url": json.additionalMedia[i].url, "format": format, "isNative": isNative, "mediaType": "video", "resolution": parseInt(json.additionalMedia[i].height)});
        }
        
        var videoData = {
            "playlist": [{"title": unescapeHTML(json.title), "posterURL": json.thumbnailUrl, "sources": sources}]
        };
        if(isEmbed) videoData.playlist[0].siteInfo = {"name": "Blip.tv", "url": "http://www.blip.tv/file/" + json.itemId};
        callback(videoData);
    };
    xhr.send(null);
};
