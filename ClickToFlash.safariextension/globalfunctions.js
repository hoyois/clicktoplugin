function dispatchMessageToAllPages(name, message) {
    for(var i = 0; i < safari.application.browserWindows.length; i++) {
        for(var j = 0; j < safari.application.browserWindows[i].tabs.length; j++) {
            // must be careful here since tabs such as Bookmarks or Top Sites do not have the .page proxy
            if(safari.application.browserWindows[i].tabs[j].page) {
                safari.application.browserWindows[i].tabs[j].page.dispatchMessage(name, message);
            }
        }
    }
}

// not meant to follow the specs, but works in practice
const protocolMatch = /^[^\/:]+:/;
const authorityMatch = /^[^\/:]+:\/\/[^\/]*/;
function makeAbsoluteURL(url, base) {
    if(!url) return "";
    if(protocolMatch.test(url)) return url; // already absolute
    base = base.substring(0, base.lastIndexOf("/") + 1);
    if(url.charAt(0) === "/") {
        if(url.charAt(1) === "/") { // relative to protocol
            base = base.match(protocolMatch)[0];
        } else { // relative to authority
            base = base.match(authorityMatch)[0];
        }
    }
    return base + url;
}

function unescapeHTML(text){
  var e = document.createElement("div");
  e.innerHTML = text;
  return e.firstChild.nodeValue;
}

