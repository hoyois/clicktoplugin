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

function reloadTab(tab) {
	if(tab.url) tab.url = tab.url; // lol
}

function matchList(list, string) {
	var s;
	for(var i = 0; i < list.length; i++) {
		s = list[i];
		if(s.charAt(0) === "@") { // if s starts with '@', interpret as regexp
			try {
				s = new RegExp(s.substr(1));
			} catch(e) { // invalid regexp, just ignore
				continue;
			}
			if(s.test(string)) return true;
		} else { // otherwise, regular string match
			if(string.indexOf(s) !== -1) return true;
		}
	}
	return false;
}

function getMIMEType(resourceURL, handleMIMEType) {
	var xhr = new XMLHttpRequest();
	xhr.open('HEAD', resourceURL, true);
	var MIMEType = false;
	xhr.onreadystatechange = function () {
		if(!MIMEType && xhr.getResponseHeader("Content-Type")) {
			MIMEType = xhr.getResponseHeader("Content-Type");
			xhr.abort();
			handleMIMEType(MIMEType);
		}
	};
	xhr.send(null);
}

function stripParams(MIMEType) {
	return /^[^;]*/.exec(MIMEType)[0];
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
	return /\/\/([^\/]+)\//.exec(url)[1];
}

function unescapeHTML(text) {
	var e = document.createElement("div");
	e.innerHTML = text.replace(/</g, "&lt;");
	return e.textContent;
}

function unescapeUnicode(text) {
	return text.replace(/\\u([0-9a-fA-F]{4})/g, function(s,c) {return String.fromCharCode(parseInt(c, 16));});
}

function parseWithRegExp(string, regex, processValue) { // regex needs 'g' flag
	var obj = {};
	if(typeof string !== "string") return obj;
	if(processValue === undefined) processValue = function(s) {return s;};
	var match;
	while(match = regex.exec(string)) {
		obj[match[1]] = processValue(match[2]);
	}
	return obj;
}
function parseFlashVariables(s) {return parseWithRegExp(s, /([^&=]*)=([^&]*)/g);}
function parseSLVariables(s) {return parseWithRegExp(s, /\s?([^,=]*)=([^,]*)/gi);}

function extractExt(url) {
	var i = url.search(/[?#]/);
	if(i === -1) i = undefined;
	url = url.substring(url.lastIndexOf("/", i) + 1, i);
	i = url.lastIndexOf(".");
	if(i === -1) return "";
	return url.substring(i + 1).toLowerCase();
}

function extractFilename(url) {
	var i = url.search(/[?#]/);
	if(i === -1) i = undefined;
	url = url.substring(url.lastIndexOf("/", i) + 1, i);
	i = url.lastIndexOf(".");
	if(i === -1) i = undefined;
	return url.substring(0, i);
}

function chooseDefaultSource(sources) {
	var defaultSource;
	var hasNativeSource = false;
	var resolutionMap = [];
	
	for(var i = sources.length - 1; i >= 0; i--) {
		var h = sources[i].height;
		if(!h) h = 0;
		if(!sources[i].isNative && (safari.extension.settings.codecsPolicy !== 3 || resolutionMap[h] !== undefined)) continue;
		resolutionMap[h] = i;
	}
	if(resolutionMap.length === 0) {
		if(safari.extension.settings.codecsPolicy !== 2) return undefined;
		for(var i = sources.length - 1; i >= 0; i--) {
			var h = sources[i].height;
			resolutionMap[h?h:0] = i;
		}
	}
	
	for(var h in resolutionMap) {
		if(h > safari.extension.settings.defaultResolution) {
			if(defaultSource === undefined) defaultSource = resolutionMap[h];
			break;
		}
		defaultSource = resolutionMap[h];
	}
	return defaultSource;
}

function makeLabel(source) {
	if(!source) return false; // the injected script will take care of the label
	if(safari.extension.settings.defaultPlayer === "plugin") return false;
	if(safari.extension.settings.defaultPlayer === "qtp") return "QTP";
	return "HTML5";
}

function makeTitle(track) {
	if(track.title) return;
	var source = track.defaultSource;
	if(source === undefined) source = 0;
	track.title = extractFilename(track.sources[source].url);
}

function parseXSPlaylist(playlistURL, baseURL, altPosterURL, track, handlePlaylistData) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', playlistURL, true);
	xhr.onload = function() {
		var x = xhr.responseXML.getElementsByTagName("track");
		var playlist = [];
		var audioOnly = true;
		var startTrack = track;
		if(!(track >= 0 && track < x.length)) track = 0;
		var list, I, source, mediaURL, posterURL, title;
		
		for(var i = 0; i < x.length; i++) {
			// what about <jwplayer:streamer> rtmp??
			I = (i + track) % x.length;
			list = x[I].getElementsByTagName("location");
			if(list.length > 0) mediaURL = makeAbsoluteURL(list[0].firstChild.nodeValue, baseURL);
			else if(i === 0) return;
			else continue;
			source = HTML5.urlInfo(mediaURL);
			if(!source) {
				if(i === 0) return;
				if(i >= x.length - track) --startTrack;
				continue;
			} else if(!source.isAudio) audioOnly = false;
			source.url = mediaURL;
			
			list = x[I].getElementsByTagName("image");
			if(list.length > 0) posterURL = list[0].firstChild.nodeValue;
			if(i === 0 && !posterURL) posterURL = altPosterURL;
			list = x[I].getElementsByTagName("title");
			if(list.length > 0) title = list[0].firstChild.nodeValue;
			else {
				list = x[I].getElementsByTagName("annotation");
				if(list.length > 0) title = list[0].firstChild.nodeValue;
			}
			
			playlist.push({
				"sources": [source],
				"poster": posterURL,
				"title": title
			});
		}
		handlePlaylistData({"playlist": playlist, "startTrack": startTrack, "audioOnly": audioOnly});
	};
	xhr.send(null);
}
