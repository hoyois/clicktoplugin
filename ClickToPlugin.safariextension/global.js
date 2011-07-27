// SETTINGS
const allSettings = ["defaultTab", "allowedPlugins", "locationsWhitelist", "sourcesWhitelist", "locationsBlacklist", "sourcesBlacklist", "invertWhitelists", "invertBlacklists", "enabledKillers", "useFallbackMedia", "showSourceSelector", "usePlaylists", "mediaAutoload", "mediaWhitelist", "initialBehavior", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "hideRewindButton", "codecsPolicy", "volume", "useDownloadManager", "settingsContext", "disableEnableContext", "addToWhitelistContext", "addToBlacklistContext", "loadAllContext", "loadInvisibleContext", "downloadContext", "viewOnSiteContext", "viewInQTPContext", "settingsShortcut", "addToWhitelistShortcut", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "loadInvisible", "maxInvisibleSize", "zeroIsInvisible", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

/* Hidden settings:
zeroIsInvisible: undefined
*/

const injectedSettings = ["enabledKillers", "useFallbackMedia", "showSourceSelector", "initialBehavior", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "hideRewindButton", "volume", "addToWhitelistShortcut", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

function getSettings(array) {
    var s = new Object();
    for(var i = 0; i < array.length; i++) {
        s[array[i]] = safari.extension.settings[array[i]];
    }
    return s;
}

// CORE
var CTP_instance = 0; // incremented by one whenever a ClickToPlugin instance with content is created

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
    if(message === "getInstance") return ++CTP_instance;
}

function blockOrAllow(data) {
    // returns true if element can be loaded, false if it must be hidden,
    // and data on the plugin object otherwise
    
    // no source & no type -> cannot instantiate plugin
    if(!data.url && !data.type) return true;
    
    // Check if invisible
    if(data.width <= safari.extension.settings.maxInvisibleSize && data.height <= safari.extension.settings.maxInvisibleSize && (data.width > 0 && data.height > 0) || safari.extension.settings.zeroIsInvisible) {
        if(safari.extension.settings.loadInvisible) return true;
        var isInvisible = true;
    }
    
    // Check whitelists
    if(safari.extension.settings.invertWhitelists !== (matchList(safari.extension.settings.locationsWhitelist, data.location) || matchList(safari.extension.settings.sourcesWhitelist, data.src))) return true;
    // Check blacklists
    if(safari.extension.settings.invertBlacklists !== (matchList(safari.extension.settings.locationsBlacklist, data.location) || matchList(safari.extension.settings.sourcesBlacklist, data.src))) return false;
    
    // The following determination of plugin is based on WebKit's internal mechanism
    var type = data.type;
    var plugin;
    try{
        if(type) {
            if(isNativeType(type)) return true; // NOTE: 3rd-party plugins can override this
            plugin = getPluginForType(type);
            throw null;
        }
        if(/^data:/.test(data.url)) {
            type = getTypeFromDataURI(data.url);
            if(isNativeType(type)) return true;
            plugin = getPluginForType(type);
            if(!plugin) return true;
            throw null;
        }
        // For extensions in Info.plist (except css, pdf, xml, xbl), WebKit checks 
        // Content-Type header at this point and only continues if it matches no plugin.
        // This is a vulnerability: e.g. a .png file can be served as Flash and won't be blocked...
        if(!data.url) return true;
        var ext = extractExt(data.url);
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
    
    if(plugin) {
        if(isAllowed(plugin)) return true;
    } else {
        // If no PDF plugin is found, Safari will handle it natively
        if(type === "application/pdf" || ext === "pdf") return true;
    }
    
    // At this point we know we should block the element
    
    // Exception: ask the user what to do if a QT object would launch QTP
    if(data.autohref && data.target === "quicktimeplayer" && data.href) {
        if(/\bCTFallowedToLoad\b/.test(data.className)) return true; // for other extensions with open-in-QTP functionality
        if(confirm(QT_CONFIRM_LAUNCH_DIALOG(data.href))) return true;
    }
    
    return {"plugin": getPluginName(plugin, type), "isInvisible": isInvisible};
}

function isAllowed(plugin) {
    for(var i = 0; i < safari.extension.settings.allowedPlugins.length; i++) {
        // like NaN, plugins are not equal to themselves. But .filename is a unique ID
        if(plugin.filename === safari.extension.settings.allowedPlugins[i]) return true;
    }
    return false;
}

function checkMIMEType(data, tab) {
    var handleMIMEType = function(type) {
        var plugin = getPluginForType(type);
        if(!plugin || isAllowed(plugin)) {
            tab.page.dispatchMessage("loadContent", {"instance": data.instance, "elementID": data.elementID, "command": "plugin"});
        } else {
            tab.page.dispatchMessage("loadContent", {"instance": data.instance, "elementID": data.elementID, "command": "changeLabel", "plugin": getPluginName(plugin, type)});
        }
    };
    getMIMEType(data.url, handleMIMEType);
}

// CONTEXT MENU
function handleContextMenu(event) {
    var s = safari.extension.settings;
    var u = event.userInfo;
    if(u === null) {
        if(s.disableEnableContext && event.target.url) event.contextMenu.appendContextMenuItem("switchOn", TURN_CTP_ON);
        else if(s.settingsContext) event.contextMenu.appendContextMenuItem("settings", CTP_PREFERENCES + "\u2026");
        return;
    }
    if(u.location === safari.extension.baseURI + "settings.html") return;
    
    if(u.elementID === undefined) { // Generic menu
        if(s.disableEnableContext) event.contextMenu.appendContextMenuItem("switchOff", TURN_CTP_OFF);
        if(s.loadAllContext && u.blocked > 0 && (u.blocked > u.invisible || !s.loadInvisibleContext)) event.contextMenu.appendContextMenuItem("loadAll", LOAD_ALL_PLUGINS + " (" + u.blocked + ")");
        if(s.loadInvisibleContext && u.invisible > 0) event.contextMenu.appendContextMenuItem("loadInvisible", LOAD_INVISIBLE_PLUGINS + " (" + u.invisible + ")");
        if(s.addToWhitelistContext && !matchList(s.locationsWhitelist, u.location)) event.contextMenu.appendContextMenuItem("locationsWhitelist", s.invertWhitelists ? ALWAYS_BLOCK_ON_DOMAIN : ALWAYS_ALLOW_ON_DOMAIN);
        if(s.addToBlacklistContext && !matchList(s.locationsBlacklist, u.location)) event.contextMenu.appendContextMenuItem("locationsBlacklist", s.invertBlacklists ? ALWAYS_SHOW_ON_DOMAIN : ALWAYS_HIDE_ON_DOMAIN);
        if(s.settingsContext) event.contextMenu.appendContextMenuItem("settings", CTP_PREFERENCES + "\u2026");
        return;
    }
    
    var pluginName = /[A-Z]/.test(u.plugin) ? u.plugin : PLUGIN_GENERIC;
    if(u.isMedia) event.contextMenu.appendContextMenuItem("reload", RESTORE_PLUGIN(pluginName));
    else {
        if(u.hasMedia) event.contextMenu.appendContextMenuItem("plugin", LOAD_PLUGIN(pluginName));
        event.contextMenu.appendContextMenuItem("remove", HIDE_PLUGIN(pluginName));
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
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadContent", {"instance": event.userInfo.instance, "elementID": event.userInfo.elementID, "source": event.userInfo.source, "command": event.command});
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
    safari.extension.addContentScriptFromURL(safari.extension.baseURI + "ClickToPlugin.js");
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
var killers = [new YouTubeKiller(), new VimeoKiller(), new DailymotionKiller(), new FacebookKiller(), new BreakKiller(), new BlipKiller(), new MetacafeKiller(), new TumblrKiller(), new TEDKiller(), new MegavideoKiller(), new BIMKiller(), new FlowKiller(), new GenericKiller(), new SLKiller(), new QTKiller(), new WMKiller(), new DivXKiller()];

function findKillerFor(data) {
    for (var i = 0; i < safari.extension.settings.enabledKillers.length; i++) {
        if(killers[safari.extension.settings.enabledKillers[i]].canKill(data)) return safari.extension.settings.enabledKillers[i];
    }
    return null;
}

function killPlugin(data, tab) {
    if(data.baseURL) {
        var killerID = findKillerFor(data);
        if(killerID === null) return;
    }
    
    var callback = function(mediaData) {
        if(mediaData.playlist.length === 0) return;
        mediaData.elementID = data.elementID;
        mediaData.instance = data.instance;
        mediaData.plugin = data.plugin;
        
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
    
    if(data.baseURL) killers[killerID].process(data, callback);
    else callback(data);
}

// EVENT LISTENERS
safari.application.addEventListener("message", respondToMessage, false);
safari.application.addEventListener("contextmenu", handleContextMenu, false);
safari.application.addEventListener("command", doCommand, false);

// UPDATE
function clearSettings() {
    for(var i = 0; i < arguments.length; i++) {
        safari.extension.settings.removeItem(arguments[i]);
    }
}
if(safari.extension.settings.version < 10) clearSettings("pluginsWhitelist", "invertPluginsWhitelist", "replacePlugins", "useSourceSelector");
else if(safari.extension.settings.version < 15) clearSettings("preload");
if(safari.extension.settings.version < 16) {
    function updateWhitelists() {
        for(var i = 0; i < arguments.length; i++) {
            if(typeof safari.extension.settings[arguments[i]] === "string") safari.extension.settings[arguments[i]] = safari.extension.settings[arguments[i]].split(/\s+/);
        }
    }
    updateWhitelists("locationsWhitelist", "sourcesWhitelist", "mediaWhitelist");
}
if(safari.extension.settings < 19) {
    safari.extension.settings.enabledKillers = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
    clearSettings("showVolumeSlider");
}
safari.extension.settings.version = 22;

