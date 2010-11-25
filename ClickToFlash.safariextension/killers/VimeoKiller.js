function VimeoKiller() {
    this.name = "VimeoKiller";
}

VimeoKiller.prototype.canKill = function(data) {
    return (data.src.indexOf("moogaloop") != -1 || data.src.indexOf("moogalover") != -1);
};

VimeoKiller.prototype.processElement = function(data, callback) {
    var videoID = null;
    if(data.params) videoID = getFlashVariable(data.params, "clip_id");
    if(!videoID) {
        var matches = data.src.match(/clip_id=([^&]+)(?:&|$)/);
        if(matches) videoID = matches[1];
    }
    if(!videoID) return;
    
    var title, posterURL, videoURL, siteInfo;
    var badgeLabel = "H.264";
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://www.vimeo.com/moogaloop/load/clip:" + videoID + "/local/", true);
    xhr.onload = function() {
        var xml = xhr.responseXML;
        /*if(xml.getElementsByTagName("error").length > 0) { // never happened
            // Try this as a last resort (will not work if H264 version doesn't exist)
            videoURL = "http://www.vimeo.com/play_redirect?clip_id=" + videoID + "&quality=" + (safari.extension.settings["maxresolution"] > 1 ? "hd" : "sd") + "&codecs=H264";
            if (safari.extension.settings["maxresolution"] > 1) badgeLabel = "HD H.264";
            noSniff = true; // must remove the 'Download Video' option
            return;
        }*/
        
        if (safari.extension.settings["maxresolution"] > 1) {
            if(xml.getElementsByTagName("isHD").length > 0) {
                if(xml.getElementsByTagName("isHD")[0].textContent === "1") badgeLabel = "HD&nbsp;H.264";
            }
        }
        
        if(xml.getElementsByTagName("request_signature").length > 0 && xml.getElementsByTagName("request_signature_expires").length > 0) {
            videoURL = "http://www.vimeo.com/moogaloop/play/clip:" + videoID + "/" + xml.getElementsByTagName("request_signature")[0].textContent + "/" + xml.getElementsByTagName("request_signature_expires")[0].textContent + "/?q=" + ((badgeLabel === "H.264") ? "sd" : "hd");
        } else return;
        
        if(xml.getElementsByTagName("thumbnail").length > 0) {
            posterURL = xml.getElementsByTagName("thumbnail")[0].textContent;
        }
        if(xml.getElementsByTagName("caption").length > 0) {
            title = xml.getElementsByTagName("caption")[0].textContent;
        }
        
        if(data.location.indexOf("vimeo.com/") === -1 || data.location == "http://vimeo.com/" || data.location.indexOf("player.vimeo.com/") !== -1) siteInfo = {"name": "Vimeo", "url": "http://vimeo.com/" + videoID};
        
        var videoData = {
            "playlist": [{"siteInfo": siteInfo, "mediaType": "video", "title": title, "posterURL": posterURL, "mediaURL": videoURL}],
            "badgeLabel": badgeLabel
        };

        // Some videos on Vimeo are FLV; need to check that this is not the case if user doesn't want them
        if(videoURL) {
            if(safari.extension.settings["QTbehavior"] > 1 && canPlayFLV) {
                callback(videoData);
                return;
            }
            var handleMIMEType = function(MIMEType) {
                if(MIMEType.split(";")[0] != "video/x-flv") {
                    callback(videoData);
                } 
            };
            getMIMEType(videoURL, handleMIMEType);
        }
    };
    xhr.send(null);
};
