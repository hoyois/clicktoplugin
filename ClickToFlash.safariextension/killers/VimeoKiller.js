function VimeoKiller() {
    this.name = "VimeoKiller";
}

VimeoKiller.prototype.canKill = function(data) {
    return !!data.src.match("moogaloop");
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
    var videoURL = null;
    var badgeLabel = "H.264";
    
    var req = new XMLHttpRequest();
    // this request needs to be synchronous, otherwise Vimeo scripts cause errors
    req.open('GET', "http://www.vimeo.com/moogaloop/load/clip:" + videoID + "/", false);
    // BEGIN DEBUG
    if(safari.extension.settings["debug"]) {
        if(!confirm("Killer '" + this.name + "' is about to send a synchronous AJAX request to:\n\n" + "http://www.vimeo.com/moogaloop/load/clip:" + videoID + "/")) return;
    }
    // END DEBUG
    req.send(null);
    
    if (safari.extension.settings["maxresolution"] > 1) {
        if(req.responseXML.getElementsByTagName("isHD").length > 0) {
            if(req.responseXML.getElementsByTagName("isHD")[0].childNodes[0].nodeValue == "1") badgeLabel = "HD&nbsp;H.264";
        }
    }
    if(req.responseXML.getElementsByTagName("request_signature").length > 0 && req.responseXML.getElementsByTagName("request_signature_expires").length > 0) {
        videoURL = "http://www.vimeo.com/moogaloop/play/clip:" + videoID + "/" + req.responseXML.getElementsByTagName("request_signature")[0].childNodes[0].nodeValue+ "/" + req.responseXML.getElementsByTagName("request_signature_expires")[0].childNodes[0].nodeValue+"/?q=" + ((badgeLabel == "H.264") ? "mobile" : "hd");
    }
    if(req.responseXML.getElementsByTagName("thumbnail").length > 0) {
        posterURL = req.responseXML.getElementsByTagName("thumbnail")[0].childNodes[0].nodeValue;
    }
    var siteInfo = null;
    if(!data.location.match("vimeo.com/") || data.location == "http://vimeo.com/") siteInfo = {"name": "Vimeo", "url": "http://vimeo.com/" + videoID};
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
            // BEGIN DEBUG
            else if(safari.extension.settings["debug"]) {
                alert("Video found by killer 'VimeoKiller' has MIME type " + MIMEType + " and cannot be played natively by QuickTime.");
            }               
            // END DEBUD
        };
        // BEGIN DEBUG
        if(safari.extension.settings["debug"]) {
            if(!confirm("Killer '" + this.name + "' is about to send an asynchronous AJAX request to:\n\n" + videoURL)) return;
        }
        // END DEBUG
        getMIMEType(videoURL, handleMIMEType);
    }
};
