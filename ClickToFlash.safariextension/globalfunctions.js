function loadScripts() { // add scripts to the global page
	for(var i = 0; i < arguments.length; i++) {
		var scriptElement = document.createElement("script");
		scriptElement.src = makeAbsoluteURL(arguments[i], safari.extension.baseURI);
		document.head.appendChild(scriptElement);
	}
}

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

// Follows rfc3986 except ? and # in base are ignored (as in WebKit)
const schemeMatch = new RegExp("^[^:]+:");
const authorityMatch = new RegExp("^[^:]+://[^/]*");
function makeAbsoluteURL(url, base) {
	if(!url) return "";
	if(schemeMatch.test(url)) return url; // already absolute
	base = base.substring(0, base.split(/[?#]/)[0].lastIndexOf("/") + 1);
	if(url.charAt(0) === "/") {
		if(url.charAt(1) === "/") { // relative to scheme
			base = base.match(schemeMatch)[0];
		} else { // relative to authority
			base = base.match(authorityMatch)[0];
		}
	}
	return base + url;
}

function extractDomain(url) {
	return url.match(/\/\/([^\/]+)\//)[1];
}

function unescapeHTML(text) {
	var e = document.createElement("div");
	e.innerHTML = text.replace(/</g, "&lt;");
	return e.textContent;
}

function unescapeUnicode(text) {
	return text.replace(/\\u([0-9a-fA-F]{4})/g, function(s,c) {return String.fromCharCode(parseInt(c, 16));});
}

function parseWithRegExp(string, regex, process) { // regex needs 'g' flag
	if(process === undefined) process = function(s) {return s;};
	var match;
	var obj = new Object();
	while((match = regex.exec(string)) !== null) {
		obj[match[1]] = process(match[2]);
	}
	return obj;
}
function parseFlashVariables(s) {return parseWithRegExp(s, /([^&=]*)=([^&]*)/g);}

function extractExt(url) {
	var i = url.search(/[?#]/);
	if(i === -1) i = undefined;
	url = url.substring(url.lastIndexOf("/", i) + 1, i);
	i = url.lastIndexOf(".");
	if(i === -1) return "";
	return url.substring(i + 1);
}

// In this function 'ext' is a string representing a regular expression, eg. "mp4|mpe?g"
function hasExt(ext, url) {
	url = extractExt(url);
	ext = new RegExp("^(?:" + ext + ")$", "i");
	return ext.test(url);
}

const HTML5 = document.createElement("video");
const canPlayFLV = HTML5.canPlayType("video/x-flv"); // OK with Perian
const canPlayWM = HTML5.canPlayType("video/x-ms-wmv"); // OK with Flip4Mac
const canPlayDivX = canPlayFLV; // 'video/divx' always returns "", probably a Perian oversight
const canPlayWebM = HTML5.canPlayType("video/webm"); // OK with Perian 2.2
const canPlayOgg = HTML5.canPlayType("video/ogg"); // OK with Xiph component

function extInfo(url) {
	url = extractExt(url);
	if(url === "") return undefined;
	if(/^(?:mp4|mpe?g|mov|m4v)$/i.test(url)) return {"mediaType": "video", "isNative": true};
	if(canPlayFLV && /^flv$/i.test(url)) return {"mediaType": "video", "isNative": false};
	if(canPlayWM && /^(?:wm[vp]?|asf)$/i.test(url)) return {"mediaType": "video", "isNative": false};
	if(canPlayDivX && /^divx$/i.test(url)) return {"mediaType": "video", "isNative": false};
	if(canPlayWebM && /^webm$/i.test(url)) return {"mediaType": "video", "isNative": false};
	if(canPlayOgg && /^ogg$/i.test(url)) return {"mediaType": "video", "isNative": false};
	if(/^(?:mp3|wav|aif[fc]?|aac|m4a)$/i.test(url)) return {"mediaType": "audio", "isNative": true}; // midi not in QTX
	if(canPlayFLV && /^fla$/i.test(url)) return {"mediaType": "audio", "isNative": false};
	if(canPlayWM && /^wma$/i.test(url)) return {"mediaType": "audio", "isNative": false};
	return null;
}

function chooseDefaultSource(sourceArray) {
	var defaultSource;
	var hasNativeSource = false;
	var resolutionMap = new Array();
	for(var i = sourceArray.length - 1; i >= 0; i--) {
		var h = sourceArray[i].height;
		if(!h) h = 0;
		if(sourceArray[i].isNative) {
			resolutionMap[h] = i;
			hasNativeSource = true;
		} else if(resolutionMap[h] === undefined && safari.extension.settings.codecsPolicy > 1) {
			resolutionMap[h] = i;
		}
	}
	
	var setAsDefault = function(source) {
		var h = sourceArray[source].height;
		if(!h) h = 0;
		if(safari.extension.settings.codecsPolicy === 2 && hasNativeSource && !sourceArray[source].isNative) return;
		if(safari.extension.settings.maxResolution === "infinity" || h <= safari.extension.settings.maxResolution) defaultSource = source;
	};
	
	for(var h in resolutionMap) {
		setAsDefault(resolutionMap[h]);
	}
	return defaultSource;
}

function makeLabel(source) {
	if(!source) return false; // the injected script will take care of the label
	if(safari.extension.settings.defaultPlayer === "plugin") return false;
	if(safari.extension.settings.defaultPlayer === "qtp") return "QTP";
	if(source.mediaType === "audio") return "Audio";
	var prefix = "";
	if(source.height >= 720) prefix = "HD ";
	if(source.height >= 2304) prefix = "4K ";
	return prefix + (source.isNative ? "H.264" : "Video"); // right...
}

const nativeExts = ["svg", "png", "tif", "tiff", "gif", "jpg", "jpeg", "jp2", "ico", "html", "xml", "pdf"];
function isNativeExt(ext) {
	for(var i = 0; i < 12; i++) {
		if(ext === nativeExts[i]) return true;
	}
	return false;
}

function getMIMEType(resourceURL, handleMIMEType) {
	var xhr = new XMLHttpRequest();
	xhr.open('HEAD', resourceURL, true);
	var MIMEType = false;
	xhr.onreadystatechange = function () {
		if(!MIMEType && xhr.getResponseHeader('Content-Type')) {
			MIMEType = xhr.getResponseHeader('Content-Type');
			xhr.abort();
			handleMIMEType(MIMEType);
		}
	};
	xhr.send(null);
}

function parseXSPlaylist(playlistURL, baseURL, altPosterURL, track, handlePlaylistData) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', playlistURL, true);
	xhr.onload = function() {
		var x = xhr.responseXML.getElementsByTagName("track");
		var playlist = new Array();
		var isAudio = true;
		var startTrack = track;
		if(!(track >= 0 && track < x.length)) track = 0;
		var list, I, ext, mediaURL, posterURL, title;
		
		for(var i = 0; i < x.length; i++) {
			// what about <jwplayer:streamer> rtmp??
			I = (i + track) % x.length;
			list = x[I].getElementsByTagName("location");
			if(list.length > 0) mediaURL = makeAbsoluteURL(list[0].firstChild.nodeValue, baseURL);
			else if(i === 0) return;
			else continue;
			ext = extInfo(mediaURL);
			if(!ext) {
				if(i === 0) return;
				if(i >= x.length - track) --startTrack;
				continue;
			} else if(ext.mediaType === "video") isAudio = false;
			
			list = x[I].getElementsByTagName("image");
			if(list.length > 0) posterURL = list[0].firstChild.nodeValue;
			if(i === 0 && !posterURL) posterURL = altPosterURL;
			list = x[I].getElementsByTagName("title");
			if(list.length > 0) title = list[0].firstChild.nodeValue;
			else {
				list = x[I].getElementsByTagName("annotation");
				if(list.length > 0) title = list[0].firstChild.nodeValue;
			}
			playlist.push({"sources": [{"url": mediaURL, "isNative": ext.isNative, "mediaType": ext.mediaType}], "poster": posterURL, "title": title});
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
		if(s.charAt(0) === "@") { // if s starts with '@', interpret as regexp
			try {
				s = new RegExp(s.substr(1));
			} catch(err) { // invalid regexp, just ignore
				continue;
			}
			if(s.test(string)) return true;
		} else { // otherwise, regular string match
			if(string.indexOf(s) !== -1) return true;
		}
	}
	return false;
}

