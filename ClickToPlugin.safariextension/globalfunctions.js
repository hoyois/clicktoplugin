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

/***********************
Plugin detection methods
***********************/

function getPluginForType(MIMEType) { // MIMEType is a string
    for(var i = 0; i < navigator.plugins.length; i++) {
        for(var j = 0; j < navigator.plugins[i].length; j++) {
            if(navigator.plugins[i][j].type == MIMEType) return navigator.plugins[i];
        }
    }
    return null;
}

function getPluginAndTypeForExt(ext) {
    var suffixes = null;
    for(var i = 0; i < navigator.plugins.length; i++) {
        for(var j = 0; j < navigator.plugins[i].length; j++) {
            suffixes = navigator.plugins[i][j].suffixes.split(",");
            for(var k = 0; k < suffixes.length; k++) {
                if(ext == suffixes[k]) return {"plugin": navigator.plugins[i], "type": navigator.plugins[i][j].type};
            }
        }
    }
    return {"plugin": null, "type": null};
}

function getPluginNameFromPlugin(plugin) {
    if(plugin.name == "Shockwave Flash") return "Flash";
    if(plugin.name == "Silverlight Plug-In") return "Silverlight";
    if(plugin.name.match("Java")) return "Java";
    if(plugin.name.match("QuickTime")) return "QuickTime";
    if(plugin.name.match("Flip4Mac")) return "WM";
    if(plugin.name == "iPhotoPhotocast") return "iPhoto";
    if(plugin.name == "Quartz Composer Plug-In") return "Quartz";
    if(plugin.name == "VideoLAN VLC Plug-in") return "VLC";
    if(plugin.name == "DivX Web Player") return "DivX";
    if(plugin.name == ("RealPlayer Plugin.plugin")) return "Real";
    return plugin.name;
}

function getPluginNameFromType(type) { // only used if no installed plugin is found
    if(/shockwave-flash/.test(type) || /futuresplash/.test(type)) return "Flash";
    if(/silverlight/.test(type)) return "Silverlight";
    if(/x-java/.test(type)) return "Java";
    if(/x-ms/.test(type)) return "WM";
    if(/x-pn/.test(type)) return "Real";
    type = type.split(";")[0];
    if(type == "video/divx") return "DivX";
    return type.split("/")[1];
}

function getPluginNameFromClassid(classid) { // last resort
    switch(classid.toLowerCase()) {
        case "d27cdb6e-ae6d-11cf-96b8-444553540000": return "Flash";
        case "22d6f312-b0f6-11d0-94ab-0080c74c7e95": return "WM";
        case "6bf52a52-394a-11d3-b153-00c04f79faa6": return "WM";
        case "02bf25d5-8c17-4b23-bc80-d3488abddc6b": return "QuickTime";
        case "cfcdaa03-8be4-11cf-b84b-0020afbbccfa": return "Real";
        case "67dabfbf-d0ab-41fa-9c46-cc0f21721616": return "DivX";
        default: return "?";
    }
}

/*
LIST OF CLASSIDs
QuickTime: 02BF25D5-8C17-4B23-BC80-D3488ABDDC6B
WMP 6: 22d6f312-b0f6-11d0-94ab-0080c74c7e95
WMP >6: 6BF52A52-394A-11D3-B153-00C04F79FAA6
Flash: d27cdb6e-ae6d-11cf-96b8-444553540000
Real Player: CFCDAA03-8BE4-11cf-B84B-0020AFBBCCFA
?? calendar: 8E27C92B-1264-101C-8A2F-040224009C02
?? graphics: 369303C2-D7AC-11D0-89D5-00A0C90833E6
?? slider: F08DF954-8592-11D1-B16A-00C0F0283628
DivX: 67DABFBF-D0AB-41fa-9C46-CC0F21721616
*/