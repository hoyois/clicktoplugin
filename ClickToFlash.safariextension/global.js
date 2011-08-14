// UPDATE
if(safari.extension.settings.version < 25) {
	safari.extension.settings.removeItem("enabledKillers");
	safari.extension.settings.removeItem("usePlaylists");
	safari.extension.settings.removeItem("language");
	safari.extension.settings.defaultTab = 0;
	safari.extension.settings.maxInvisibleSize = 8;
}
safari.extension.settings.version = 25;

// LOCALIZATION
localize(GLOBAL_STRINGS, safari.extension.settings.language);

// SETTINGS
const allSettings = ["language", "defaultTab", "locationsWhitelist", "sourcesWhitelist", "locationsBlacklist", "sourcesBlacklist", "invertWhitelists", "invertBlacklists", "additionalScripts", "useFallbackMedia", "showSourceSelector", "mediaAutoload", "mediaWhitelist", "initialBehavior", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "hideRewindButton", "codecsPolicy", "volume", "useDownloadManager", "settingsContext", "disableEnableContext", "addToWhitelistContext", "addToBlacklistContext", "loadAllContext", "loadInvisibleContext", "downloadContext", "viewOnSiteContext", "viewInQTPContext", "settingsShortcut", "addToWhitelistShortcut", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "loadInvisible", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

/* Hidden settings:
language (default: undefined)
maxInvisibleSize (default: 8)
zeroIsInvisible: (default: undefined)
*/

const injectedSettings = ["additionalScripts", "useFallbackMedia", "showSourceSelector", "initialBehavior", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "hideRewindButton", "volume", "addToWhitelistShortcut", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

function getSettings(array) {
	var s = new Object();
	for(var i = 0; i < array.length; i++) {
		s[array[i]] = safari.extension.settings[array[i]];
	}
	return s;
}

// CORE
var documentID = 0;

function respondToMessage(event) {
	switch (event.name) {
		case "canLoad":
			event.message = respondToCanLoad(event.message);
			break;
		case "getSettingsShortcut":
			if(safari.extension.settings.settingsShortcut) event.target.page.dispatchMessage("settingsShortcut", safari.extension.settings.settingsShortcut);
			break;
		case "killPlugin":
			killPlugin(event.message, event.target);
			break;
		case "checkMIMEType":
			checkMIMEType(event.message, event.target);
			break;
		case "loadAll":
			event.target.page.dispatchMessage("loadAll", event.message);
			break;
		case "whitelist":
			handleWhitelisting("locationsWhitelist", extractDomain(event.message));
			break;
		case "hideSettings":
			event.target.page.dispatchMessage("hideSettings", "");
			break;
		case "showSettings":
			event.target.page.dispatchMessage("showSettings", "");
			break;
		case "openSettings":
			showSettings(safari.application.activeBrowserWindow.openTab("foreground"));
			break;
		case "changeSetting":
			safari.extension.settings[event.message.setting] = event.message.value;
			break;
		case "getSettings":
			event.target.page.dispatchMessage("settings", getSettings(allSettings));
			break;
	}
}

function respondToCanLoad(message) {
	// Make checks in correct order for optimal performance
	if(message.location !== undefined) return blockOrAllow(message);
	if(message === "getSettings") return getSettings(injectedSettings);
	if(message === "getDocumentID") return ++documentID;
}

function blockOrAllow(data) {
	// returns true if element can be loaded, false if it must be hidden,
	// and data on the plugin object otherwise
	
	// no source & no type -> cannot instantiate plugin
	if(!data.src && !data.type) return true;
	
	// Check if invisible
	if(data.width <= safari.extension.settings.maxInvisibleSize && data.height <= safari.extension.settings.maxInvisibleSize && (data.width > 0 && data.height > 0) || safari.extension.settings.zeroIsInvisible) {
		if(safari.extension.settings.loadInvisible) return true;
		var isInvisible = true;
	}
	
	// Check whitelists
	if(safari.extension.settings.invertWhitelists !== (matchList(safari.extension.settings.locationsWhitelist, data.location) || matchList(safari.extension.settings.sourcesWhitelist, data.src))) return true;
	// Check blacklists
	if(safari.extension.settings.invertBlacklists !== (matchList(safari.extension.settings.locationsBlacklist, data.location) || matchList(safari.extension.settings.sourcesBlacklist, data.src))) return false;

	if(data.type === "application/x-shockwave-flash" || data.type === "application/futuresplash") return {"isInvisible": isInvisible};
	else if(data.type) return true;
	if(/^data:/.test(data.src)) return true;
	
	var ext = extractExt(data.src);
	if(ext === "swf" || ext === "spl") return {"isInvisible": isInvisible};
	else if(isNativeExt(ext)) return true;
	
	return {"isInvisible": isInvisible, "unknownType": true};
}

function checkMIMEType(data, tab) {
	var handleMIMEType = function(type) {
		if(type === "application/x-shockwave-flash" || type === "application/futuresplash") {
			tab.page.dispatchMessage("loadContent", {"documentID": data.documentID, "elementID": data.elementID, "command": "changeLabel"});
		} else {
			tab.page.dispatchMessage("loadContent", {"documentID": data.documentID, "elementID": data.elementID, "command": "plugin"});
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
		else if(s.settingsContext) event.contextMenu.appendContextMenuItem("settings", PREFERENCES + "\u2026");
		return;
	}
	if(u.location === safari.extension.baseURI + "settings.html") return;
	
	if(u.elementID === undefined) { // Generic menu
		if(s.disableEnableContext) event.contextMenu.appendContextMenuItem("switchOff", SWITCH_OFF);
		if(s.loadAllContext && u.blocked > 0 && (u.blocked > u.invisible || !s.loadInvisibleContext)) event.contextMenu.appendContextMenuItem("loadAll", LOAD_ALL_PLUGINS + " (" + u.blocked + ")");
		if(s.loadInvisibleContext && u.invisible > 0) event.contextMenu.appendContextMenuItem("loadInvisible", LOAD_INVISIBLE_PLUGINS + " (" + u.invisible + ")");
		if(s.addToWhitelistContext && !matchList(s.locationsWhitelist, u.location)) event.contextMenu.appendContextMenuItem("locationsWhitelist", s.invertWhitelists ? ALWAYS_BLOCK_ON_DOMAIN : ALWAYS_ALLOW_ON_DOMAIN);
		if(s.addToBlacklistContext && !matchList(s.locationsBlacklist, u.location)) event.contextMenu.appendContextMenuItem("locationsBlacklist", s.invertBlacklists ? ALWAYS_SHOW_ON_DOMAIN : ALWAYS_HIDE_ON_DOMAIN);
		if(s.settingsContext) event.contextMenu.appendContextMenuItem("settings", PREFERENCES + "\u2026");
		return;
	}
	
	if(u.isMedia) event.contextMenu.appendContextMenuItem("reload", RESTORE_PLUGIN("Flash"));
	else {
		if(u.hasMedia) event.contextMenu.appendContextMenuItem("plugin", LOAD_PLUGIN("Flash"));
		event.contextMenu.appendContextMenuItem("remove", HIDE_PLUGIN("Flash"));
	}
	if(u.hasMedia && u.source !== undefined) {
		if(s.downloadContext) event.contextMenu.appendContextMenuItem(safari.extension.settings.useDownloadManager ? "downloadDM" : "download", u.mediaType === "audio" ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
		if(u.siteInfo && s.viewOnSiteContext) event.contextMenu.appendContextMenuItem("viewOnSite", VIEW_ON_SITE(u.siteInfo.name));
		if(s.viewInQTPContext) event.contextMenu.appendContextMenuItem("viewInQTP", VIEW_IN_QUICKTIME_PLAYER);
	}
	if(!u.isMedia) {
		if(s.addToWhitelistContext && !s.invertWhitelists) event.contextMenu.appendContextMenuItem("sourcesWhitelist", ALWAYS_ALLOW_SOURCE);
		if(s.addToBlacklistContext && !s.invertBlacklists) event.contextMenu.appendContextMenuItem("sourcesBlacklist", ALWAYS_HIDE_SOURCE);
		// BEGIN DEBUG
		if(s.debug) event.contextMenu.appendContextMenuItem("info", GET_PLUGIN_INFO);
		//END DEBUG
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
			showSettings(safari.application.activeBrowserWindow.activeTab);
			break;
		default:
			safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadContent", {"documentID": event.userInfo.documentID, "elementID": event.userInfo.elementID, "source": event.userInfo.source, "command": event.command});
			break;
	}
}

function showSettings(tab) {
	if(!tab.url) tab.url = safari.extension.baseURI + "settings.html";
	else tab.page.dispatchMessage("showSettings", "");
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
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "ClickToFlash.js");
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
var killers = new Object();
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
			mediaData.playlist[i].defaultSource = chooseDefaultSource(mediaData.playlist[i].sources);
			if(mediaData.playlist[i].defaultSource === undefined) {
				if(mediaData.missed !== undefined) ++mediaData.missed;
				mediaData.playlist.splice(i--, 1);
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

