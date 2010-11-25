function VeohKiller() {
    this.name = "VeohKiller";
}

VeohKiller.prototype.canKill = function(data) {
    return (safari.extension.settings["QTbehavior"] > 1 && canPlayFLV && data.src.indexOf("veoh.com/static/swf/webplayer") != -1);
};

VeohKiller.prototype.processElement = function(data, callback) {
    var videoID = null;
    var isEmbed = false;
    if(data.params) videoID = getFlashVariable(data.params, "permalinkId");
    else { // embedded video
        isEmbed = true;
        var matches = data.src.match(/permalinkId=([^&]+)(?:&|$)/);
        if(matches) videoID = matches[1];
    }
    var title, posterURL, videoURL;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://www.veoh.com/rest/video/" + videoID + "/details", true);
    xhr.onload = function() {
        var element = xhr.responseXML.getElementsByTagName("video")[0];
        if(element) {
            videoURL = element.getAttribute("fullPreviewHashPath"); //"fullPreviewHashLowPath"
            posterURL = element.getAttribute("fullHighResImagePath");
            title = element.getAttribute("title");
        }
    
        var videoData = {
            "playlist": [{"mediaType": "video", "title": title, "posterURL": posterURL, "mediaURL": videoURL}],
            "badgeLabel": "Video" // There's no HD on Veoh, as far as I see, despite what they say. It's < 360p! Am I doing something wrong??
        }
        if(isEmbed || data.location === "http://www.veoh.com/") videoData.playlist[0].siteInfo = {"name": "Veoh", "url": "http://www.veoh.com/browse/videos#watch%3D" + videoID};
        callback(videoData);
    };
    xhr.send(null);
};