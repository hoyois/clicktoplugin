// UPDATE
if(safari.extension.settings.version < 25) {
	safari.extension.settings.removeItem("enabledKillers");
	safari.extension.settings.removeItem("usePlaylists");
	safari.extension.settings.removeItem("language");
	safari.extension.settings.maxInvisibleSize = 8;
}
if(safari.extension.settings.version < 27) {
	// IS this check needed? i.e., what if you set a setting to undefined?
	if(safari.extension.settings.maxResolution) safari.extension.settings.defaultResolution = safari.extension.settings.maxResolution;
	safari.extension.settings.allowInvisible = safari.extension.settings.loadInvisible;
	safari.extension.settings.removeItem("maxResolution");
	safari.extension.settings.removeItem("loadInvisible");
	safari.extension.settings.removeItem("showPoster");
	safari.extension.settings.removeItem("showMediaTooltip");
	safari.extension.settings.removeItem("defaultTab");
}
safari.extension.settings.version = 27;

// LOCALIZATION // THINK ABOUT THAT
localize(GLOBAL_STRINGS, safari.extension.settings.language);
localizeAsScript(INJECTED_STRINGS, safari.extension.settings.language);

// SETTINGS
const allSettings = ["language", "currentTab", "additionalScripts", "useFallbackMedia", "allowedPlugins", "locationsWhitelist", "sourcesWhitelist", "locationsBlacklist", "sourcesBlacklist", "invertWhitelists", "invertBlacklists", "showSourceSelector", "mediaAutoload", "mediaWhitelist", "initialBehavior", "instantPlay", "defaultResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "hideRewindButton", "codecsPolicy", "volume", "useDownloadManager", "settingsContext", "disableEnableContext", "addToWhitelistContext", "addToBlacklistContext", "loadAllContext", "loadInvisibleContext", "downloadContext", "viewOnSiteContext", "viewInQTPContext", "settingsShortcut", "addToWhitelistShortcut", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "allowInvisible", "sIFRPolicy", "opacity", "debug", "showTooltip"];

/* Hidden settings:
language (default: undefined)
maxInvisibleSize (default: 8)
*/

const injectedSettings = ["useFallbackMedia", "showSourceSelector", "initialBehavior", "instantPlay", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "hideRewindButton", "volume", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "sIFRPolicy", "opacity", "debug", "showTooltip"];

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
	if(safari.extension.settings.settingsShortcut) script += "document.addEventListener(\"" + safari.extension.settings.settingsShortcut.type + "\",function(e){if(testShortcut(e," + JSON.stringify(safari.extension.settings.settingsShortcut) + "))safari.self.tab.dispatchMessage(\"showSettings\", \"\");},false);";
	if(safari.extension.settings.addToWhitelistShortcut) script += "document.addEventListener(\"" + safari.extension.settings.addToWhitelistShortcut.type + "\",function(e){if(testShortcut(e," + JSON.stringify(safari.extension.settings.addToWhitelistShortcut) + "))safari.self.tab.dispatchMessage(\"whitelist\",location.href);},false);";
	if(script) shortcutScript =  safari.extension.addContentScript(script, [], [safari.extension.baseURI + "*"], false);
}
updateGlobalShortcuts();

