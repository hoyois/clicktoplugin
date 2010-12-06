function BIMKiller() { // Broadcast Interactive Media
    this.name = "BIMKiller";
}

BIMKiller.prototype.canKill = function(data) {
    return (/bimVideoPlayer[0-9]*\.swf$/.test(data.src) && hasFlashVariable(data.params, "mediaXML"));
};

BIMKiller.prototype.processElement = function(data, callback) {
    var url = decodeURIComponent(getFlashVariable(data.params, "mediaXML"));
    if(!url) return;
    
    var title, posterURL, videoURL;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
        var xml = xhr.responseXML;
        
        if(xml.getElementsByTagName("h264").length > 0) {
            videoURL = xml.getElementsByTagName("h264")[0].textContent;
        } else return;
        if(xml.getElementsByTagName("image").length > 0) {
            posterURL = xml.getElementsByTagName("image")[0].textContent;
        }
        if(xml.getElementsByTagName("title").length > 0) {
            title = xml.getElementsByTagName("title")[0].textContent;
        }
        
        var videoData = {
            "playlist": [{"mediaType": "video", "title": title, "posterURL": posterURL, "mediaURL": videoURL}],
            "badgeLabel": "H.264"
        };
        callback(videoData);
    };
    xhr.send(null);
};
