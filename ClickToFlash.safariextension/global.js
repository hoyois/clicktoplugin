// SETTINGS
const allSettings = ["defaultTab", "locationsWhitelist", "sourcesWhitelist", "locationsBlacklist", "sourcesBlacklist", "invertWhitelists", "invertBlacklists", "enabledKillers", "useFallbackMedia", "showSourceSelector", "usePlaylists", "mediaAutoload", "mediaWhitelist", "preload", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "showVolumeSlider", "hideRewindButton", "codecsPolicy", "volume", "disableEnableContext", "addToWhitelistContext", "addToBlacklistContext", "loadAllContext", "loadInvisibleContext", "downloadContext", "viewOnSiteContext", "viewInQTPContext", "settingsShortcut", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "loadInvisible", "maxInvisibleSize", "zeroIsInvisible", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

/* Hidden settings:
settingsContext: true
zeroIsInvisible: undefined
*/

const injectedSettings = ["enabledKillers", "useFallbackMedia", "showSourceSelector", "preload", "maxResolution", "defaultPlayer", "showPluginSourceItem", "showQTPSourceItem", "showVolumeSlider", "hideRewindButton", "volume", "loadAllShortcut", "hideAllShortcut", "hidePluginShortcut", "volumeUpShortcut", "volumeDownShortcut", "playPauseShortcut", "enterFullscreenShortcut", "prevTrackShortcut", "nextTrackShortcut", "toggleLoopingShortcut", "showTitleShortcut", "sIFRPolicy", "opacity", "debug", "showPoster", "showTooltip", "showMediaTooltip"];

function getSettings(array) {
    var s = new Object();
    for(var i = 0; i < array.length; i++) {
        s[array[i]] = safari.extension.settings[array[i]];
    }
    return s;
}

// CORE
var CTF_instance = 0; // incremented by one whenever a ClickToPlugin instance with content is created

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
        case "hideSettings":
            event.target.page.dispatchMessage("hideSettings", "");
            break;
        case "showSettings":
            event.target.page.dispatchMessage("showSettings", "");
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
    if(message === "getInstance") return ++CTF_instance;
}

function blockOrAllow(data) {
    // returns true if element can be loaded, false if it must be hidden,
    // and data on the plugin object otherwise
    
    // no source, no type & no classid -> cannot instantiate plugin
    if(!data.src && !data.type && !data.classid) return true;
    
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
    if(data.classid) {
        if(data.classid.toLowerCase() === "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000") return {"isInvisible": isInvisible};
        else return true;
    }
    
    var ext = extractExt(data.src);
    if(ext === "swf" || ext === "spl") return {"isInvisible": isInvisible};
    else if(isNativeExt(ext)) return true;

    return {"isInvisible": isInvisible, "unknownType": true};
}

function checkMIMEType(data, tab) {
    var handleMIMEType = function(type) {
        if(type === "application/x-shockwave-flash" || type === "application/futuresplash") {
            tab.page.dispatchMessage("loadContent", {"instance": data.instance, "elementID": data.elementID, "command": "changeLabel"});
        } else {
            tab.page.dispatchMessage("loadContent", {"instance": data.instance, "elementID": data.elementID, "command": "plugin"});
        }
    };
    getMIMEType(data.url, handleMIMEType);
}

