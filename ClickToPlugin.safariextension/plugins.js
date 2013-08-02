"use strict";
var nativePlugin = {};
var superNativeTypes = ["image/jpeg", "image/gif", "image/bmp", "image/x-icon", "image/vnd.microsoft.icon", "image/pjpeg", "image/x-xbitmap"];
var nativeTypes = superNativeTypes.concat(["image/png", "image/tiff", "image/jp2"]);
var superNativeExts = ["jpeg", "jpg", "gif", "bmp", "ico", "xbm"];
var nativeExts = superNativeExts.concat(["png", "tiff", "tif", "jp2"]);

function isDataURI(url) {
	return /^data:/.test(url);
}

// cf. WebCore::mimeTypeFromDataURL
function getTypeFromDataURI(url) {
	var match = /^data:([^,;]+)[,;]/.exec(url); // ignore parameters
	if(match) return match[1];
	else return "text/plain";
}

function getPluginForType(data) {
	if(data.isObject) {
		if(nativeTypes.indexOf(data.type) !== -1) return nativePlugin;
	} else {
		if(superNativeTypes.indexOf(data.type) !== -1) return null;
	}
	for(var i = 0; i < navigator.plugins.length; i++) {
		for(var j = 0; j < navigator.plugins[i].length; j++) {
			if(navigator.plugins[i][j].type === data.type) return navigator.plugins[i];
		}
	}
	return null;
}

function getPluginForExt(data) {
	var ext = extractExt(data.src);
	if(data.isObject) {
		if(nativeExts.indexOf(ext) !== -1) return nativePlugin;
	} else {
		if(superNativeExts.indexOf(ext) !== -1) return null;
	}
	for(var i = 0; i < navigator.plugins.length; i++) {
		for(var j = 0; j < navigator.plugins[i].length; j++) {
			if(navigator.plugins[i][j].suffixes === "") continue;
			var suffixes = navigator.plugins[i][j].suffixes.split(",");
			for(var k = 0; k < suffixes.length; k++) {
				if(ext === suffixes[k]) {
					data.type = stripParams(navigator.plugins[i][j].type);
					return navigator.plugins[i];
				}
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
	if(plugin.name.indexOf("Flip4Mac") !== -1) return "Flip4Mac";
	if(plugin.name.indexOf("Java") !== -1) return "Java";
	if(plugin.name === "DivX Web Player") return "DivX Player";
	if(plugin.name === "VideoLAN VLC Plug-in") return "VLC";
	if(plugin.name === "RealPlayer Plugin.plugin") return "RealPlayer";
	if(plugin.name === "Shockwave for Director") return "Shockwave";
	return plugin.name;
}
