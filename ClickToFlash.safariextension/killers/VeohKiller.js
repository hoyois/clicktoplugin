function VeohKiller() {}

VeohKiller.prototype.canKill = function(data) {
    return (data.src.indexOf("veoh.com/static/swf/webplayer") != -1 || data.src.indexOf("veohplayer.swf") != -1);
};

VeohKiller.prototype.processElement = function(data, callback) {
    var isEmbed = false;
    var videoID = getFlashVariable(data.params, "permalinkId");
    if(!videoID) { // embedded video
        isEmbed = true;
        var matches = data.src.match(/permalinkId=([^&]+)(?:&|$)/);
        if(matches) videoID = matches[1];
        else return;
    }
    var title, posterURL, sources;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://www.veoh.com/rest/video/" + videoID + "/details", true);
    xhr.onload = function() {
        var element = xhr.responseXML.getElementsByTagName("video")[0];
        if(!element) return;
        
        videoURL = element.getAttribute("fullPreviewHashPath"); //"fullPreviewHashLowPath"
        
        var sources = [{"url": videoURL, "isNative": false}];
        
        if(/\.mp4\?/.test(videoURL)) {
            sources[0].isNative = true;
        } else if(!canPlayFLV) return;
        
        posterURL = element.getAttribute("fullHighResImagePath");
        title = element.getAttribute("title");
        
        var videoData = {
            "playlist": [{"mediaType": "video", "title": title, "posterURL": posterURL, "sources": sources}]
        }
        if(isEmbed || data.location === "http://www.veoh.com/") videoData.playlist[0].siteInfo = {"name": "Veoh", "url": "http://www.veoh.com/browse/videos#watch%3D" + videoID};
        callback(videoData);
    };
    xhr.send(null);
};