function makeAbsoluteURI(url) {
    if(!url) return "";
    var tmpAnchor = document.createElement("a");
    tmpAnchor.href = url;
    return tmpAnchor.href;
}

// This function returns false if the url shoudl not be proposed
// as a video replacement, according to the user's settings
/*function getMediaTypeOf(url) {
    if (url.match(/(.mp4)|(.mpe{0,1}g)/i) || (safari.extension.settings["QTbehavior"] > 1 && url.match(/(.flv)/i))) return "video";
	if(url.match(/(.mp3)|(.wav)|(.aiff)|(.aac)/i) || (safari.extension.settings["QTbehavior"] > 1 && url.match(/.wma/i))) return "audio";
	return false;
}*/

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

function getSLVariable(initParams, key) {
	if (!initParams) return "";
	var initParamsArray = initParams.split(",");
	for (var i = 0; i < initParamsArray.length; i++) {
		var keyValuePair = initParamsArray[i].split("=");
		if (keyValuePair[0].toLowerCase() == key) {
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

// this function is not to be trusted...
function canPlayWithQTPlugin(MIMEType) {
    return !!document.createElement("video").canPlayType(MIMEType);
}

const canPlayFLV = canPlayWithQTPlugin("video/x-flv");
const canPlayWM = canPlayWithQTPlugin("video/x-ms-wmv");
const canPlayDivX = canPlayWithQTPlugin("video/divx");

function extractExt(url) {
    return url.split("?")[0].split(".").pop();
}

// native MIME types that might realistically appear in <object> tags
const nativeMIMETypes = ["image/svg+xml", "image/png", "image/tiff", "image/gif", "image/jpeg", "image/jp2", "image/x-icon", "application/pdf", "text/html", "text/xml"];
const nativeExtensions = ["svg", "png", "tif", "tiff", "gif", "jpg", "jpeg", "jp2", "ico", "pdf", "html", "xml"];
function isNativeType(MIMEType) {
    for(var i = 0; i < 10; i++) {
        if(MIMEType == nativeMIMETypes[i]) return true;
    }
    return false;
}
function isNativeExt(ext) {
    for(var i = 0; i < 12; i++) {
        if(ext == nativeExtensions[i]) return true;
    }
    return false;
}

function matchList(list, string, lowerCase) { // set lowerCase to true if 'string' is lower case and you want case-insensitive match
    for(var i = 0; i < list.length; i++) {
        var s = list[i];
        // if s is enclosed in parenthesis, interpret as regexp
        if (s[0] == "(" && s[s.length - 1] == ")") {
            try{
				s = new RegExp(s, (lowerCase ? "i" : ""));
			} catch (err) { // invalid regexp, just ignore
				continue;
			}
        } else if(lowerCase) {
            s = s.toLowerCase();
        }
        if(string.match(s)) {
            return true;
        }
    }
    return false;
}