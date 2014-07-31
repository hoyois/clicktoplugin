"use strict";
function typeInfo(type) {
	type = stripParams(type).toLowerCase();
	if(nativeMediaTypes[type]) return {"isNative": true, "isAudio": /^audio/.test(type), "format": nativeMediaTypes[type].format};
	if(addedMediaTypes[type]) return {"isNative": false, "isAudio": /^audio/.test(type), "format": addedMediaTypes[type].format};
	return null;
}

function extInfo(ext) {
	if(ext === "") return null;
	for(var type in nativeMediaTypes) {
		if(nativeMediaTypes[type].exts.indexOf(ext) !== -1) return {"isNative": true, "isAudio": /^audio/.test(type), "format": nativeMediaTypes[type].format};
	}
	for(var type in addedMediaTypes) {
		if(addedMediaTypes[type].exts.indexOf(ext) !== -1) return {"isNative": false, "isAudio": /^audio/.test(type), "format": addedMediaTypes[type].format};
	}
	return null;
}

// Shortcuts for common types
var video = document.createElement("video");
var canPlayOgg = video.canPlayType("video/ogg");
var canPlayWebM = video.canPlayType("video/webm");
var canPlayFLV = video.canPlayType("video/x-flv");
var canPlayWM = video.canPlayType("video/x-ms-wmv");
// canPlayFLAC cannot be checked

var nativeMediaTypes = {
	"video/3gpp": {"exts": ["3gp", "3gpp"], "format": "3GPP"},
	"video/3gpp2": {"exts": ["3g2", "3gp2"], "format": "3GPP2"},
	"video/avi": {"exts": ["avi", "vfw"], "format": "AVI"},
	"video/flc": {"exts": ["flc", "fli", "cel"], "format": "FLC"},
	"video/mp4": {"exts": ["mp4"], "format": "MP4"},
	"video/mpeg": {"exts": ["mpeg", "mpg", "m1s", "m1v", "m75", "m15", "mp2", "mpm", "mpv"], "format": "MPEG"},
	"video/quicktime": {"exts": ["mov", "qt", "mqv"], "format": "MOV"},
	"video/x-dv": {"exts": ["dv", "dif"], "format": "DV"},
	"video/x-m4v": {"exts": ["m4v"], "format": "M4V"},
	"video/x-mpeg": {"exts": [], "format": "MPEG"},
	"video/x-msvideo": {"exts": [], "format": "AVI"},
	"audio/3gpp": {"exts": [], "format": "3GPP"},
	"audio/3gpp2": {"exts": [], "format": "3GPP2"},
	"audio/amr": {"exts": ["amr"], "format": "AMR"},
	"audio/aac": {"exts": ["aac", "adts"], "format": "AAC"},
	"audio/ac3": {"exts": ["ac3"], "format": "AC3"},
	"audio/aiff": {"exts": ["aiff", "aif", "aifc", "cdda"], "format": "AIFF"},
	"audio/basic": {"exts": ["au", "snd", "ulw"], "format": "AU"},
	"audio/mp3": {"exts": ["mp3", "swa"], "format": "MP3"},
	"audio/mp4": {"exts": [], "format": "MP4"},
	"audio/mpeg": {"exts": ["m1a", "mpa", "m2a"], "format": "MPEG"},
	"audio/mpeg3": {"exts": [], "format": "MP3"},
	"audio/mpegurl": {"exts": ["m3u", "m3url"], "format": "M3U"},
	"audio/mpg": {"exts": [], "format": "MPEG"},
	"audio/scpls": {"exts": ["pls"], "format": "PLS"},
	"audio/wav": {"exts": ["wav", "bwf"], "format": "WAV"},
	"audio/wave": {"exts": [], "format": "WAV"},
	"audio/x-aac": {"exts": [], "format": "AAC"},
	"audio/x-ac3": {"exts": [], "format": "AC3"},
	"audio/x-aiff": {"exts": [], "format": "AIFF"},
	"audio/x-caf": {"exts": ["caf"], "format": "CAF"},
	"audio/x-gsm": {"exts": ["gsm"], "format": "GSM"},
	"audio/x-m4a": {"exts": ["m4a"], "format": "M4A"},
	"audio/x-m4b": {"exts": ["m4b"], "format": "M4B"},
	"audio/x-m4p": {"exts": ["m4p"], "format": "M4P"},
	"audio/x-m4r": {"exts": ["m4r"], "format": "M4R"},
	"audio/x-mp3": {"exts": [], "format": "MP3"},
	"audio/x-mpeg": {"exts": [], "format": "MPEG"},
	"audio/x-mpeg3": {"exts": [], "format": "MP3"},
	"audio/x-mpegurl": {"exts": [], "format": "M3U"},
	"audio/x-mpg": {"exts": [], "format": "MPEG"},
	"audio/x-scpls": {"exts": [], "format": "PLS"},
	"audio/x-wav": {"exts": [], "format": "WAV"},
	"application/mp4": {"exts": [], "format": "MP4"},
	"application/vnd.apple.mpegurl": {"exts": ["m3u8"], "format": "HLS"}
};

var addedMediaTypes = {};
function addMediaTypes(types) {
	for(var type in types) addedMediaTypes[type] = types[type];
}

// Perian
if(canPlayFLV) addMediaTypes({
	"video/avi": {"exts": ["gvi", "vp6"], "format": "AVI"},
	"video/divx": {"exts": ["divx"], "format": "DivX"},
	"video/msvideo": {"exts": [], "format": "AVI"},
	"video/x-flv": {"exts": ["flv"], "format": "FLV"},
	"video/x-nuv": {"exts": ["nuv"], "format": "NUV"},
	"video/x-matroska": {"exts": ["mkv"], "format": "MKV"},
	"audio/x-matroska": {"exts": ["mka"], "format": "MKA"},
	"audio/x-tta": {"exts": ["tta"], "format": "TTA"}
});
// WebM
if(canPlayWebM) addMediaTypes({
	"video/webm": {"exts": ["webm"], "format": "WebM"},
	"audio/webm": {"exts": [], "format": "WebM"}
});
// Xiph
if(canPlayOgg) addMediaTypes({
	"video/annodex": {"exts": ["axv"], "format": "AXV"},
	"video/ogg": {"exts": ["ogv"], "format": "Ogg"},
	"video/x-annodex": {"exts": [], "format": "AXV"},
	"video/x-ogg": {"exts": [], "format": "Ogg"},
	"audio/annodex": {"exts": ["axa"], "format": "AXA"},
	"audio/ogg": {"exts": ["oga"], "format": "Ogg"},
	"audio/speex": {"exts": ["spx"], "format": "Ogg"},
	"audio/x-annodex": {"exts": [], "format": "AXA"},
	"audio/x-ogg": {"exts": [], "format": "Ogg"},
	"audio/x-speex": {"exts": [], "format": "Ogg"}
});
// Flip4Mac
if(canPlayWM) addMediaTypes({
	"video/x-ms-asf": {"exts": ["asf"], "format": "WMV"},
	"video/x-ms-asx": {"exts": ["asx"], "format": "WMV"},
	"video/x-ms-wm": {"exts": ["wm"], "format": "WMV"},
	"video/x-ms-wmv": {"exts": ["wmv"], "format": "WMV"},
	"video/x-ms-wmx": {"exts": ["wmx"], "format": "WMV"},
	"video/x-ms-wvx": {"exts": ["wvx"], "format": "WMV"},
	"audio/x-ms-wax": {"exts": ["wax"], "format": "WMA"},
	"audio/x-ms-wma": {"exts": ["wma"], "format": "WMA"}
});