// CONTEXT MENU
function handleContextMenu(event) {
    var s = safari.extension.settings;
    
    try {
        var u = event.userInfo; // throws exception if there are no content scripts
    } catch(err) {
        if(s.disableEnableContext && event.target.url) event.contextMenu.appendContextMenuItem("switchOn", TURN_CTF_ON);
        else if(s.settingsContext) event.contextMenu.appendContextMenuItem("settings", CTF_PREFERENCES + "\u2026");
        return;
    }
    if(u.location === safari.extension.baseURI + "settings.html") return;
    
    if(u.elementID === undefined) { // Generic menu
        if(s.disableEnableContext) event.contextMenu.appendContextMenuItem("switchOff", TURN_CTF_OFF);
        if(s.loadAllContext && u.blocked > 0 && (u.blocked > u.invisible || !s.loadInvisibleContext)) event.contextMenu.appendContextMenuItem("loadAll", LOAD_ALL_FLASH + " (" + u.blocked + ")");
        if(s.loadInvisibleContext && u.invisible > 0) event.contextMenu.appendContextMenuItem("loadInvisible", LOAD_INVISIBLE_FLASH + " (" + u.invisible + ")");
        if(s.addToWhitelistContext) event.contextMenu.appendContextMenuItem("locationsWhitelist", s.invertWhitelists ? ALWAYS_BLOCK_ON_DOMAIN : ALWAYS_ALLOW_ON_DOMAIN);
        if(s.addToBlacklistContext) event.contextMenu.appendContextMenuItem("locationsBlacklist", s.invertBlacklists ? ALWAYS_SHOW_ON_DOMAIN : ALWAYS_HIDE_ON_DOMAIN);
        if(s.settingsContext) event.contextMenu.appendContextMenuItem("settings", CTF_PREFERENCES + "\u2026");
        return;
    }
    
    if(u.isMedia) event.contextMenu.appendContextMenuItem("reload", RESTORE_PLUGIN("Flash"));
    else {
        if(u.hasMedia) event.contextMenu.appendContextMenuItem("plugin", LOAD_PLUGIN("Flash"));
        event.contextMenu.appendContextMenuItem("remove", HIDE_PLUGIN("Flash"));
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
            if(!safari.application.activeBrowserWindow.activeTab.url) safari.application.activeBrowserWindow.activeTab.url = safari.extension.baseURI + "settings.html";
            else safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("showSettings", "");
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
    safari.extension.addContentScriptFromURL(safari.extension.baseURI + "ClickToFlash.js");
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
var killers = [new YouTubeKiller(), new VimeoKiller(), new DailymotionKiller(), new FacebookKiller(), new BreakKiller(), new BlipKiller(), new MetacafeKiller(), new TumblrKiller(), new VeohKiller(), new MegavideoKiller(), new BIMKiller(), new GenericKiller()];

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

// UPDATE
if(safari.extension.settings.version < 10) {
    alert("ClickToFlash 2.2 Release Notes\n\n--- New Features ---\n\n\u2022 The extension\u2019s settings are now on their own HTML page accessible through the shortcut menu\n\u2022 Perfected plug-in detection following WebKit\u2019s internal mechanism\n\u2022 New blacklists to permanently hide Flash objects\n\u2022 Customizable keyboard and mouse shortcuts for media playback and other actions\n\u2022 HTML5 replacements for Facebook videos\n\u2022 Revamped playlist controls\n\u2022 Safari\u2019s hidden volume slider for HTML5 media elements can be used\n\u2022 The title of the video can be shown in the controls\n\u2022 Contains English and French localizations\n\n--- Bugs Fixed ---\n\n\u2022 Fixed HTML5 video aspect ratio issues using shadow DOM styling\n\u2022 Fixed Megavideo and Veoh HTML5 replacements\n\u2022 The \u2018Show text only\u2019 sIFR setting could cause web pages to display incorrectly");
    
    // Clean deprecated settings
    try { // will throw error if settings don't exist, which might happen cause I screwed up the update chain at some point
        safari.extension.settings.locationsWhitelist = safari.extension.settings.locationsWhitelist.split(/\s+/);
        safari.extension.settings.sourcesWhitelist = safari.extension.settings.sourcesWhitelist.split(/\s+/);
        safari.extension.settings.mediaWhitelist = safari.extension.settings.mediaWhitelist.split(/\s+/);
    } catch(err) {}
    function clearSettings() {
        for(var i = 0; i < arguments.length; i++) {
            safari.extension.settings.removeItem(arguments[i]);
        }
    }
    clearSettings("replacePlugins", "useSourceSelector", "initialBehavior");
} else if(safari.extension.settings.version === 10) {
    alert("ClickToFlash 2.2.1 Release Notes\n\n--- Bugs Fixed ---\n\n\u2022 Fix for Facebook's ever changing video player URL");
}
if(!safari.extension.settings.version || safari.extension.settings.version < 10) {
    var newTab;
    if(safari.application.activeBrowserWindow) newTab = safari.application.activeBrowserWindow.openTab("foreground");
    else newTab = safari.application.openBrowserWindow().activeTab;
    newTab.url = safari.extension.baseURI + "settings.html";
    alert("Welcome to ClickToFlash 2.2!\n\nClickToFlash gives you control over Flash content embedded in web pages. Under this dialog is the extension\u2019s preference pane which you can use to\n\n\u2022 Manage the extension\u2019s whitelists and blacklists\n\u2022 Select the video services for which you want ClickToFlash to provide HTML5 video replacements\n\u2022 Configure ClickToFlash\u2019s HTML5 media player\n\u2022 Choose which commands should appear in the shortcut menu\n\u2022 Configure keyboard and mouse shortcuts for various tasks\n\u2022 And more!\n\nTo access this preference pane from any page, right-click and select “ClickToFlash Preferences\u2026”, or use the shortcut specified in the “Keyboard shortcuts” section of the preferences (currently \u2325,).");
}
safari.extension.settings.version = 14;

