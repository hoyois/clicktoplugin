function VimeoKiller() {}

VimeoKiller.prototype.canKill = function(data) {
    return (data.src.indexOf("vimeo.com/moogaloop") != -1 || data.src.indexOf("vimeocdn.com/flash/moogaloop") != -1 || data.src.indexOf("moogalover") != -1);
};

VimeoKiller.prototype.processElement = function(data, callback) {
    var videoID = null;
    if(data.params) videoID = getFlashVariable(data.params, "clip_id");
    if(!videoID) {
        var matches = data.src.match(/clip_id=([^&]+)(?:&|$)/);
        if(matches) videoID = matches[1];
    }
    if(!videoID) return;
    
    var title, posterURL, siteInfo;
    var sources = new Array();
    var isNative = true;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://www.vimeo.com/moogaloop/load/clip:" + videoID + "/local/", true);
    xhr.onload = function() {
        var xml = xhr.responseXML;
        
        var url = "http://www.vimeo.com/moogaloop/play/clip:" + videoID + "/" + xml.getElementsByTagName("request_signature")[0].textContent + "/" + xml.getElementsByTagName("request_signature_expires")[0].textContent + "/?q=";
        // As of December 2010, these URLs are not downloadable, because Vimeo returns 404 to
        // the Downloads window's user agent (Safari CFNetwork Darwin).
        // It correctly redirects to the video URL for Safari Mac and CoreMedia user agents, so
        // it's still possible to download the video by copying the final URL from the browser...
        // Unfortunately it's impossible to get using XMLHttpRequest.
        
        var handleMIMEType = function(MIMEType) {
            if(MIMEType.split(";")[0] === "video/x-flv") isNative = false;
            if(xml.getElementsByTagName("isHD").length > 0 && xml.getElementsByTagName("isHD")[0].textContent === "1") {
                if(isNative || canPlayFLV) sources.push({"url": url + "hd", "format": "720p " + (isNative ? "MP4" : "FLV"), "resolution": 720, "isNative": isNative});
            }
            if(isNative || canPlayFLV) sources.push({"url": url + "sd", "format": "360p " + (isNative ? "MP4" : "FLV"), "resolution": 360, "isNative": isNative});
            var handleMIMEType2 = function(MIMEType) {
                if(MIMEType === "video/mp4") sources.push({"url": url + "mobile", "format": "Mobile MP4", "resolution": 240, "isNative": true});
                
                if(xml.getElementsByTagName("thumbnail").length > 0) {
                    posterURL = xml.getElementsByTagName("thumbnail")[0].textContent;
                }
                if(xml.getElementsByTagName("caption").length > 0) {
                    title = xml.getElementsByTagName("caption")[0].textContent;
                }
                
                if(data.location.indexOf("vimeo.com/") === -1 || data.location == "http://vimeo.com/" || data.location.indexOf("player.vimeo.com/") !== -1) siteInfo = {"name": "Vimeo", "url": "http://vimeo.com/" + videoID};

                var videoData = {
                    "playlist": [{"siteInfo": siteInfo, "mediaType": "video", "title": title, "posterURL": posterURL, "sources": sources}]
                };
                callback(videoData);
            };
            getMIMEType(url + "mobile", handleMIMEType2);
        };
        getMIMEType(url + "sd", handleMIMEType);
    };
    xhr.send(null);
};
