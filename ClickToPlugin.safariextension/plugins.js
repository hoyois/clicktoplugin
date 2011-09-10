/***********************
Plugin detection methods
***********************/

const nativePlugin = {};
const superNativeTypes = ["image/jpeg", "image/gif", "image/bmp", "image/x-icon", "image/vnd.microsoft.icon", "image/pjpeg", "image/x-xbitmap"];
const nativeTypes = superNativeTypes.concat(["image/png", "image/tiff", "image/jp2"]);
const superNativeExts = ["jpeg", "jpg", "gif", "bmp", "ico", "xbm"];
const nativeExts = superNativeExts.concat(["png", "tiff", "tif", "jp2"]);

/* NOTE on native image types
The algorithm for native types (same for exts if type is not specified) is the following.
(This is obviously not an intended algorithm, but is what happens anyway)
CASE EMBED
if type is super-native
	load directly
else
	proceed normally.
CASE OBJECT
if type is native
	try
		load directly
	catch
		if Content-Type is native
			use fallback
		else
			choose plugin according to Content-Type
else
	proceed normally
END
The try statement imply that it's impossible to determine what plugin WebKit is going to use in general.
However, it is possible to not let any plugin through with minimal error, by sniffing the Content-Type
when an object elements has native type. I doubt there exists a single web page out there where this is not correct.
That would require, e.g., a jpeg image being decalred as image/jpeg but served with a Flash MIME type. In this
case WebKit will just load the jpeg file, while this extension will treat the object as Flash. But clicking
the Flash placeholder will load the image correctly.

The catch case also creates a pretty late duplicate beforeload event, which means we can't remove the
'allowedToLoad' property when it's there. THAT MEANS SPECIFYING A NATIVE TYPE AND NATIVE CONTENT_TYPE
FOR AN UNSOPPORTED RESOURCE CAN BE USED AS A TRAMPOLINE TO LOAD ANY PLUGIN, AND NOTHING CAN BE DONE ABOUT IT!!!

Another bug is that fallback content is always used when restoring such objects, so we need
to clone them before reinsertion.

Finally, I don't understand where the difference between embed and object types comes from.
*/

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
	if(data.pluginsDisabled) return null;
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
	if(data.pluginsDisabled) return null;
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