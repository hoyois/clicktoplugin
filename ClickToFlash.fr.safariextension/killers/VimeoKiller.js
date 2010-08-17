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
    
    var request = new XMLHttpRequest();
	request.open('GET', "http://www.vimeo.com/moogaloop/load/clip:" + videoID + "/", false);
    //alert("sending AJAX request...");
    // BEGIN DEBUG
    if(safari.extension.settings["debug"]) {
        if(!confirm("Killer '" + this.name + "' is about to send a synchronous AJAX request to:\n\n" + "http://www.vimeo.com/moogaloop/load/clip:" + videoID + "/")) return;
    }
    // END DEBUG
	request.send(null);
    //alert("request sent! Answer:\n\n" + request.responseText);
	var responseXML = new DOMParser().parseFromString(request.responseText,"text/xml");
    
    if (safari.extension.settings["maxresolution"] > 1) {
        if(responseXML.getElementsByTagName("isHD").length > 0) {
            if(responseXML.getElementsByTagName("isHD")[0].childNodes[0].nodeValue == "1") badgeLabel = "HD&nbsp;H.264";
        }
    }
	if(responseXML.getElementsByTagName("request_signature").length > 0 && responseXML.getElementsByTagName("request_signature_expires").length > 0) {
		videoURL = "http://www.vimeo.com/moogaloop/play/clip:" + videoID + "/" + responseXML.getElementsByTagName("request_signature")[0].childNodes[0].nodeValue+ "/" + responseXML.getElementsByTagName("request_signature_expires")[0].childNodes[0].nodeValue+"/?q=" + ((badgeLabel == "H.264") ? "mobile" : "hd");
	}
    if(responseXML.getElementsByTagName("thumbnail").length > 0) {
        posterURL = responseXML.getElementsByTagName("thumbnail")[0].childNodes[0].nodeValue;
    }
	var siteInfo = null;
	if(!data.location.match("vimeo.com/")) siteInfo = {"name": "Vimeo", "url": "http://vimeo.com/" + videoID};
    var videoData = {
        "playlist": [{"siteInfo": siteInfo, "mediaType": "video", "posterURL": posterURL, "mediaURL": videoURL}],
        "badgeLabel": badgeLabel
    };
    
    // Some videos on Vimeo are FLV; need to check that this is not the case, cause Safari can't handle them
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
        /*request = new XMLHttpRequest();
        request.open('HEAD', videoURL, true);
        var gotContentType = false;
        request.onreadystatechange = function () {
            if(!gotContentType && request.getResponseHeader('Content-Type')) {
                gotContentType = true;
                if(request.getResponseHeader('Content-Type') != "video/x-flv") {
                    callback(videoData);
                } 
                // BEGIN DEBUG
                else if(safari.extension.settings["debug"]) {
                    alert("Video found by killer 'VimeoKiller' has MIME type " + request.getResponseHeader('Content-Type') + " and cannot be played by Safari.");
                }                
                // END DEBUD
                request.abort();
            }
        };
        // BEGIN DEBUG
        if(safari.extension.settings["debug"]) {
            if(!confirm("Killer '" + this.name + "' is about to send an asynchronous AJAX request to:\n\n" + videoURL)) return;
        }
        // END DEBUG
        request.send(null);*/
        //alert(request.responseText);
        //alert(req.getResponseHeader('Content-Type').split(';')[0]);
    }
};
