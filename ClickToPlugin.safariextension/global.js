// UPDATE
if(!safari.extension.settings.version || safari.extension.settings.version < 9) {
    alert("ClickToPlugin 2.2b2 Release Notes\n\n--- New in 2.2b2 ---\n\n\u2022 HTML5 replacements for Facebook videos\n\u2022 Complete CSS overhaul\n\u2022 The HTML of placeholder elements has been simplified thanks to CSS3 flex boxes\n\u2022 Reviewed and fixed several killers\n\n--- New in 2.2b ---\n\n\u2022 The extension\u2019s settings are now on their own HTML page accessible through the context menu\n\u2022 Perfected plugin detection by using MIME type sniffing as a last resort, following WebKit's internal mechanism\n\u2022 New blacklists and context menu item to permanently hide plugins\n\u2022 Fixed HTML5 video aspect ratio issues using shadow DOM styling\n\u2022 Customizable keyboard and mouse shortcuts for media playback and other actions\n\u2022 Playlist controls are integrated to the main controls\n\u2022 Safari's incomplete volume slider for HTML5 media elements can be used (use the WebKit nightlies for the finalized volume slider)\n\u2022 The title of the video appears in the controls while loading\n\u2022 All localizations will now be bundled within the same extension");
}
safari.extension.settings.version = 9;

