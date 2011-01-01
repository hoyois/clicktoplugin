function BIMKiller() {}

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
            "playlist": [{"posterURL": posterURL, "title": title, "sources": [{"url": videoURL, "isNative": true}]}]
        };
        callback(videoData);
    };
    xhr.send(null);
};
