function VimeoKiller() {}

VimeoKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    return (data.src.indexOf("vimeo.com/moogaloop") !== -1 || data.src.indexOf("vimeocdn.com/p/flash/moogalo") !== -1);
};

VimeoKiller.prototype.process = function(data, callback) {
    var videoID = null;
    if(data.params) videoID = parseFlashVariables(data.params).clip_id;
    if(!videoID) {
        var matches = data.src.match(/clip_id=([^&]+)/);
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
                var resolution = 720;
                if(xml.getElementsByTagName("height")[0] && xml.getElementsByTagName("height")[0].textContent === "1080") resolution = 1080;
                if(isNative || canPlayFLV) sources.push({"url": url + "hd", "format": resolution + "p " + (isNative ? "MP4" : "FLV"), "resolution": resolution, "isNative": isNative, "mediaType": "video", "noDownload": true});
            }
            if(isNative || canPlayFLV) sources.push({"url": url + "sd", "format": "360p " + (isNative ? "MP4" : "FLV"), "resolution": 360, "isNative": isNative, "mediaType": "video", "noDownload": true});
            var handleMIMEType2 = function(MIMEType) {
                if(MIMEType === "video/mp4") sources.push({"url": url + "mobile", "format": "Mobile MP4", "resolution": 240, "isNative": true, "mediaType": "video", "noDownload": true});
                
                if(xml.getElementsByTagName("thumbnail").length > 0) {
                    posterURL = xml.getElementsByTagName("thumbnail")[0].textContent;
                }
                if(xml.getElementsByTagName("caption").length > 0) {
                    title = xml.getElementsByTagName("caption")[0].textContent;
                }
                
                if(data.location.indexOf("vimeo.com/") === -1 || data.location === "http://vimeo.com/" || data.location.indexOf("player.vimeo.com/") !== -1) siteInfo = {"name": "Vimeo", "url": "http://vimeo.com/" + videoID};

                var videoData = {
                    "playlist": [{"siteInfo": siteInfo, "title": title, "posterURL": posterURL, "sources": sources}]
                };
                callback(videoData);
            };
            getMIMEType(url + "mobile", handleMIMEType2);
        };
        getMIMEType(url + "sd", handleMIMEType);
    };
    xhr.send(null);
};
