function VeohKiller() {
    this.name = "VeohKiller";
}

VeohKiller.prototype.canKill = function(data) {
    return (safari.extension.settings["QTbehavior"] > 1 && canPlayFLV && data.src.match("veoh.com/static/swf/webplayer"));
};

VeohKiller.prototype.processElement = function(data, callback) {
    var videoID = null;
    var isEmbed = false;
    if(data.params) videoID = getFlashVariable(data.params, "permalinkId");
    else { // embedded video
        isEmbed = true;
        var matches = data.src.match(/permalinkId=([^&]*)(?=&)/);
        if(matches) videoID = matches[0].replace("permalinkId=","");
    }
    var posterURL = null;
    var videoURL = null;
    
    var request = new XMLHttpRequest();
    request.open('GET', "http://www.veoh.com/rest/video/" + videoID + "/details", true);
    request.onload = function() {
        var element = request.responseXML.getElementsByTagName("video")[0];
        if(element) {
            videoURL = element.getAttribute("fullPreviewHashPath"); //"fullPreviewHashLowPath"
            posterURL = element.getAttribute("fullHighResImagePath");
        }
    
        var videoData = {
            "playlist": [{"mediaType": "video",  "posterURL": posterURL, "mediaURL": videoURL}],
            "badgeLabel": "Video" // There's no HD on Veoh, as far as I see, despite what they say. It's < 360p! Am I doing something wrong??
        }
        if(isEmbed) videoData.playlist[0].siteInfo = {"name": "Veoh", "url": "http://www.veoh.com/browse/videos#watch%3D" + videoID};
        callback(videoData);
    };
    // BEGIN DEBUG
    if(safari.extension.settings["debug"]) {
        if(!confirm("Killer '" + this.name + "' is about to send an asynchronous AJAX request to:\n\n" + "http://www.veoh.com/rest/video/" + videoID + "/details")) return;
    }
    // END DEBUG
    request.send(null);
};