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
    if(url.charAt(0) === "/") {
        if(url.charAt(1) === "/") { // relative to protocol
            base = base.match(protocolMatch)[0];
        } else { // relative to authority
            base = base.match(authorityMatch)[0];
        }
    }
    return base + url;
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

// and certainly not this this one! but it does the job reasonably well
function willPlaySrcWithHTML5(url) {
    url = extractExt(url);
    if (/^(?:mp4|mpe?g|mov|m4v)$/i.test(url)) return "video";
    if(safari.extension.settings["QTbehavior"] > 1 && canPlayFLV && /^flv$/i.test(url)) return "video";
    if(safari.extension.settings["QTbehavior"] > 1 && canPlayWM && /^(?:wm[vp]?|asf)$/i.test(url)) return "video";
    if(/^(?:mp3|wav|midi?|aif[fc]?|aac|m4a)$/i.test(url)) return "audio";
    if(safari.extension.settings["QTbehavior"] > 1 && canPlayFLV && /^fla$/i.test(url)) return "audio";
    if(safari.extension.settings["QTbehavior"] > 1 && canPlayWM && /^wma$/i.test(url)) return "audio";
    return "";
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

function parseXSPFPlaylist(playlistURL, altPosterURL, track, handlePlaylistData) {
    xhr = new XMLHttpRequest();
    xhr.open('GET', playlistURL, true);
    xhr.onload = function() {
        var x = xhr.responseXML.getElementsByTagName("track");
        var playlist = new Array();
        var isAudio = true;
        var startTrack = track;
        if(!(track >= 0 && track < x.length)) track = 0;
        var list, I, mediaType, mediaURL, posterURL, title;
        
        for(var i = 0; i < x.length; i++) {
            I = (i + track) % x.length;
            list = x[I].getElementsByTagName("location");
            if(list.length > 0) mediaURL = list[0].firstChild.nodeValue;
            else if(i == 0) return;
            else continue;
            mediaType = willPlaySrcWithHTML5(mediaURL);
            if(!mediaType) {
                if(i == 0) return;
                if(i >= x.length - track) --startTrack;
                continue;
            } else if(mediaType == "video") isAudio = false;
            
            list = x[I].getElementsByTagName("image");
            if(list.length > 0) posterURL = list[0].firstChild.nodeValue;
            if(i == 0 && !posterURL) posterURL = altPosterURL;
            list = x[I].getElementsByTagName("title");
            if(list.length > 0) title = list[0].firstChild.nodeValue;
            playlist.push({"mediaType": mediaType, "mediaURL": mediaURL, "posterURL": posterURL, "title": title});
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

