"use strict";
var settings = safari.extension.settings;
var secureSettings = safari.extension.secureSettings;

function loadScripts() { // add scripts to the global page in order
	var i = 0;
	var args = arguments;
	var load = function() {
		var scriptElement = document.createElement("script");
		scriptElement.src = args[i];
		scriptElement.addEventListener("load", next, false);
		scriptElement.addEventListener("error", next, false);
		document.head.appendChild(scriptElement);
	};
	var next = function(event) {
		event.target.removeEventListener("load", next, false);
		event.target.removeEventListener("error", next, false);
		if(++i < args.length) load();
	};
	load();
}

function dispatchMessageToAllPages(name, message) {
	for(var i = 0; i < safari.application.browserWindows.length; i++) {
		for(var j = 0; j < safari.application.browserWindows[i].tabs.length; j++) {
			// Tabs such as Bookmarks or Top Sites do not have the .page proxy
			if(safari.application.browserWindows[i].tabs[j].page) {
				safari.application.browserWindows[i].tabs[j].page.dispatchMessage(name, message);
			}
		}
	}
}

function reloadTab(tab) {
	if(tab.url) tab.url = tab.url; // lol
}

function openTab(url) {
	var tab;
	if(safari.application.activeBrowserWindow) tab = safari.application.activeBrowserWindow.openTab("foreground");
	else tab = safari.application.openBrowserWindow().activeTab;
	tab.url = url;
}

function airplay(url) {
	var xhr = new XMLHttpRequest();
	var port = ":7000";
	if(/:\d+$/.test(settings.airplayHostname)) port = "";
	xhr.open("POST", "http://" + settings.airplayHostname + port + "/play", true, "AirPlay", secureSettings.getItem("airplayPassword"));
	xhr.addEventListener("load", function() {
		// Set timer to prevent playback from aborting
		var timer = setInterval(function() {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", "http://" + settings.airplayHostname + port + "/playback-info", true, "AirPlay", secureSettings.getItem("airplayPassword"));
			xhr.addEventListener("load", function() {
				if(xhr.responseXML.getElementsByTagName("key").length === 0) { // playback terminated
					clearInterval(timer);
				}
			}, false);
			xhr.addEventListener("error", function() {clearInterval(timer);}, false);
			xhr.send(null);
		}, 1000);
	}, false);
	xhr.send("Content-Location: " + url + "\nStart-Position: 0\n");
}

function matchList(list, string) {
	var s;
	for(var i = 0; i < list.length; i++) {
		s = list[i];
		if(s.charAt(0) === "@") { // if s starts with '@', interpret as regexp
			try {
				s = new RegExp(s.substring(1));
			} catch(e) { // invalid regexp: ignore
				continue;
			}
			if(s.test(string)) return true;
		} else { // regular string match
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
var schemeMatch = new RegExp("^[^:]+:");
var authorityMatch = new RegExp("^[^:]+://[^/]*");
function makeAbsoluteURL(url, base) {
	if(!url) return "";
	if(schemeMatch.test(url)) return url; // already absolute
	base = base.substring(0, base.split(/[?#]/)[0].lastIndexOf("/") + 1);
	if(url.charAt(0) === "/") {
		if(url.charAt(1) === "/") { // relative to scheme
			base = schemeMatch.exec(base)[0];
		} else { // relative to authority
			base = authorityMatch.exec(base)[0];
		}
	}
	return base + url;
}

function unescapeHTML(text) {
	var e = document.createElement("div");
	e.innerHTML = text.replace(/</g, "&lt;");
	return e.textContent;
}

function unescapeUnicode(text) {
	return text.replace(/\\u([0-9a-fA-F]{4})/g, function(s,c) {return String.fromCharCode(parseInt(c, 16));});
}

function parseWithRegExp(text, regex, processValue) { // regex needs 'g' flag
	var obj = {};
	if(!text) return obj;
	if(processValue === undefined) processValue = function(s) {return s;};
	var match;
	while(match = regex.exec(text)) {
		obj[match[1]] = processValue(match[2]);
	}
	return obj;
}
function parseFlashVariables(s) {return parseWithRegExp(s, /([^&=]*)=([^&]*)/g);}
function parseSLVariables(s) {return parseWithRegExp(s, /\s*([^,=]*)=([^,]*)/g);}

function extractDomain(url) {
	return /\/\/([^\/]+)\//.exec(url)[1];
}

function extractExt(url) {
	var i = url.search(/[?#]/);
	if(i === -1) i = undefined;
	url = url.substring(url.lastIndexOf("/", i) + 1, i);
	i = url.lastIndexOf(".");
	if(i === -1) return "";
	return url.substring(i + 1).toLowerCase().trimRight();
}

function chooseDefaultSource(sources) {
	var defaultSource;
	var hasNativeSource = false;
	var resolutionMap = [];
	
	for(var i = sources.length - 1; i >= 0; i--) {
		var h = sources[i].height;
		if(!h) h = 0;
		if(!sources[i].isNative && (settings.codecsPolicy !== 3 || resolutionMap[h] !== undefined)) continue;
		resolutionMap[h] = i;
	}
	if(resolutionMap.length === 0) {
		if(settings.codecsPolicy !== 2) return undefined;
		for(var i = sources.length - 1; i >= 0; i--) {
			var h = sources[i].height;
			resolutionMap[h?h:0] = i;
		}
	}
	
	for(var h in resolutionMap) {
		if(h > settings.defaultResolution) {
			if(defaultSource === undefined) defaultSource = resolutionMap[h];
			break;
		}
		defaultSource = resolutionMap[h];
	}
	return defaultSource;
}

function parseXSPlaylist(playlistURL, baseURL, altPosterURL, track, handlePlaylistData) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", playlistURL, true);
	xhr.addEventListener("load", function() {
		var x = xhr.responseXML.getElementsByTagName("track");
		var playlist = [];
		var audioOnly = true;
		var startTrack = track;
		if(!(track >= 0 && track < x.length)) track = 0;
		var list, I, info, mediaURL, posterURL, title;
		
		for(var i = 0; i < x.length; i++) {
			// what about <jwplayer:streamer> rtmp??
			I = (i + track) % x.length;
			list = x[I].getElementsByTagName("location");
			if(list.length > 0) mediaURL = makeAbsoluteURL(list[0].textContent, baseURL);
			else if(i === 0) return;
			else continue;
			info = urlInfo(mediaURL);
			if(!info) {
				if(i === 0) return;
				if(i >= x.length - track) --startTrack;
				continue;
			} else if(!info.isAudio) audioOnly = false;
			info.url = mediaURL;
			
			list = x[I].getElementsByTagName("image");
			if(list.length > 0) posterURL = list[0].textContent;
			if(i === 0 && !posterURL) posterURL = altPosterURL;
			list = x[I].getElementsByTagName("title");
			if(list.length > 0) title = list[0].textContent;
			else {
				list = x[I].getElementsByTagName("annotation");
				if(list.length > 0) title = list[0].textContent;
			}
			
			playlist.push({
				"sources": [info],
				"poster": posterURL,
				"title": title
			});
		}
		handlePlaylistData({"playlist": playlist, "startTrack": startTrack, "audioOnly": audioOnly});
	}, false);
	xhr.send(null);
}