// SETTINGS
const allSettings = ["allowedPlugins", "locationsWhitelist", "sourcesWhitelist", "locationsBlacklist", "sourcesBlacklist", "invertWhitelists", "invertBlacklists", "enabledKillers", "useFallbackMedia", "showSourceSelector", "usePlaylists", "mediaAutoload", "mediaWhitelist", "preload", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "showVolumeSlider", "hideRewindButton", "codecsPolicy", "volume", "disableEnableContext", "addToWhitelistContext", "addToBlacklistContext", "loadAllContext", "loadInvisibleContext", "downloadContext", "viewOnSiteContext", "viewInQTPContext", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "loadInvisible", "maxInvisibleSize", "zeroIsInvisible", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

const injectedSettings = ["enabledKillers", "useFallbackMedia", "showSourceSelector", "preload", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "showVolumeSlider", "hideRewindButton", "volume", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

function getSettings(array) {
    var s = new Object();
    for(var i = 0; i < array.length; i++) {
        s[array[i]] = safari.extension.settings[array[i]];
    }
    return s;
}

//const YT5Sources = ["youtube.com/v/", "s.ytimg.com", "vimeo.com/moogaloop", "vimeocdn.com/p/flash/mooga", "wn29KX6UvhD.swf"];

// CORE
var CTP_instance = 0; // incremented by one whenever a ClickToPlugin instance with content is created

function respondToMessage(event) {
    switch (event.name) {
        case "canLoad":
            event.message = respondToCanLoad(event.message);
            break;
        case "killPlugin":
            killPlugin(event.message, event.target);
            break;
        case "loadAll":
            event.target.page.dispatchMessage("loadAll", event.message);
            break;
        case "checkMIMEType":
            checkMIMEType(event.message, event.target);
            break;
        case "getSettings":
            event.target.page.dispatchMessage("settings", getSettings(allSettings));
            break;
        case "changeSetting":
            safari.extension.settings[event.message.setting] = event.message.value;
            break;
    }
}

function respondToCanLoad(message) {
    // Make checks in correct order for optimal performance
    if(message.location !== undefined) return blockOrAllow(message);
    switch(message) {
        case "getSettings":
            return getSettings(injectedSettings);
        case "getInstance":
            return ++CTP_instance;
        case "sIFR":
            if (safari.extension.settings.sIFRPolicy === "textonly") {
                return {"canLoad": false, "debug": safari.extension.settings.debug};
            } else return {"canLoad": true};
    }
}

function blockOrAllow(data) {
    // returns true if element can be loaded, false if it must be hidden,
    // and data on the plugin object otherwise
    
    // no source, no type & no classid -> cannot instantiate plugin
    if(!data.url && !data.type && !data.classid) return true;
    
    // Check if invisible
    if(data.width <= safari.extension.settings.maxInvisibleSize && data.height <= safari.extension.settings.maxInvisibleSize && (data.width > 0 && data.height > 0) || safari.extension.settings.zeroIsInvisible) {
        if(safari.extension.settings.loadInvisible) return true;
        var isInvisible = true;
    }
    
    // Check whitelists
    if(safari.extension.settings.invertWhitelists !== (matchList(safari.extension.settings.locationsWhitelist, data.location) || matchList(safari.extension.settings.sourcesWhitelist, data.src))) return true;
    //if(safari.extension.settings.YT5Compatibility && matchList(YT5Sources, data.src)) return true;
    // Check blacklists
    if(safari.extension.settings.invertBlacklists !== (matchList(safari.extension.settings.locationsBlacklist, data.location) || matchList(safari.extension.settings.sourcesBlacklist, data.src))) return false;
    
    // The following determination of plugin is based on WebKit's internal mechanism
    var type = data.type;
    var plugin;
    try{
        if(type) {
            if(isNativeType(type)) return true; // NOTE: 3rd-party plugins can override this, e.g. Adobe Reader
            plugin = getPluginForType(type);
            throw null;
        }
        if(isDataURI(data.url)) {
            type = getTypeFromDataURI(data.url);
            if(isNativeType(type)) return true;
            plugin = getPluginForType(type);
            if(!plugin) return true;
            throw null;
        }
        if(data.classid) {
            type = getTypeFromClassid(data.classid);
            if(type) {
                plugin = getPluginForType(type);
                throw null;
            }
        }
        // For extensions in Info.plist (except css, pdf, xml, xbl), WebKit checks 
        // Content-Type header at this point and only continues if it matches no plugin.
        // This is a vulnerability: e.g. a .png file can be served as Flash and won't be blocked...
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
    
    if(plugin && isAllowed(plugin)) return true;
    
    // At this point we know we should block the element
    
    // Exception: ask the user what to do if a QT object would launch QTP
    if(data.autohref && data.target === "quicktimeplayer" && data.href) {
        if(data.className === "CTFallowedToLoad") return true; // for other extensions with open-in-QTP functionality
        if(confirm(QT_CONFIRM_LAUNCH_DIALOG(data.href))) return true;
    }
    
    return {"plugin": getPluginName(plugin, type), "isInvisible": isInvisible};
}

function isAllowed(plugin) {
    for(var i = 0; i < safari.extension.settings.allowedPlugins.length; i++) {
        // like NaN, plugins are not equal to themselves... is this a bug??
        if(plugin.name === navigator.plugins[safari.extension.settings.allowedPlugins[i]].name) return true;
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
    if(event.target.url.substring(0,50) === "safari-extension://com.hoyois.safari.clicktoplugin") return;
    var s = safari.extension.settings;
    
    try {
        var u = event.userInfo; // throws exception if there are no content scripts
    } catch(err) {
        if(s.disableEnableContext && event.target.url) event.contextMenu.appendContextMenuItem("switchOn", TURN_CTP_ON);
        else event.contextMenu.appendContextMenuItem("settings", CTP_PREFERENCES + "\u2026");
        return;
    }
    
    if(u.elementID === undefined) { // Generic menu
        if(s.disableEnableContext) event.contextMenu.appendContextMenuItem("switchOff", TURN_CTP_OFF);
        if(s.loadAllContext && u.blocked > 0 && (u.blocked > u.invisible || !s.loadInvisibleContext)) event.contextMenu.appendContextMenuItem("loadAll", LOAD_ALL_PLUGINS + " (" + u.blocked + ")");
        if(s.loadInvisibleContext && u.invisible > 0) event.contextMenu.appendContextMenuItem("loadInvisible", LOAD_INVISIBLE_PLUGINS + " (" + u.invisible + ")");
        if(s.addToWhitelistContext) event.contextMenu.appendContextMenuItem("locationsWhitelist", s.invertWhitelists ? ALWAYS_BLOCK_ON_DOMAIN : ALWAYS_ALLOW_ON_DOMAIN);
        if(s.addToBlacklistContext) event.contextMenu.appendContextMenuItem("locationsBlacklist", s.invertBlacklists ? ALWAYS_SHOW_ON_DOMAIN : ALWAYS_HIDE_ON_DOMAIN);
        event.contextMenu.appendContextMenuItem("settings", CTP_PREFERENCES + "\u2026");
        return;
    }
    
    var pluginName = /[A-Z]/.test(u.plugin) ? u.plugin : PLUGIN_GENERIC;
    if(u.isMedia) event.contextMenu.appendContextMenuItem("reload", RESTORE_PLUGIN(pluginName));
    else {
        if(u.hasMedia) event.contextMenu.appendContextMenuItem("plugin", LOAD_PLUGIN(pluginName));
        event.contextMenu.appendContextMenuItem("remove", HIDE_PLUGIN(pluginName));
    }
    if(u.hasMedia && u.source !== undefined) {
        if(s.downloadContext && !u.noDownload) event.contextMenu.appendContextMenuItem("download", u.mediaType === "audio" ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
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
            var newTab = safari.application.activeBrowserWindow.activeTab;
            if(newTab.url) newTab = safari.application.activeBrowserWindow.openTab("foreground");
            newTab.url = safari.extension.baseURI + "settings.html";
            break;
        default:
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadContent", {"instance": event.userInfo.instance, "elementID": event.userInfo.elementID, "source": event.userInfo.source, "command": event.command});
            break;
    }
}

function switchOff() {
    safari.extension.removeContentScripts();
    safari.application.activeBrowserWindow.activeTab.url = safari.application.activeBrowserWindow.activeTab.url;
}

function switchOn() {
    safari.extension.addContentScriptFromURL(safari.extension.baseURI + "functions.js");
    safari.extension.addContentScriptFromURL(safari.extension.baseURI + "sourceSelector.js");
    safari.extension.addContentScriptFromURL(safari.extension.baseURI + "mediaPlayer.js");
    safari.extension.addContentScriptFromURL(safari.extension.baseURI + "ClickToPlugin.js");
    safari.application.activeBrowserWindow.activeTab.url = safari.application.activeBrowserWindow.activeTab.url;
}

function handleWhitelisting(list, newWLString) {
    safari.extension.settings[list] = safari.extension.settings[list].concat(newWLString); // push doesn't seem to work??
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
var killers = [new YouTubeKiller(), new VimeoKiller(), new DailymotionKiller(), new FacebookKiller(), new BreakKiller(), new BlipKiller(), new MetacafeKiller(), new TumblrKiller(), new VeohKiller(), new MegavideoKiller(), new BIMKiller(), new GenericKiller(), new SLKiller(), new QTKiller(), new WMKiller(), new DivXKiller()];

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
        
        mediaData.autoplay = true;
        if(!mediaData.loadAfter && defaultSource !== undefined) {
            if(matchList(safari.extension.settings.mediaWhitelist, data.location) && safari.extension.settings.defaultPlayer === "html5") {
                mediaData.autoload = true;
            } else if(safari.extension.settings.mediaAutoload) {
                mediaData.autoload = true;
                mediaData.autoplay = false;
            }
        }        
        
        tab.page.dispatchMessage("mediaData", mediaData);
    };
    
    if(data.baseURL) killers[killerID].process(data, callback);
    else callback(data);
}

// EVENT LISTENERS
safari.application.addEventListener("message", respondToMessage, false);
safari.application.addEventListener("contextmenu", handleContextMenu, false);
safari.application.addEventListener("command", doCommand, false);

