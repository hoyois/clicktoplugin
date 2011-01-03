// UPDATE
if(!safari.extension.settings.version) {
    if(safari.extension.settings.usesrcWhitelist && safari.extension.settings.srcblacklist) {
        safari.extension.settings.invertWhitelists = true;
        safari.extension.settings.sourcesWhitelist = safari.extension.settings.srcblacklist;
        safari.extension.settings.removeItem("srcblacklist");
        if(safari.extension.settings.uselocWhitelist) {
            safari.extension.settings.locationsWhitelist = safari.extension.settings.locblacklist;
            safari.extension.settings.removeItem("locblacklist");
        }
    } else {
        if(safari.extension.settings.usesrcWhitelist) {
            safari.extension.settings.sourcesWhitelist = safari.extension.settings.srcwhitelist;
            safari.extension.settings.removeItem("srcwhitelist");
        }
        if(safari.extension.settings.uselocWhitelist) {
            safari.extension.settings.locationsWhitelist = safari.extension.settings.locwhitelist;
            safari.extension.settings.removeItem("locwhitelist");
        }
    }
    if(safari.extension.settings.H264whitelist) {
        safari.extension.settings.mediaWhitelist = safari.extension.settings.H264whitelist;
        safari.extension.settings.removeItem("H264whitelist");
    }
    
    var removeSettings = function() {
        for(var i = 0; i < arguments.length; i++) {
            safari.extension.settings.removeItem(arguments[i]);
        }
    };
    removeSettings("useH264", "useSwitcher", "H264autoload", "videowhitelist", "H264behavior", "maxresolution", "QTbehavior", "uselocWhitelist", "usesrcWhitelist", "maxinvdim", "useOOcontext", "useWLcontect", "useLAcontext", "useLIcontext", "useDVcontext", "useSUcontext", "useVScontext", "useQTcontext", "sifrReplacement");
}

safari.extension.settings.version = 3;

// SETTINGS
var locationsWhitelist, sourcesWhitelist;

function updateWhitelists() {
    if(safari.extension.settings.locationsWhitelist) locationsWhitelist = safari.extension.settings.locationsWhitelist.split(/\s+/);
    else locationsWhitelist = false;
    if(safari.extension.settings.sourcesWhitelist) sourcesWhitelist = safari.extension.settings.sourcesWhitelist.split(/\s+/);
    else sourcesWhitelist = false;
}

updateWhitelists();

function handleChangeOfSettings(event) {
    switch(event.key) {
        case "volume":
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("updateVolume", event.newValue);
            break;
        case "opacity":
            dispatchMessageToAllPages("updateOpacity", event.newValue);
            break;
        case "locationsWhitelist":
        case "sourcesWhitelist":
            updateWhitelists();
            break;
    }
}

function getSettings() { // for injected scripts
    return {
        "replacePlugins": safari.extension.settings.replacePlugins,
        "sIFRAutoload": safari.extension.settings.sIFRPolicy === "autoload",
        "opacity": safari.extension.settings.opacity,
        "debug": safari.extension.settings.debug,
        "useSourceSelector": safari.extension.settings.useSourceSelector,
        "showPoster": safari.extension.settings.showPoster,
        "initialBehavior": safari.extension.settings.initialBehavior,
        "volume": safari.extension.settings.volume
    };
}

// CORE
var CTF_instance = 0; // incremented by one whenever a ClickToPlugin instance with content is created

function respondToMessage(event) {
    switch (event.name) {
        case "canLoad":
            event.message = respondToCanLoad(event.message);
            break;
        case "killPlugin":
            killPlugin(event.message);
            break;
    }
}

function respondToCanLoad(message) {
    // Make checks in correct order for optimal performance
    if(message.location !== undefined) return blockOrAllow(message);
    switch(message) {
        case "getSettings":
            return getSettings();
        case "getInstance":
            return ++CTF_instance;
        case "sIFR":
            if (safari.extension.settings.sIFRPolicy === "textonly") {
                return {"canLoad": false, "debug": safari.extension.settings.debug};
            } else return {"canLoad": true};
    }
}

function blockOrAllow(data) { // check the whitelists and returns true if element can be loaded

    // Check if invisible
    if(data.width <= safari.extension.settings.maxInvisibleSize && data.height <= safari.extension.settings.maxInvisibleSize && (data.width > 0 && data.height > 0) || safari.extension.settings.zeroIsInvisible) {
        if(safari.extension.settings.loadInvisible) return true;
        var isInvisible = true;
    }
    
    // Check whitelists
    if(safari.extension.settings.invertWhitelists !== ((locationsWhitelist && matchList(locationsWhitelist, data.location)) || (sourcesWhitelist && matchList(sourcesWhitelist, data.src)))) return true;
    
    return {"isInvisible": isInvisible};
}