function hasFlashVariable(flashvars, key) {
    var s = "(?:^|&)" + key + "=";
    s = new RegExp(s);
    return s.test(flashvars);
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

function extractExt(url) {
    url = url.split(/[?#]/)[0];
    return url.substring(url.lastIndexOf(".") + 1);
}

// In this function 'ext' is a string representing a regular expression, eg. "mp4|mpe?g"
function hasExt(ext, url) {
    url = extractExt(url);
    ext = new RegExp("^(?:" + ext + ")$", "i");
    return ext.test(url);
}

// this function is not to be trusted...
function canPlayTypeWithHTML5(MIMEType) {
    return document.createElement("video").canPlayType(MIMEType);
}
const canPlayFLV = canPlayTypeWithHTML5("video/x-flv");
const canPlayWM = canPlayTypeWithHTML5("video/x-ms-wmv");
const canPlayDivX = canPlayFLV; // 'video/divx' always returns "", probably a Perian oversight
const canPlayOGG = canPlayTypeWithHTML5("video/ogg"); // OK with Xiph component
//const canPlayWebM = canPlayTypeWithHTML5("video/webm"); // still can't with alpha version of QuickTime WebM component

// and certainly not this this one! but it does the job reasonably well
function canPlaySrcWithHTML5(url) {
    url = extractExt(url);
    if (/^(?:mp4|mpe?g|mov|m4v)$/i.test(url)) return {"type": "video", "isNative": true};
    if(canPlayFLV && /^flv$/i.test(url)) return {"type": "video", "isNative": false};
    if(canPlayWM && /^(?:wm[vp]?|asf)$/i.test(url)) return {"type": "video", "isNative": false};
    if(canPlayDivX && /^divx$/i.test(url)) return {"type": "video", "isNative": false};
    if(canPlayOGG && /^ogg$/i.test(url)) return {"type": "video", "isNative": false};
    if(/^(?:mp3|wav|midi?|aif[fc]?|aac|m4a)$/i.test(url)) return {"type": "audio", "isNative": true};
    if(canPlayFLV && /^fla$/i.test(url)) return {"type": "audio", "isNative": false};
    if(canPlayWM && /^wma$/i.test(url)) return {"type": "audio", "isNative": false};
    return false;
}

function chooseDefaultSource(sourceArray, bestSource) {
    if(safari.extension.settings.maxResolution === "plugin") return undefined;
    var defaultSource;
    var hasNativeSource = false;
    var resolutionMap = new Array();
    for(var i = 0; i < sourceArray.length; i++) {
        var h = sourceArray[i].resolution;
        if(!h) h = 0;
        if(sourceArray[i].isNative) {
            resolutionMap[h] = i;
            hasNativeSource = true;
        } else if(resolutionMap[h] === undefined && safari.extension.settings.codecsPolicy > 1) {
            resolutionMap[h] = i;
        }
    }
    
    var setAsDefault = function(source) {
        var h = sourceArray[source].resolution;
        if(!h) h = 0;
        if(safari.extension.settings.codecsPolicy === 2 && hasNativeSource && !sourceArray[source].isNative) return;
        if(safari.extension.settings.maxResolution === "infinity" || h <= safari.extension.settings.maxResolution) defaultSource = source;
    };
    
    for(var h in resolutionMap) {
        setAsDefault(resolutionMap[h]);
    }
    if(bestSource !== undefined) setAsDefault(bestSource);
    return defaultSource;
}

function makeLabel(source, mediaType) {
    if(!source) return false;
    if(mediaType === "audio") return "Audio";
    var prefix = "";
    if(source.resolution >= 720) prefix = "HD&nbsp;";
    if(source.resolution >= 2304) prefix = "4K&nbsp;";
    return prefix + (source.isNative ? "H.264" : "Video"); // right...
}

function getMIMEType(resourceURL, handleMIMEType) {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', resourceURL, true);
    var gotContentType = false;
    xhr.onreadystatechange = function () {
        if(!gotContentType && xhr.getResponseHeader('Content-Type')) {
            gotContentType = true;
            handleMIMEType(xhr.getResponseHeader('Content-Type'));
            xhr.abort();
        }
    };
    xhr.send(null);
}

function parseXSPFPlaylist(playlistURL, baseURL, altPosterURL, track, handlePlaylistData) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', playlistURL, true);
    xhr.onload = function() {
        var x = xhr.responseXML.getElementsByTagName("track");
        var playlist = new Array();
        var isAudio = true;
        var startTrack = track;
        if(!(track >= 0 && track < x.length)) track = 0;
        var list, I, mediaType, mediaURL, posterURL, title;
        
        for(var i = 0; i < x.length; i++) {
            // what about <jwplayer:streamer> rtmp??
            I = (i + track) % x.length;
            list = x[I].getElementsByTagName("location");
            if(list.length > 0) mediaURL = makeAbsoluteURL(list[0].firstChild.nodeValue, baseURL);
            else if(i === 0) return;
            else continue;
            mediaType = canPlaySrcWithHTML5(mediaURL);
            if(!mediaType) {
                if(i === 0) return;
                if(i >= x.length - track) --startTrack;
                continue;
            } else if(mediaType.type === "video") isAudio = false;
            
            list = x[I].getElementsByTagName("image");
            if(list.length > 0) posterURL = list[0].firstChild.nodeValue;
            if(i === 0 && !posterURL) posterURL = altPosterURL;
            list = x[I].getElementsByTagName("title");
            if(list.length > 0) title = list[0].firstChild.nodeValue;
            playlist.push({"mediaType": mediaType.type, "sources": [{"url": mediaURL, "isNative": mediaType.isNative}], "posterURL": posterURL, "title": title});
        }
        var playlistData = {
            "playlist": playlist,
            "startTrack": startTrack,
            "isAudio": isAudio
        };
        handlePlaylistData(playlistData);
    };
    xhr.send(null);
}

function matchList(list, string) {
    var s;
    for(var i = 0; i < list.length; i++) {
        s = list[i];
        if(!s) continue;
        if(/^\(.*\)$/.test(s)) { // if s is enclosed in parenthesis, interpret as regexp
            try{
                s = new RegExp(s);
            } catch (err) { // invalid regexp, just ignore
                continue;
            }
            if(s.test(string)) return true;
        } else { // otherwise, regular string match
            if(string.indexOf(s) != -1) return true;
        }
    }
    return false;
}

