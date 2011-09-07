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
	var obj = {};
	if(typeof string !== "string") return obj;
	if(process === undefined) process = function(s) {return s;};
	var match;
	while((match = regex.exec(string)) !== null) {
		obj[match[1]] = process(match[2]);
	}
	return obj;
}
function parseFlashVariables(s) {return parseWithRegExp(s, /([^&=]*)=([^&]*)/g);}
function parseSLVariables(s) {return parseWithRegExp(s, /([^,=]*)=([^,]*)/gi);}

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
	var resolutionMap = [];
	
	for(var i = sourceArray.length - 1; i >= 0; i--) {
		var h = sourceArray[i].height;
		if(!h) h = 0;
		if(!sourceArray[i].isNative && (safari.extension.settings.codecsPolicy !== 3 || resolutionMap[h] !== undefined)) continue;
		resolutionMap[h] = i;
	}
	if(resolutionMap.length === 0) {
		if(safari.extension.settings.codecsPolicy !== 2) return undefined;
		for(var i = sourceArray.length - 1; i >= 0; i--) {
			var h = sourceArray[i].height;
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
	if(source.mediaType === "audio") return "Audio";
	var prefix = "";
	if(source.height >= 720) prefix = "HD ";
	if(source.height >= 2304) prefix = "4K ";
	return prefix + (source.isNative ? "H.264" : "Video"); // right...
}

function parseXSPlaylist(playlistURL, baseURL, altPosterURL, track, handlePlaylistData) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', playlistURL, true);
	xhr.onload = function() {
		var x = xhr.responseXML.getElementsByTagName("track");
		var playlist = [];
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
		handlePlaylistData({"playlist": playlist, "startTrack": startTrack, "isAudio": isAudio});
	};
	xhr.send(null);
}

/***********************
Plugin detection methods
***********************/

var pluginsDisabled = false; // The global page doesn't see that

const nativePlugin = {};
const nativeTypes = ["image/png", "image/tiff", "image/jpeg", "image/jp2", "image/gif", "image/bmp", "image/x-icon", "image/vnd.microsoft.icon", "image/pjpeg", "image/x-xbitmap"];
const nativeExts = ["png", "jpeg", "jpg", "jfif", "tiff", "tif", "gif", "jp2", "bmp", "ico", "xbm"];
function isNativeType(type) {return nativeTypes.indexOf(type) !== -1;}
function isNativeExt(ext) {return nativeExts.indexOf(ext) !== -1;}

/* EXPLANATION
   If one of the above MIME type is specified, or no type but one of the extensions,
   WebKit treats the resource in a special and complicated way, which depends on
   the Content-Type header, the element name (object/embed), and the actual type of the resource.
   These types correspond the the supportedImageMIMETypes in MIMETypeRegistry.cpp.
   In most cases it just acts using the Content-Type (ignoring the decalared type), but not all cases. Examples:
   1 Flash file, Content-Type flash, declared as jpg: object & embed -> Flash
   2 Flash file, Content-Type flash, declared as png: object -> Flash, embed -> QuickTime
   3 Jpeg file, Content-Type jpeg, decalred as jpg: object & embed -> load natively
   4 Jpeg file, Content-Type flash or jpeg, declared as png: object -> load natively, embed -> QuickTime
   5 Flash file, Content-type jpeg, declared as png: object -> fallback, embed -> QuickTime
   6 Flash file, Content-type jpeg, declared as jpg: object -> fallback, embed -> load natively
   As 4 shows, there is no hope of determining what WebKit does in all cases.
   How are we handling this?
   Assuming the declared types are the Content-Types, we can be safe by always allowing objects and blocking embeds normally.
   Not assuming anything, we can only allow objects after checking Content-Type, and block embeds normally.
   OPTIONS
	1. Allow objects with native declared type (vulnerability)
	2. Ignore this whole business and treat everything normally (vulnerability & extra block)
	3. Allow objects with native Content-Type (no vulnerability, extra block, requires sniffing)
	4. Block all these declared types (no vulnerability, extra block, no sniffing)
	
	Currently using 3, which is the best match, but maybe switch to 4?
	
	Oh, and MOREOVER, in all cases I've tested, objects use fallback content if blocked and restored, so must cloneNode.
	
	CONCLUSION
	Simplest option with no vulnerability: block ALL, with "?" label, and clone original node.
*/

// cf. WebCore::mimeTypeFromDataURL
function getTypeFromDataURI(url) {
	var match = /^data:([^,;]+)[,;]/.exec(url);
	if(match) return match[1];
	else return "text/plain";
}

function getPluginForType(type) {
	if(pluginsDisabled) return null;
	for(var i = 0; i < navigator.plugins.length; i++) {
		for(var j = 0; j < navigator.plugins[i].length; j++) {
			if(navigator.plugins[i][j].type === type) return navigator.plugins[i];
		}
	}
	return null;
}

function getPluginAndTypeForExt(ext) {
	if(pluginsDisabled) return null;
	for(var i = 0; i < navigator.plugins.length; i++) {
		for(var j = 0; j < navigator.plugins[i].length; j++) {
			if(navigator.plugins[i][j].suffixes === "") continue;
			var suffixes = navigator.plugins[i][j].suffixes.split(",");
			for(var k = 0; k < suffixes.length; k++) {
				if(ext === suffixes[k]) return {"plugin": navigator.plugins[i], "type": navigator.plugins[i][j].type};
			}
		}
	}
	return null;
}

function adjustSource(data, plugin) {
	if(plugin.name === "Silverlight Plug-In" && data.source) data.src = data.source;
	if(plugin.name.indexOf("QuickTime") !== -1 && data.qtsrc) data.src = data.qtsrc;
}

function getPluginName(plugin) {
	// Shorten names of some common plug-ins
	if(plugin.name === "Shockwave Flash") return "Flash";
	if(plugin.name === "Silverlight Plug-In") return "Silverlight";
	if(plugin.name.indexOf("QuickTime") !== -1) return "QuickTime";
	if(plugin.name.indexOf("Windows Media") !== -1) return "Windows Media";
	if(plugin.name.indexOf("Java") !== -1) return "Java";
	if(plugin.name === "DivX Web Player") return "DivX";
	if(plugin.name === "VideoLAN VLC Plug-in") return "VLC";
	if(plugin.name === "RealPlayer Plugin.plugin") return "Real";
	if(plugin.name === "Shockwave for Director") return "Shockwave";
	if(plugin.name === "iPhotoPhotocast") return "iPhoto";
	if(plugin.name === "Quartz Composer Plug-In") return "Quartz";
	if(plugin.name === "Unity Player") return "Unity";
	return plugin.name;
}