// CONTEXT MENU
function handleContextMenu(event) {
    var s = safari.extension.settings;
    
    try {
        var u = event.userInfo; // throws exception if there are no content scripts
    } catch(err) {
        if(s.disableEnableContext) event.contextMenu.appendContextMenuItem("switchOn", TURN_CTF_ON);
        return;
    }
    
    if(!u.instance) { // Generic menu
        if(s.disableEnableContext) event.contextMenu.appendContextMenuItem("switchOff", TURN_CTF_OFF);
        if(s.loadAllContext && u.blocked > 0 && (u.blocked > u.invisible || !s.loadInvisibleContext)) event.contextMenu.appendContextMenuItem("loadAll", LOAD_ALL_FLASH + " (" + u.blocked + ")");
        if(s.loadInvisibleContext && u.invisible > 0) event.contextMenu.appendContextMenuItem("loadInvisible", LOAD_INVISIBLE_FLASH + " (" + u.invisible + ")");
        if(s.addToWhitelistContext) event.contextMenu.appendContextMenuItem("locationsWhitelist", ADD_TO_LOC_WHITELIST + "\u2026");
        return;
    }
    
    if(u.isVideo) event.contextMenu.appendContextMenuItem("reload", RELOAD_IN_PLUGIN("Flash"));
    else {
        if(u.hasVideo) event.contextMenu.appendContextMenuItem("plugin", LOAD_PLUGIN("Flash"));
        event.contextMenu.appendContextMenuItem("remove", REMOVE_PLUGIN("Flash"));
    }
    if(u.hasVideo && u.source !== undefined) {
        if(s.downloadContext) event.contextMenu.appendContextMenuItem("download", u.mediaType === "audio" ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
        if(u.siteInfo && s.viewOnSiteContext) event.contextMenu.appendContextMenuItem("viewOnSite", VIEW_ON_SITE(u.siteInfo.name));
        if(s.viewInQTPContext) event.contextMenu.appendContextMenuItem("viewInQTP", VIEW_IN_QUICKTIME_PLAYER);
    }
    if(!u.isVideo) {
        if(s.addToWhitelistContext && !s.invertWhitelists) event.contextMenu.appendContextMenuItem("sourcesWhitelist", ADD_TO_SRC_WHITELIST + "\u2026");
        // BEGIN DEBUG
        if(s.debug) event.contextMenu.appendContextMenuItem("show", SHOW_ELEMENT + " " + u.instance + "." + u.elementID);
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
            handleWhitelisting(true, event.userInfo.location);
            break;
        case "sourcesWhitelist":
            handleWhitelisting(false, event.userInfo.src);
            break;
        case "loadAll":
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadAll", "");
            break;
        case "loadInvisible":
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadInvisible", "");
            break;
        case "switchOff":
            switchOff();
            break;
        case "switchOn":
            switchOn();
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

function handleWhitelisting(type, url) {
    var newWLstring = prompt(type ? (safari.extension.settings.invertWhitelists ? ADD_TO_LOC_BLACKLIST_DIALOG : ADD_TO_LOC_WHITELIST_DIALOG) : ADD_TO_SRC_WHITELIST_DIALOG, url);
    if(newWLstring) {
        var space = safari.extension.settings[(type ? "locations" : "sources") + "Whitelist"] ? " " : "";
        safari.extension.settings[(type ? "locations" : "sources") + "Whitelist"] += space + newWLstring;
        // load targeted content at once
        if(!type) dispatchMessageToAllPages("loadSource", newWLstring);
        else if(!safari.extension.settings.invertWhitelists) dispatchMessageToAllPages("loadLocation", newWLstring);
    }
}

// KILLERS
var killers = [new YouTubeKiller(), new VimeoKiller(), new DailymotionKiller(), new BreakKiller(), new BlipKiller(), new MetacafeKiller(), new TumblrKiller(), new VeohKiller(), new MegavideoKiller(), new BIMKiller(), new GenericKiller()];

if(safari.extension.settings.disabledKillers) {
    var disabledKillers = safari.extension.settings.disabledKillers.sort(function(a,b) {return a - b;});
    for(var i = disabledKillers.length - 1; i >= 0; i--) {
        killers.splice(disabledKillers[i], 1);
    }
}

function findKillerFor(data) {
    for (var i = 0; i < killers.length; i++) {
        if(killers[i].canKill(data)) return i;
    }
    return null;
}

function killPlugin(data) {
    if(data.baseURL) {
        var killerID = findKillerFor(data);
        if(killerID === null) return;
    }
    
    var callback = function(mediaData) {
        if(mediaData.playlist.length === 0 || mediaData.playlist[0].sources.length === 0) return;
        mediaData.elementID = data.elementID;
        mediaData.instance = data.instance;
        
        if(!mediaData.loadAfter) {
            var defaultSource = chooseDefaultSource(mediaData.playlist[0].sources, mediaData.playlist[0].bestSource);
            mediaData.playlist[0].defaultSource = defaultSource;
            mediaData.badgeLabel = makeLabel(mediaData.playlist[0].sources[defaultSource], mediaData.playlist[0].mediaType);
        }
        for(var i = (mediaData.loadAfter ? 0 : 1); i < mediaData.playlist.length; i++) {
            mediaData.playlist[i].defaultSource = chooseDefaultSource(mediaData.playlist[i].sources, mediaData.playlist[i].bestSource);
            if(mediaData.playlist[i].defaultSource === undefined) {
                if(mediaData.missed !== undefined) ++mediaData.missed;
                mediaData.playlist.splice(i--, 1);
            }
        }
        
        if(safari.extension.settings.mediaAutoload && !mediaData.loadAfter && defaultSource !== undefined) {
            if(!safari.extension.settings.mediaWhitelist) mediaData.autoload = true;
            else mediaData.autoload = matchList(safari.extension.settings.mediaWhitelist.split(/\s+/), data.location);
        }
        
        // the following messsage must be dispatched to all pages to make sure that
        // pages or tabs loading in the background get their mediaData
        dispatchMessageToAllPages("mediaData", mediaData);
    };
    
    if(data.baseURL) killers[killerID].processElement(data, callback);
    else callback(data);
}

// EVENT LISTENERS
safari.application.addEventListener("message", respondToMessage, false);
safari.application.addEventListener("contextmenu", handleContextMenu, false);
safari.application.addEventListener("command", doCommand, false);
safari.extension.settings.addEventListener("change", handleChangeOfSettings, false);