function changeSetting(key, value) {
	safari.extension.settings[key] = value;
	switch(key) {
	case "settingsShortcut":
	case "addToWhitelistShortcut":
		updateGlobalShortcuts();
		break;
	case "additionalScripts": // reload killers
		killers = {};
		loadScripts.apply(this, safari.extension.settings.additionalScripts);
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
		// ONLY IF !invert ???
		handleWhitelisting("locationsWhitelist", extractDomain(event.message));
		break;
	case "openSettings":
		openSettings(safari.application.activeBrowserWindow.openTab("foreground"));
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
		data.type = stripParams(data.type).toLowerCase(); // ignore parameters in MIME type
		plugin = getPluginForType(data);
	} else if(isDataURI(data.src)) {
		data.type = getTypeFromDataURI(data.src);
		plugin = getPluginForType(data);
	} else {
		plugin = getPluginForExt(data);
	}
	// This is correct but really not worth it (classid is "java:...")
	// if(data.params.classid && !/^application\/x-java-(?:applet|bean|vm)/.test(type)) plugin = null;
	
	/* plugin is now either:
	-> nativePlugin (see globalfunctions.js)
	-> null (Safari will either load the resource directly or use fallback content)
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
	if(data.width <= safari.extension.settings.maxInvisibleSize && data.height <= safari.extension.settings.maxInvisibleSize && data.width > 0 && data.height > 0) {
		if(safari.extension.settings.allowInvisible) return true;
		response.isInvisible = true;
	}
	
	// Check control lists
	if(safari.extension.settings.invertWhitelists !== (matchList(safari.extension.settings.locationsWhitelist, data.location) || matchList(safari.extension.settings.sourcesWhitelist, data.src))) return true;
	if(plugin !== null && safari.extension.settings.invertBlacklists !== (matchList(safari.extension.settings.locationsBlacklist, data.location) || matchList(safari.extension.settings.sourcesBlacklist, data.src))) return false;
	
	// Check sIFR
	if(/\bsIFR-flash\b/.test(data.params.class)) {
		if(safari.extension.settings.sIFRPolicy === "autoload") return true;
		if(safari.extension.settings.sIFRPolicy === "textonly") return "disableSIFR";
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
	response.type = data.type;
	
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
		else { // Plugin-launching content was disguised as native image type...
			response.plugin = getPluginName(plugin);
			tab.page.dispatchMessage("plugin", response);
		}
	}
	setTimeout(function() {getMIMEType(data.src, handleMIMEType);}, 0);
	return nativePlugin;
}

function isAllowed(plugin) {
	for(var i = 0; i < safari.extension.settings.allowedPlugins.length; i++) {
		// Accessing navigator.plugins[...] creates a new object so === is always false,
		// but Safari uses the filename property as a unique ID for plugins
		if(plugin.filename === safari.extension.settings.allowedPlugins[i]) return true;
	}
	return false;
}

// CONTEXT MENU
function handleContextMenu(event) {
	var s = safari.extension.settings;
	var u = event.userInfo;
	if(u === null) {
		if(safari.extension.disabled) {
			if(s.disableEnableContext) event.contextMenu.appendContextMenuItem("switchOn", SWITCH_ON);
		} else {
			if(s.settingsContext && !event.target.url) event.contextMenu.appendContextMenuItem("settings", PREFERENCES);
		}
		return;
	}
	if(u.location === safari.extension.baseURI + "settings.html") return;
	
	if(u.elementID === undefined) { // Generic menu
		if(s.loadAllContext && u.blocked > 0 && (u.blocked > u.invisible || !s.loadInvisibleContext)) event.contextMenu.appendContextMenuItem("loadAll", LOAD_ALL_PLUGINS + " (" + u.blocked + ")");
		if(s.loadInvisibleContext && u.invisible > 0) event.contextMenu.appendContextMenuItem("loadInvisible", LOAD_INVISIBLE_PLUGINS + " (" + u.invisible + ")");
		if(s.addToWhitelistContext && !matchList(s.locationsWhitelist, u.location)) event.contextMenu.appendContextMenuItem("locationsWhitelist", s.invertWhitelists ? ALWAYS_BLOCK_ON_DOMAIN : ALWAYS_ALLOW_ON_DOMAIN);
		if(s.addToBlacklistContext && !matchList(s.locationsBlacklist, u.location)) event.contextMenu.appendContextMenuItem("locationsBlacklist", s.invertBlacklists ? ALWAYS_SHOW_ON_DOMAIN : ALWAYS_HIDE_ON_DOMAIN);
		if(s.disableEnableContext) event.contextMenu.appendContextMenuItem("switchOff", SWITCH_OFF);
		if(s.settingsContext) event.contextMenu.appendContextMenuItem("settings", PREFERENCES);
		return;
	}
	
	if(u.isMedia) event.contextMenu.appendContextMenuItem("restore", RESTORE_PLUGIN(u.plugin));
	else {
		if(u.hasMedia) event.contextMenu.appendContextMenuItem("load", LOAD_PLUGIN(u.plugin));
		event.contextMenu.appendContextMenuItem("hide", HIDE_PLUGIN(u.plugin));
		if(s.addToWhitelistContext && !s.invertWhitelists) event.contextMenu.appendContextMenuItem("sourcesWhitelist", ALWAYS_ALLOW_SOURCE);
		if(s.addToBlacklistContext && !s.invertBlacklists) event.contextMenu.appendContextMenuItem("sourcesBlacklist", ALWAYS_HIDE_SOURCE);
		if(s.debug) event.contextMenu.appendContextMenuItem("showInfo", GET_PLUGIN_INFO);
	}
	if(u.hasMedia && u.source !== undefined) {
		if(s.downloadContext) event.contextMenu.appendContextMenuItem(safari.extension.settings.useDownloadManager ? "downloadDM" : "download", u.isAudio ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
		if(u.siteInfo && s.viewOnSiteContext) event.contextMenu.appendContextMenuItem("viewOnSite", VIEW_ON_SITE(u.siteInfo.name));
		if(s.viewInQTPContext) event.contextMenu.appendContextMenuItem("viewInQTP", VIEW_IN_QUICKTIME_PLAYER);
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
	else tab.page.dispatchMessage("showSettings", "");
}

function switchOff() {
	safari.extension.removeContentScripts();
	safari.extension.disabled = true;
	reloadTab(safari.application.activeBrowserWindow.activeTab);
}

function switchOn() {
	safari.extension.removeContentScripts();
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "functions.js");
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "sourceSelector.js");
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "mediaPlayer.js");
	safari.extension.addContentScriptFromURL(safari.extension.baseURI + "main.js");
	localizeAsScript(INJECTED_STRINGS, safari.extension.settings.language);
	updateGlobalShortcuts();
	safari.extension.disabled = false;
	reloadTab(safari.application.activeBrowserWindow.activeTab);
}

function handleWhitelisting(list, newWLString) {
	safari.extension.settings[list] = safari.extension.settings[list].concat(newWLString); // push doesn't work
	// load targeted content at once
	switch(list) {
	case "locationsWhitelist":
		if(!safari.extension.settings.invertWhitelists) dispatchMessageToAllPages("loadLocation", newWLString);
		else reloadTab(safari.application.activeBrowserWindow.activeTab);
		break;
	case "sourcesWhitelist":
		dispatchMessageToAllPages("loadSource", newWLString);
		break;
	case "locationsBlacklist":
		if(!safari.extension.settings.invertBlacklists) dispatchMessageToAllPages("hideLocation", newWLString);
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
function findKillerFor(data) {
	for(var name in killers) {
		if(killers[name].canKill(data)) return name;
	}
	return null;
}

function kill(data, tab) {
	var killerIDs = [];
	for(var name in killers) {
		if(killers[name].canKill(data)) killerIDs.push(name);
	}
	if(killerIDs.length === 0) return false;
	
	var callback = function(mediaData) {
		if(mediaData.playlist.length === 0) return;
		mediaData.elementID = data.elementID;
		mediaData.documentID = data.documentID;
		
		for(var i = 0; i < mediaData.playlist.length; i++) {
			if(mediaData.playlist[i] === null) continue;
			mediaData.playlist[i].defaultSource = chooseDefaultSource(mediaData.playlist[i].sources);
			makeTitle(mediaData.playlist[i]);
			if(mediaData.playlist[i].defaultSource === undefined) {
				if(i > 0 || mediaData.loadAfter) mediaData.playlist[i] = null;
			}
		}
		if(!mediaData.loadAfter) {
			mediaData.badgeLabel = makeLabel(mediaData.playlist[0].sources[mediaData.playlist[0].defaultSource]);
			mediaData.autoplay = matchList(safari.extension.settings.mediaWhitelist, data.location);
			mediaData.autoload = mediaData.playlist[0].defaultSource !== undefined && safari.extension.settings.defaultPlayer === "html5" && (mediaData.autoplay || safari.extension.settings.mediaAutoload);
		}
		
		tab.page.dispatchMessage("mediaData", mediaData);
	};
	
	setTimeout(function() {killers[killerIDs[0]].process(data, callback);}, 0);
	return true;
}

// EVENT LISTENERS
safari.application.addEventListener("message", respondToMessage, false);
safari.application.addEventListener("contextmenu", handleContextMenu, false);
safari.application.addEventListener("command", doCommand, false);

// ADDITIONAL SCRIPTS
loadScripts.apply(this, safari.extension.settings.additionalScripts);

