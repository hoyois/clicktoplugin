"use strict";
// UPDATE
if(settings.version < 25) {
	settings.removeItem("enabledKillers");
	settings.removeItem("usePlaylists");
	settings.removeItem("language");
	settings.maxInvisibleSize = 8;
}
if(settings.version < 27) {
	settings.defaultResolution = settings.maxResolution;
	settings.removeItem("maxResolution");
	settings.allowInvisible = settings.loadInvisible;
	settings.removeItem("loadInvisible");
	settings.trackSelectorShortcut = settings.showTitleShortcut;
	settings.removeItem("showTitleShortcut");	
	settings.removeItem("showPoster");
	settings.removeItem("showMediaTooltip");
	settings.removeItem("defaultTab");
}
settings.version = 27;

// LOCALIZATION
localize(GLOBAL_STRINGS, settings.language);
var localizationScript = localizeAsScript(INJECTED_STRINGS, settings.language);
safari.extension.addContentScript(localizationScript, [], [], false);

// SETTINGS
var allSettings = ["language", "currentTab", "additionalScripts", "useFallbackMedia", "allowedPlugins", "locationsWhitelist", "sourcesWhitelist", "locationsBlacklist", "sourcesBlacklist", "invertWhitelists", "invertBlacklists", "showSourceSelector", "mediaAutoload", "mediaWhitelist", "initialBehavior", "instantAutoplay", "defaultResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "showSiteSourceItem", "hideRewindButton", "codecsPolicy", "volume", "useDownloadManager", "settingsContext", "disableEnableContext", "addToWhitelistContext", "addToBlacklistContext", "loadAllContext", "loadInvisibleContext", "downloadContext", "viewOnSiteContext", "viewInQTPContext", "settingsShortcut", "addToWhitelistShortcut", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "trackSelectorShortcut", "allowInvisible", "sIFRPolicy", "opacity", "debug", "showTooltip"];

/* Hidden settings:
language (default: undefined)
maxInvisibleSize (default: 8)
*/

var injectedSettings = ["useFallbackMedia", "showSourceSelector", "initialBehavior", "instantAutoplay", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "showSiteSourceItem", "hideRewindButton", "volume", "useDownloadManager", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "trackSelectorShortcut", "sIFRPolicy", "opacity", "debug", "showTooltip"];

function getSettings(array) {
	var s = {};
	for(var i = 0; i < array.length; i++) {
		s[array[i]] = settings[array[i]];
	}
	return s;
}

// Some shortcuts must work on all pages
// To avoid messaging, we use a dynamic content script to register them
var shortcutScript;
function injectGlobalShortcuts() {
	safari.extension.removeContentScript(shortcutScript);
	var script = "";
	if(settings.settingsShortcut) script += "document.addEventListener(\"" + settings.settingsShortcut.type + "\",function(e){if(testShortcut(e," + JSON.stringify(settings.settingsShortcut) + "))safari.self.tab.dispatchMessage(\"showSettings\", \"\");},false);";
	if(settings.addToWhitelistShortcut) script += "document.addEventListener(\"" + settings.addToWhitelistShortcut.type + "\",function(e){if(testShortcut(e," + JSON.stringify(settings.addToWhitelistShortcut) + "))safari.self.tab.dispatchMessage(\"whitelist\",location.href);},false);";
	if(script) shortcutScript =  safari.extension.addContentScript(script, [], [safari.extension.baseURI + "*"], false);
}
injectGlobalShortcuts();

function changeSetting(key, value) {
	settings[key] = value;
	switch(key) {
	case "settingsShortcut":
	case "addToWhitelistShortcut":
		injectGlobalShortcuts();
		break;
	case "additionalScripts": // reload killers
		killers = {};
		loadScripts.apply(this, settings.additionalScripts);
		break;
	}
}

// CORE
var documentCount = 0;

function respondToMessage(event) {
	switch(event.name) {
	case "canLoad":
		event.message = canLoad(event.message, event.target);
		break;
	case "loadAll":
	case "hideAll":
	case "showSettings":
	case "hideSettings":
		event.target.page.dispatchMessage(event.name, "");
		break;
	case "whitelist":
		handleWhitelisting("locationsWhitelist", extractDomain(event.message));
		break;
	case "openTab":
		openTab(event.message);
		break;
	case "openSettings":
		openTab(safari.extension.baseURI + "settings.html");
		break;
	case "changeSetting":
		changeSetting(event.message.setting, event.message.value);
		break;
	case "getSettings":
		event.target.page.dispatchMessage("CTPsettings", getSettings(allSettings));
		break;
	}
}

function canLoad(data, tab) {
	var response = {};
	
	// Determine plugin
	var plugin;
	if(!data.src && !data.type) {
		plugin = null;
	} else if(data.type) {
		data.type = stripParams(data.type).toLowerCase();
		plugin = getPluginForType(data);
	} else if(isDataURI(data.src)) {
		data.type = getTypeFromDataURI(data.src);
		plugin = getPluginForType(data);
	} else {
		plugin = getPluginForExt(data);
	}
	// This is correct but really not worth it (classid is "java:...")
	// if(data.params.classid && !/^application\/x-java-(?:applet|bean|vm)$/.test(type)) plugin = null;
	
	/* plugin is now either:
	-> null: Safari will not use a plugin
	-> nativePlugin: Safari will try to load the resource directly but use a plugin for Content-Type in case of failure
	-> the plugin object that Safari will use
	*/
	
	if(plugin === nativePlugin) {
		response.isNative = true;
		plugin = resolveNativePlugin(data, tab);
	}
	if(isDataURI(data.src)) data.src = "";
	
	if(plugin !== null && plugin !== nativePlugin) {
		if(isAllowed(plugin)) return true;
		adjustSource(data, plugin);
		response.plugin = getPluginName(plugin);
	}
	
	// Check if invisible
	if(data.width <= settings.maxInvisibleSize && data.height <= settings.maxInvisibleSize && data.width > 0 && data.height > 0) {
		if(settings.allowInvisible) return true;
		response.isInvisible = true;
	}
	
	// Check control lists
	if(settings.invertWhitelists !== (matchList(settings.locationsWhitelist, data.location) || matchList(settings.sourcesWhitelist, data.src))) return true;
	if(settings.invertBlacklists !== (matchList(settings.locationsBlacklist, data.location) || matchList(settings.sourcesBlacklist, data.src))) return false;
	
	// Check sIFR
	if(/\bsIFR-flash\b/.test(data.params.class)) {
		if(settings.sIFRPolicy === "autoload") return true;
		if(settings.sIFRPolicy === "textonly") return "disableSIFR";
	}
	
	// Give user a chance to allow if a QT object would launch QTP
	if(response.plugin === "QuickTime" && data.params.href && /^true$/i.test(data.params.autohref) && /^quicktimeplayer$/i.test(data.params.target)) {
		if(/\bCTPallowedToLoad\b/.test(data.params.class)) return true; // for other extensions with open-in-QTP functionality
		if(confirm(QT_CONFIRM_LAUNCH_DIALOG(data.params.href))) return true;
	}
	
	if(data.documentID === undefined) {
		data.documentID = documentCount++;
		response.documentID = data.documentID;
		response.settings = getSettings(injectedSettings);
	}
	response.src = data.src;
	
	// Killers
	if(plugin !== nativePlugin && !kill(data, tab) && plugin === null) return true;
	
	return response;
}

function resolveNativePlugin(data, tab) {
	if(isDataURI(data.src)) {
		data.type = getTypeFromDataURI(data.src);
		var plugin = getPluginForType(data);
		if(plugin === nativePlugin) return null;
		return plugin;
	}
	var handleMIMEType = function(type) {
		data.type = stripParams(type);
		var response = {"documentID": data.documentID, "elementID": data.elementID};
		var plugin = getPluginForType(data);
		if(plugin === null || plugin === nativePlugin || isAllowed(plugin)) tab.page.dispatchMessage("load", response);
		else { // Plugin-launching content disguised as native image type
			response.plugin = getPluginName(plugin);
			tab.page.dispatchMessage("plugin", response);
		}
	}
	setTimeout(function() {getMIMEType(data.src, handleMIMEType);}, 0);
	return nativePlugin;
}

function isAllowed(plugin) {
	for(var i = 0; i < settings.allowedPlugins.length; i++) {
		// Accessing navigator.plugins[...] creates a new object so === is always false,
		// but Safari uses the filename property as a unique ID for plugins
		if(plugin.filename === settings.allowedPlugins[i]) return true;
	}
	return false;
}

// CONTEXT MENU
function handleContextMenu(event) {
	var u = event.userInfo;
	var c = event.contextMenu;
	if(u === null) {
		if(safari.extension.disabled) {
			if(settings.disableEnableContext) c.appendContextMenuItem("switchOn", SWITCH_ON);
		} else {
			if(settings.settingsContext && !event.target.url) c.appendContextMenuItem("settings", PREFERENCES);
		}
		return;
	}
	if(u.location === safari.extension.baseURI + "settings.html") return;
	
	if(u.elementID === undefined) { // Generic menu
		if(settings.loadAllContext && u.blocked > 0 && (u.blocked > u.invisible || !settings.loadInvisibleContext)) c.appendContextMenuItem("loadAll", LOAD_ALL_PLUGINS + " (" + u.blocked + ")");
		if(settings.loadInvisibleContext && u.invisible > 0) c.appendContextMenuItem("loadInvisible", LOAD_INVISIBLE_PLUGINS + " (" + u.invisible + ")");
		if(settings.addToWhitelistContext && !matchList(settings.locationsWhitelist, u.location)) c.appendContextMenuItem("locationsWhitelist", settings.invertWhitelists ? ALWAYS_BLOCK_ON_DOMAIN : ALWAYS_ALLOW_ON_DOMAIN);
		if(settings.addToBlacklistContext && !matchList(settings.locationsBlacklist, u.location)) c.appendContextMenuItem("locationsBlacklist", settings.invertBlacklists ? ALWAYS_SHOW_ON_DOMAIN : ALWAYS_HIDE_ON_DOMAIN);
		if(settings.disableEnableContext) c.appendContextMenuItem("switchOff", SWITCH_OFF);
		if(settings.settingsContext) c.appendContextMenuItem("settings", PREFERENCES);
		return;
	}
	
	if(u.isMedia) c.appendContextMenuItem("restore", RESTORE_PLUGIN(u.plugin));
	else {
		if(u.hasMedia) c.appendContextMenuItem("load", LOAD_PLUGIN(u.plugin));
		c.appendContextMenuItem("hide", HIDE_PLUGIN(u.plugin));
		if(settings.addToWhitelistContext && !settings.invertWhitelists && u.src) c.appendContextMenuItem("sourcesWhitelist", ALWAYS_ALLOW_SOURCE);
		if(settings.addToBlacklistContext && !settings.invertBlacklists && u.src) c.appendContextMenuItem("sourcesBlacklist", ALWAYS_HIDE_SOURCE);
		if(settings.debug) c.appendContextMenuItem("showInfo", GET_PLUGIN_INFO);
	}
	if(u.source !== undefined) {
		if(settings.downloadContext) c.appendContextMenuItem("download", u.isAudio ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
		if(settings.viewInQTPContext) c.appendContextMenuItem("viewInQTP", VIEW_IN_QUICKTIME_PLAYER);
	}
	if(u.siteInfo && settings.viewOnSiteContext) c.appendContextMenuItem("viewOnSite", VIEW_ON_SITE(u.siteInfo.name));
}

function doCommand(event) {
	var tab = safari.application.activeBrowserWindow.activeTab;
	switch(event.command) {
	case "viewOnSite":
		openTab(event.userInfo.siteInfo.url);
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
		if(!tab.url) tab.url = safari.extension.baseURI + "settings.html";
		else tab.page.dispatchMessage("showSettings", "");
		break;
	default:
		tab.page.dispatchMessage(event.command, event.userInfo);
		break;
	}
}

function switchOff() {
	safari.extension.removeContentScripts();
	safari.extension.disabled = true;
	reloadTab(safari.application.activeBrowserWindow.activeTab);
}

function switchOn() {
	safari.extension.removeContentScripts();
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "functions.js");
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "MediaPlayer.js");
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "main.js");
	safari.extension.addContentScript(localizationScript, [], [], false);
	injectGlobalShortcuts();
	safari.extension.disabled = false;
	reloadTab(safari.application.activeBrowserWindow.activeTab);
}

