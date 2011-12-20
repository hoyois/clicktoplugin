"use strict";
// UPDATE
if(settings.version === undefined) {
	openTab(safari.extension.baseURI + "settings.html");
}
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
if(settings.version < 29) {
	settings.openInQTPContext = settings.viewInQTPContext;
	settings.removeItem("viewInQTPContext");
	settings.showMediaSources = settings.showSourceSelector;
	settings.showPluginSource = settings.showSourceSelector;
	settings.removeItem("showSourceSelector");
	settings.killer = settings.additionalScripts;
	settings.removeItem("additionalScripts");
}
settings.version = 33;

// LOCALIZATION
localize(GLOBAL_STRINGS, settings.language);
var localizationScript = localizeAsScript(INJECTED_STRINGS, settings.language);
safari.extension.addContentScript(localizationScript, [], [], false);

// SETTINGS
var ALL_SETTINGS = ["language", "currentTab", "killers", "loadIfNotKilled", "useFallbackMedia", "locationsWhitelist", "sourcesWhitelist", "locationsBlacklist", "sourcesBlacklist", "invertWhitelists", "invertBlacklists", "mediaAutoload", "mediaWhitelist", "initialBehavior", "instantAutoplay", "defaultResolution", "defaultPlayer", "showMediaSources", "showPluginSource", "showQTPSource", "showAirPlaySource", "showSiteSource", "showPoster", "hideRewindButton", "codecsPolicy", "volume", "useDownloadManager", "settingsContext", "disableEnableContext", "addToWhitelistContext", "addToBlacklistContext", "loadAllContext", "loadInvisibleContext", "downloadContext", "viewOnSiteContext", "openInQTPContext", "airplayContext", "settingsShortcut", "addToWhitelistShortcut", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "trackSelectorShortcut", "allowInvisible", "sIFRPolicy", "opacity", "debug", "showTooltip", "airplayHostname", "airplayPassword"];
var SECURE_SETTINGS = ["airplayPassword"];
var INJECTED_SETTINGS = ["useFallbackMedia", "initialBehavior", "instantAutoplay", "defaultPlayer", "showMediaSources", "showPluginSource", "showQTPSource", "showAirPlaySource", "showSiteSource", "showPoster", "hideRewindButton", "volume", "useDownloadManager", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "trackSelectorShortcut", "sIFRPolicy", "opacity", "debug", "showTooltip"];

/* Hidden settings:
language (default: undefined)
maxInvisibleSize (default: 8) */

function getSettings(array) {
	var s = {};
	array.forEach(function(key) {
		s[key] = (isSecureSetting(key) ? secureSettings : settings)[key];
	});
	return s;
}

function isSecureSetting(key) {
	return SECURE_SETTINGS.indexOf(key) !== -1;
}

// Some shortcuts must work on all pages
// To avoid messaging, we use a dynamic content script to register them
var shortcutScript;
function updateGlobalShortcuts() {
	safari.extension.removeContentScript(shortcutScript);
	var script = "";
	if(settings.settingsShortcut) script += "document.addEventListener(\"" + settings.settingsShortcut.type + "\",function(e){if(testShortcut(e," + JSON.stringify(settings.settingsShortcut) + "))safari.self.tab.dispatchMessage(\"showSettings\", \"\");},false);";
	if(settings.addToWhitelistShortcut) script += "document.addEventListener(\"" + settings.addToWhitelistShortcut.type + "\",function(e){if(testShortcut(e," + JSON.stringify(settings.addToWhitelistShortcut) + "))safari.self.tab.dispatchMessage(\"whitelist\",location.href);},false);";
	if(script) shortcutScript =  safari.extension.addContentScript(script, [], [safari.extension.baseURI + "*"], false);
}
updateGlobalShortcuts();

function changeSetting(key, value) {
	(isSecureSetting(key) ? secureSettings : settings)[key] = value;
	switch(key) {
	case "settingsShortcut":
	case "addToWhitelistShortcut":
		updateGlobalShortcuts();
		break;
	case "killers": // reload killers
		killers = {};
		loadScripts.apply(this, value);
		break;
	}
}

function handleChangeEvent(event) {
	if(event.key === "settingsSwitch" && event.newValue === true) {
		safari.extension.settings.settingsSwitch = false;
		openTab(safari.extension.baseURI + "settings.html");
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
	case "airplay":
		airplay(event.message);
		break;
	case "openSettings":
		openTab(safari.extension.baseURI + "settings.html");
		break;
	case "changeSetting":
		changeSetting(event.message.setting, event.message.value);
		break;
	case "getSettings":
		event.target.page.dispatchMessage("CTPsettings", getSettings(ALL_SETTINGS));
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
	if(response.plugin === "QuickTime" && data.params.href && data.params.autohref !== undefined && /^quicktimeplayer$/i.test(data.params.target)) {
		if(/\bCTPallowedToLoad\b/.test(data.params.class)) return true; // for other extensions with open-in-QTP functionality
		if(confirm(QT_CONFIRM_LAUNCH_DIALOG(data.params.href))) return true;
	}
	
	if(data.documentID === undefined) {
		data.documentID = documentCount++;
		response.documentID = data.documentID;
		response.settings = getSettings(INJECTED_SETTINGS);
	}
	response.src = data.src;
	
	// Killers
	if(plugin === nativePlugin) {
		if(settings.loadIfNotKilled) return true;
	} else {
		if(!kill(data, tab) && (plugin === null || settings.loadIfNotKilled)) return true;
	}
	
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
	return plugin.name !== "Shockwave Flash";
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
	if(u.site && settings.viewOnSiteContext) c.appendContextMenuItem("viewOnSite", VIEW_ON_SITE(u.site));
	if(u.source !== undefined) {
		if(settings.downloadContext) c.appendContextMenuItem("download", u.isAudio ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
		if(settings.openInQTPContext) c.appendContextMenuItem("openInQTP", OPEN_IN_QUICKTIME_PLAYER);
		if(settings.airplayContext) c.appendContextMenuItem("airplay", SEND_VIA_AIRPLAY);
	}
}

function doCommand(event) {
	var tab = safari.application.activeBrowserWindow.activeTab;
	switch(event.command) {
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
	updateGlobalShortcuts();
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
		/* TODO?: implement this
		if(mediaData === null) { // killer failed
			if(++k < killerIDs.length) killers[killerIDs[k]].process(data, callback);
			else if(settings.loadIfNotKilled) tab.page.dispatchMessage("load", {"documentID": data.documentID, "elementID": data.elementID});
			return;
		}*/
		if(mediaData.playlist.length === 0) return;
		
		for(var i = 0; i < mediaData.playlist.length; i++) {
			if(mediaData.playlist[i] === null) continue;
			mediaData.playlist[i].defaultSource = chooseDefaultSource(mediaData.playlist[i].sources);
			if(mediaData.playlist[i].defaultSource === undefined && (i > 0 || mediaData.loadAfter)) mediaData.playlist[i] = null;
		}
		if(!mediaData.loadAfter) {
			if(mediaData.playlist[0] === null) return;
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
safari.extension.settings.addEventListener("change", handleChangeEvent, false);

// LOAD KILLERS
loadScripts.apply(this, settings.killers);

