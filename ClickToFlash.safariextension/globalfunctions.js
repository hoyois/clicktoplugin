function makeAbsoluteURI(url, location) {
    if(!url) return "";
    if(/\/\//.test(url)) return url; // already absolute
    location = location.replace(/\/[^\/]*$/, "/");
    if(url[0]=="/") url = url.substring(1);
    if(url[0]=="/") {
        url = url.substring(1);
        location = location.replace(/\/\/.*$/,"//");
    }
    return location + url;
}

function getFlashVariable(flashvars, key) {
    if (!flashvars) return "";
    var flashVarsArray = flashvars.split("&");
    for (var i = 0; i < flashVarsArray.length; i++) {
        var keyValuePair = flashVarsArray[i].split("=");
        if (keyValuePair[0] == key) {
            return keyValuePair[1];
        }
    }
    return "";
}

function getMIMEType(resourceURL, handleMIMEType) {
    request = new XMLHttpRequest();
    request.open('HEAD', resourceURL, true);
    var gotContentType = false;
    request.onreadystatechange = function () {
        if(!gotContentType && request.getResponseHeader('Content-Type')) {
            gotContentType = true;
            handleMIMEType(request.getResponseHeader('Content-Type'));
            request.abort();
        }
    };
    request.send(null);
}

function canPlayWithQTPlugin(MIMEType) {
    return !!document.createElement("video").canPlayType(MIMEType);
}

const canPlayFLV = canPlayWithQTPlugin("video/x-flv");