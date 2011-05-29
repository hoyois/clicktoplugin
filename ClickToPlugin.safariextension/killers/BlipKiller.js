function BlipKiller() {}

BlipKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    return data.src.indexOf("blip.tv/") !== -1;
};

BlipKiller.prototype.process = function(data, callback) {
    var isEmbed = true, url;
    if(/^http:\/\/blip\.tv\//.test(data.location)) isEmbed =  false;
    var match = data.src.match(/blip\.tv\/play\/(.*)/);
    if(match) {
        match = decodeURIComponent(match[1]).split(".")[0];
        url = "http://blip.tv/players/episode/" + match + "?skin=json&version=2&no_wrap=1";
    } else return;
    
    var sources = new Array();
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
        var json = JSON.parse(xhr.responseText.replace(/\\'/g, "'"))[0]; // correct Blip.tv's invalid JSON
        
        var ext, format, height, width, isNative, mediaType = "video";
        for(var i = 0; i < json.additionalMedia.length; i++) {
            ext = json.additionalMedia[i].url.substr(json.additionalMedia[i].url.lastIndexOf(".") + 1).toUpperCase();
            if(ext === "MP4" || ext === "M4V" || ext === "MOV" || ext === "MPG" || ext === "MPEG") isNative = true;
            else if(ext === "MP3") {isNative = true; mediaType = "audio";}
            else if((ext === "FLV" && canPlayFLV) || (ext === "WMV" && canPlayWM)) isNative = false;
            else continue;
            
            format = json.additionalMedia[i].role;
            height = json.additionalMedia[i].media_height;
            if(!height) height = json.additionalMedia[i].height;
            width = json.additionalMedia[i].media_width;
            if(!width) width = json.additionalMedia[i].width;
            if(mediaType === "video") format += " (" + width + "x" + height + ")";
            format += " " + ext;
            sources.push({"url": json.additionalMedia[i].url, "format": format, "isNative": isNative, "mediaType": mediaType, "resolution": parseInt(height)});
        }
        
        var videoData = {
            "playlist": [{"title": unescapeHTML(json.title), "posterURL": json.thumbnailUrl, "sources": sources}]
        };
        if(isEmbed) videoData.playlist[0].siteInfo = {"name": "Blip.tv", "url": "http://www.blip.tv/file/" + json.itemId};
        callback(videoData);
    };
    xhr.send(null);
};