function handleWhitelisting(list, newWLString) {
	settings[list] = settings[list].concat(newWLString); // push doesn't work
	// load targeted content at once
	switch(list) {
	case "locationsWhitelist":
		if(!settings.invertWhitelists) dispatchMessageToAllPages("loadLocation", newWLString);
		else reloadTab(safari.application.activeBrowserWindow.activeTab);
		break;
	case "sourcesWhitelist":
		dispatchMessageToAllPages("loadSource", newWLString);
		break;
	case "locationsBlacklist":
		if(!settings.invertBlacklists) dispatchMessageToAllPages("hideLocation", newWLString);
		else reloadTab(safari.application.activeBrowserWindow.activeTab);
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
// TODO: negative killer callbacks: return fail();

function kill(data, tab) {
	var killerID;
	for(var name in killers) {
		if(killers[name].canKill(data)) {
			killerID = name;
			break;
		}
	}
	if(killerID === undefined) return false;
	
	var callback = function(mediaData) {
		if(!tab.page) return; // user has closed tab
		if(mediaData.playlist.length === 0) return;
		
		for(var i = 0; i < mediaData.playlist.length; i++) {
			if(mediaData.playlist[i] === null) continue;
			mediaData.playlist[i].defaultSource = chooseDefaultSource(mediaData.playlist[i].sources);
			if(mediaData.playlist[i].defaultSource === undefined && (i > 0 || mediaData.loadAfter)) mediaData.playlist[i] = null;
		}
		if(!mediaData.loadAfter) {
			mediaData.autoplay = matchList(settings.mediaWhitelist, data.location);
			mediaData.autoload = mediaData.playlist[0].defaultSource !== undefined && settings.defaultPlayer === "html5" && (mediaData.autoplay || settings.mediaAutoload);
		}
		
		tab.page.dispatchMessage("mediaData", {"documentID": data.documentID, "elementID": data.elementID, "data": mediaData});
	};
	
	setTimeout(function() {killers[killerID].process(data, callback);}, 0);
	return true;
}

// EVENT LISTENERS
safari.application.addEventListener("message", respondToMessage, false);
safari.application.addEventListener("contextmenu", handleContextMenu, false);
safari.application.addEventListener("command", doCommand, false);

// ADDITIONAL SCRIPTS
loadScripts.apply(this, settings.additionalScripts);

