function BIMKiller() { // Broadcast Interactive Media
    this.name = "BIMKiller";
}

BIMKiller.prototype.canKill = function(data) {
    if(data.plugin != "Flash") return false;
    return (/bimVideoPlayer[^\/.]*\.swf$/.test(data.src) && hasFlashVariable(data.params, "mediaXML"));
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
            "playlist": [{"mediaType": "video", "title": title, "posterURL": posterURL, "sources": [{"url": videoURL}], "defaultSource": 0}],
            "badgeLabel": "H.264"
        };
        callback(videoData);
    };
    xhr.send(null);
};
