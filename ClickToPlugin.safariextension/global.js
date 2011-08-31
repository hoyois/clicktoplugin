// UPDATE
if(safari.extension.settings.version < 25) {
	safari.extension.settings.removeItem("enabledKillers");
	safari.extension.settings.removeItem("usePlaylists");
	safari.extension.settings.removeItem("language");
	safari.extension.settings.defaultTab = 0;
	safari.extension.settings.maxInvisibleSize = 8;
}
safari.extension.settings.version = 27;

// LOCALIZATION
localize(GLOBAL_STRINGS, safari.extension.settings.language);
function addLocalizationScript() {
	safari.extension.addContentScript(localizeAsScript(INJECTED_STRINGS, safari.extension.settings.language), [], [], false);
}
addLocalizationScript();

// SETTINGS
const allSettings = ["language", "defaultTab", "allowedPlugins", "locationsWhitelist", "sourcesWhitelist", "locationsBlacklist", "sourcesBlacklist", "invertWhitelists", "invertBlacklists", "additionalScripts", "useFallbackMedia", "showSourceSelector", "mediaAutoload", "mediaWhitelist", "initialBehavior", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "hideRewindButton", "codecsPolicy", "volume", "useDownloadManager", "settingsContext", "disableEnableContext", "addToWhitelistContext", "addToBlacklistContext", "loadAllContext", "loadInvisibleContext", "downloadContext", "viewOnSiteContext", "viewInQTPContext", "settingsShortcut", "addToWhitelistShortcut", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "loadInvisible", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

/* Hidden settings:
language (default: undefined)
maxInvisibleSize (default: 8)
zeroIsInvisible: (default: undefined)
*/

const injectedSettings = ["additionalScripts", "useFallbackMedia", "showSourceSelector", "initialBehavior", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "hideRewindButton", "volume", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

function getSettings(array) {
	var s = {};
	for(var i = 0; i < array.length; i++) {
		s[array[i]] = safari.extension.settings[array[i]];
	}
	return s;
}

// The shortcuts to open the prefs and to whitelist a page must work on all pages
// To avoid messaging, we use a dynamic content script to register them
var shortcutScript;
function updateGlobalShortcuts() {
	safari.extension.removeContentScript(shortcutScript);
	var script = "";
	if(safari.extension.settings.settingsShortcut) script += "document.addEventListener(\"" + safari.extension.settings.settingsShortcut.type + "\",function(e){if(testShortcut(e," + JSON.stringify(safari.extension.settings.settingsShortcut) + "))safari.self.tab.dispatchMessage(\"toggleSettings\", \"\");},false);";
	if(safari.extension.settings.addToWhitelistShortcut) script += "document.addEventListener(\"" + safari.extension.settings.addToWhitelistShortcut.type + "\",function(e){if(testShortcut(e," + JSON.stringify(safari.extension.settings.addToWhitelistShortcut) + "))safari.self.tab.dispatchMessage(\"whitelist\",location.href);},false);";
	if(script) shortcutScript =  safari.extension.addContentScript(script, [], [safari.extension.baseURI + "*"], false);
}
updateGlobalShortcuts();

// CORE
var documentID = 0;

function respondToMessage(event) {
	switch(event.name) {
		case "canLoad":
			event.message = respondToCanLoad(event.message);
			break;
		case "killPlugin":
			killPlugin(event.message, event.target);
			break;
		case "checkMIMEType":
			checkMIMEType(event.message, event.target);
			break;
		case "loadAll":
		case "hideAll":
		case "toggleSettings":
			event.target.page.dispatchMessage(event.name, "");
			break;
		case "whitelist":
			handleWhitelisting("locationsWhitelist", extractDomain(event.message));
			break;
		case "openSettings":
			openSettings(safari.application.activeBrowserWindow.openTab("foreground"));
			break;
		case "changeSetting":
			safari.extension.settings[event.message.setting] = event.message.value;
			if(event.message.setting === "settingsShortcut" || event.message.setting === "addToWhitelistShortcut") updateGlobalShortcuts();
			break;
		case "getSettings":
			event.target.page.dispatchMessage("settings", getSettings(allSettings));
			break;
	}
}

function respondToCanLoad(message) {
	// Make checks in correct order for optimal performance
	if(message.src !== undefined) return canLoadPlugin(message);
	if(message === "getSettings") return getSettings(injectedSettings);
	if(message === "getDocumentID") return documentID++;
}

function canLoadPlugin(data) {
	// returns true if element can be loaded, false if it must be hidden,
	// and data on the plugin object otherwise
	
	// no source & no type -> cannot instantiate plugin
	if(!data.src && !data.type) return true;
	
	// Check if invisible
	if(data.width <= safari.extension.settings.maxInvisibleSize && data.height <= safari.extension.settings.maxInvisibleSize && ((data.width > 0 && data.height > 0) || safari.extension.settings.zeroIsInvisible)) {
		if(safari.extension.settings.loadInvisible) return true;
		var isInvisible = true;
	}
	
	// The following determination of plugin is based on WebKit's source
	var type = /^[^;]*/.exec(data.type)[0];
	var plugin;
	try{
		if(type) {
			if(isNativeType(type)) return true; // NOTE: 3rd-party plugins can override this
			plugin = getPluginForType(type);
			throw null;
		}
		if(/^data:/.test(data.src)) {
			type = getTypeFromDataURI(data.src);
			data.src = "";
			if(isNativeType(type)) return true;
			plugin = getPluginForType(type);
			if(!plugin) return true;
			throw null;
		}
		// For extensions in Info.plist (except css, pdf, xml, xbl), WebKit checks 
		// Content-Type header at this point and only continues if it matches no plugin.
		// This is a vulnerability: e.g. a .png file can be served as Flash and won't be blocked...
		if(!data.src) return true;
		var ext = extractExt(data.src);
		if(isNativeExt(ext)) return true;
		var x = getPluginAndTypeForExt(ext);
		if(x) {
			type = x.type;
			plugin = x.plugin;
			throw null;
		}
		// If plugin is not set at this point, WebKit uses the Content-type HTTP header.
		// We can't do that now within the canLoad, but we'll do it later
	} catch(e) {}
	
	// if(data.params.classid && !/^application\/x-java-(?:applet|bean|vm)/.test(type)) return; // correct but not worth it
	
	if(plugin && isAllowed(plugin)) return true;
	
	// Check control lists
	if(plugin === "Silverlight" && data.source) data.src = data.source;
	else if(plugin === "QuickTime" && data.qtsrc) data.src = data.qtsrc;
	if(safari.extension.settings.invertWhitelists !== (matchList(safari.extension.settings.locationsWhitelist, data.location) || matchList(safari.extension.settings.sourcesWhitelist, data.src))) return true;
	if(safari.extension.settings.invertBlacklists !== (matchList(safari.extension.settings.locationsBlacklist, data.location) || matchList(safari.extension.settings.sourcesBlacklist, data.src))) return false;
	
	// At this point we know we should block the element
	
	// Exception: ask the user what to do if a QT object would launch QTP
	if(data.params.href && /^true$/i.test(data.params.autohref) && /^quicktimeplayer$/i.test(data.params.target)) {
		if(/\bCTFallowedToLoad\b/.test(data.params.class)) return true; // for other extensions with open-in-QTP functionality
		if(confirm(QT_CONFIRM_LAUNCH_DIALOG(data.params.href))) return true;
	}
	
	return {"plugin": getPluginName(plugin, type), "src": data.src, "isInvisible": isInvisible};
}

function isAllowed(plugin) {
	for(var i = 0; i < safari.extension.settings.allowedPlugins.length; i++) {
		// like NaN, plugins are not equal to themselves. But filename is a unique ID
		if(plugin.filename === safari.extension.settings.allowedPlugins[i]) return true;
	}
	return false;
}

function checkMIMEType(data, tab) {
	var handleMIMEType = function(type) {
		type = /^[^;]*/.exec(type)[0];
		var plugin = getPluginForType(type);
		if(!plugin || isAllowed(plugin)) {
			tab.page.dispatchMessage("load", {"documentID": data.documentID, "elementID": data.elementID});
		} else {
			tab.page.dispatchMessage("plugin", {"documentID": data.documentID, "elementID": data.elementID, "plugin": getPluginName(plugin, type)});
		}
	};
	getMIMEType(data.url, handleMIMEType);
}

// CONTEXT MENU
function handleContextMenu(event) {
	var s = safari.extension.settings;
	var u = event.userInfo;
	if(u === null) {
		if(s.disableEnableContext && event.target.url) event.contextMenu.appendContextMenuItem("switchOn", SWITCH_ON);
		else if(s.settingsContext) event.contextMenu.appendContextMenuItem("settings", PREFERENCES);
		return;
	}
	if(u.location === safari.extension.baseURI + "settings.html") return;
	
	if(u.elementID === undefined) { // Generic menu
		if(s.disableEnableContext) event.contextMenu.appendContextMenuItem("switchOff", SWITCH_OFF);
		if(s.loadAllContext && u.blocked > 0 && (u.blocked > u.invisible || !s.loadInvisibleContext)) event.contextMenu.appendContextMenuItem("loadAll", LOAD_ALL_PLUGINS + " (" + u.blocked + ")");
		if(s.loadInvisibleContext && u.invisible > 0) event.contextMenu.appendContextMenuItem("loadInvisible", LOAD_INVISIBLE_PLUGINS + " (" + u.invisible + ")");
		if(s.addToWhitelistContext && !matchList(s.locationsWhitelist, u.location)) event.contextMenu.appendContextMenuItem("locationsWhitelist", s.invertWhitelists ? ALWAYS_BLOCK_ON_DOMAIN : ALWAYS_ALLOW_ON_DOMAIN);
		if(s.addToBlacklistContext && !matchList(s.locationsBlacklist, u.location)) event.contextMenu.appendContextMenuItem("locationsBlacklist", s.invertBlacklists ? ALWAYS_SHOW_ON_DOMAIN : ALWAYS_HIDE_ON_DOMAIN);
		if(s.settingsContext) event.contextMenu.appendContextMenuItem("settings", PREFERENCES);
		return;
	}
	
	if(u.isMedia) event.contextMenu.appendContextMenuItem("restore", RESTORE_PLUGIN(u.plugin));
	else {
		if(u.hasMedia) event.contextMenu.appendContextMenuItem("load", LOAD_PLUGIN(u.plugin));
		event.contextMenu.appendContextMenuItem("hide", HIDE_PLUGIN(u.plugin));
	}
	if(u.hasMedia && u.source !== undefined) {
		if(s.downloadContext) event.contextMenu.appendContextMenuItem(safari.extension.settings.useDownloadManager ? "downloadDM" : "download", u.mediaType === "audio" ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
		if(u.siteInfo && s.viewOnSiteContext) event.contextMenu.appendContextMenuItem("viewOnSite", VIEW_ON_SITE(u.siteInfo.name));
		if(s.viewInQTPContext) event.contextMenu.appendContextMenuItem("viewInQTP", VIEW_IN_QUICKTIME_PLAYER);
	}
	if(!u.isMedia) {
		if(s.addToWhitelistContext && !s.invertWhitelists) event.contextMenu.appendContextMenuItem("sourcesWhitelist", ALWAYS_ALLOW_SOURCE);
		if(s.addToBlacklistContext && !s.invertBlacklists) event.contextMenu.appendContextMenuItem("sourcesBlacklist", ALWAYS_HIDE_SOURCE);
		if(s.debug) event.contextMenu.appendContextMenuItem("showInfo", GET_PLUGIN_INFO);
	}
}

function doCommand(event) {
	switch(event.command) {
		case "viewOnSite":
			var newTab = safari.application.activeBrowserWindow.openTab("foreground");
			newTab.url = event.userInfo.siteInfo.url;
			break;
		case "locationsWhitelist":
		case "locationsBlacklist":
			handleWhitelisting(event.command, extractDomain(event.userInfo.location));
			break;
		case "sourcesWhitelist":
		case "sourcesBlacklist":
			handleWhitelisting(event.command, event.userInfo.src.split(/[?#]/)[0]);
			break;
		case "switchOff":
			switchOff();
			break;
		case "switchOn":
			switchOn();
			break;
		case "settings":
			openSettings(safari.application.activeBrowserWindow.activeTab);
			break;
		default:
			safari.application.activeBrowserWindow.activeTab.page.dispatchMessage(event.command, {"documentID": event.userInfo.documentID, "elementID": event.userInfo.elementID, "source": event.userInfo.source});
			break;
	}
}

function openSettings(tab) {
	if(!tab.url) tab.url = safari.extension.baseURI + "settings.html";
	else tab.page.dispatchMessage("toggleSettings", "");
}

function switchOff() {
	safari.extension.removeContentScripts();
	safari.application.activeBrowserWindow.activeTab.url = safari.application.activeBrowserWindow.activeTab.url;
}

function switchOn() {
	safari.extension.removeContentScripts();
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "functions.js");
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "sourceSelector.js");
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "mediaPlayer.js");
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "ClickToPlugin.js");
	addLocalizationScript();
	updateGlobalShortcuts();
	safari.application.activeBrowserWindow.activeTab.url = safari.application.activeBrowserWindow.activeTab.url;
}

function handleWhitelisting(list, newWLString) {
	safari.extension.settings[list] = safari.extension.settings[list].concat(newWLString); // push doesn't work
	// load targeted content at once
	switch(list) {
		case "locationsWhitelist":
			if(!safari.extension.settings.invertWhitelists) dispatchMessageToAllPages("loadLocation", newWLString);
			else safari.application.activeBrowserWindow.activeTab.url = safari.application.activeBrowserWindow.activeTab.url;
			break;
		case "sourcesWhitelist":
			dispatchMessageToAllPages("loadSource", newWLString);
			break;
		case "locationsBlacklist":
			if(!safari.extension.settings.invertBlacklists) dispatchMessageToAllPages("hideLocation", newWLString);
			else safari.application.activeBrowserWindow.activeTab.url = safari.application.activeBrowserWindow.activeTab.url;
			break;
		case "sourcesBlacklist":
			dispatchMessageToAllPages("hideSource", newWLString);
			break;
	}
}

// KILLERS
var killers = {};
function addKiller(name, killer) {killers[name] = killer;}
function hasKiller(name) {return killers[name] !== undefined;}
function getKiller(name) {return killers[name];}

function findKillerFor(data) {
	for(var name in killers) {
		if(killers[name].canKill(data)) return killers[name];
	}
	return null;
}

function killPlugin(data, tab) {
	var callback = function(mediaData) {
		if(mediaData.playlist.length === 0) return;
		mediaData.elementID = data.elementID;
		mediaData.documentID = data.documentID;
		
		if(!mediaData.loadAfter) {
			var defaultSource = chooseDefaultSource(mediaData.playlist[0].sources);
			mediaData.playlist[0].defaultSource = defaultSource;
			mediaData.badgeLabel = makeLabel(mediaData.playlist[0].sources[defaultSource]);
		}
		for(var i = (mediaData.loadAfter ? 0 : 1); i < mediaData.playlist.length; i++) {
			if(mediaData.playlist[i] === null) continue;
			mediaData.playlist[i].defaultSource = chooseDefaultSource(mediaData.playlist[i].sources);
			if(mediaData.playlist[i].defaultSource === undefined) {
				mediaData.playlist[i] = null;
			}
		}
		
		mediaData.autoplay = matchList(safari.extension.settings.mediaWhitelist, data.location);
		mediaData.autoload = defaultSource !== undefined && safari.extension.settings.defaultPlayer === "html5" && (mediaData.autoplay || safari.extension.settings.mediaAutoload);
		
		tab.page.dispatchMessage("mediaData", mediaData);
	};
	
	if(data.playlist) callback(data);
	else {
		var killer = findKillerFor(data);
		if(killer === null) return;
		killer.process(data, callback);
	}
}

// EVENT LISTENERS
safari.application.addEventListener("message", respondToMessage, false);
safari.application.addEventListener("contextmenu", handleContextMenu, false);
safari.application.addEventListener("command", doCommand, false);

// ADDITIONAL SCRIPTS
loadScripts.apply(this, safari.extension.settings.additionalScripts);

