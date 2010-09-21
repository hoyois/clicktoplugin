function VimeoKiller() {
    this.name = "VimeoKiller";
}

VimeoKiller.prototype.canKill = function(data) {
    if(data.plugin != "Flash" || !safari.extension.settings["replaceFlash"]) return false;
    return (data.src.match("moogaloop") || data.src.match("moogalover"));
};

VimeoKiller.prototype.processElement = function(data, callback) {
    var videoID = null;
    if(data.params) videoID = getFlashVariable(data.params, "clip_id");
    else {
        var matches = data.src.match(/clip_id=([^&]*)(?=&)/);
        if(matches) videoID = matches[0].replace("clip_id=","");
    }
    if(!videoID) return;
    
    var posterURL = null;
    var videoURL = null;//"/play_redirect?clip_id=" + videoID + "&quality=mobile&codecs=H264";
    var badgeLabel = "H.264";
    //callback({"playlist": [{"mediaType": "video", "mediaURL": videoURL}]}); return;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://www.vimeo.com/moogaloop/load/clip:" + videoID + "/", true);
    xhr.onload = function() {
        if(xhr.responseXML.getElementsByTagName("error").length > 0) { // Vimeo Plus non-embeddable video
            // In this case videoURLs of the form
            // "http://www.vimeo.com/play_redirect?clip_id=" + videoID + "&quality=mobile&codecs=H264"
            // will work but I don't know how to find out if the quality/codec combination exists,
            // because AJAX returns 403 (as will the download link).
            // Given that 99% of videos have sd,hd/H264, could blindly go with that
            // (and I think mobile/H264 always exists). Leave as Flash for now...
            return;
        }
        if (safari.extension.settings["maxresolution"] > 1) {
            if(xhr.responseXML.getElementsByTagName("isHD").length > 0) {
                if(xhr.responseXML.getElementsByTagName("isHD")[0].childNodes[0].nodeValue == "1") badgeLabel = "HD&nbsp;H.264";
            }
        }
        if(xhr.responseXML.getElementsByTagName("request_signature").length > 0 && xhr.responseXML.getElementsByTagName("request_signature_expires").length > 0) {
            videoURL = "http://www.vimeo.com/moogaloop/play/clip:" + videoID + "/" + xhr.responseXML.getElementsByTagName("request_signature")[0].childNodes[0].nodeValue+ "/" + xhr.responseXML.getElementsByTagName("request_signature_expires")[0].childNodes[0].nodeValue+"/?q=" + ((badgeLabel == "H.264") ? "sd" : "hd");
        }
        if(xhr.responseXML.getElementsByTagName("thumbnail").length > 0) {
            posterURL = xhr.responseXML.getElementsByTagName("thumbnail")[0].childNodes[0].nodeValue;
        }
        var siteInfo = null;
        if(!data.location.match("vimeo.com/") || data.location == "http://vimeo.com/" || data.location.match("player.vimeo.com/")) siteInfo = {"name": "Vimeo", "url": "http://vimeo.com/" + videoID};
        var videoData = {
            "playlist": [{"siteInfo": siteInfo, "mediaType": "video", "posterURL": posterURL, "mediaURL": videoURL}],
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
