// SETTINGS
var maxinvdim, locwhitelist, locblacklist, srcwhitelist, srcblacklist, greenlist, redlist;

function updateWhitelist(name) {
    if(safari.extension.settings[name]) this[name] = safari.extension.settings[name].split(/\s+/);
    else this[name] = false;
}

function updateInvisibleDimensions() {
    var dim = safari.extension.settings["maxinvdim"].split("x");
    maxinvdim = {"width": parseInt(dim[0]), "height": parseInt(dim[1])};
}

updateWhitelist("locwhitelist");
updateWhitelist("locblacklist");
updateWhitelist("srcwhitelist");
updateWhitelist("srcblacklist");
updateWhitelist("greenlist");
updateWhitelist("redlist");
updateInvisibleDimensions();

function handleChangeOfSettings(event) {
    switch(event.key) {
        case "volume":
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("updateVolume", event.newValue);
            break;
        case "opacity":
            dispatchMessageToAllPages("updateOpacity", event.newValue);
            break;
        case "maxinvdim":
            updateInvisibleDimensions();
            break;
        case "locwhitelist":
        case "locblacklist":
        case "srcwhitelist":
        case "srcblacklist":
        case "greenlist":
        case "redlist":
            updateWhitelist(event.key);
            break;
    }
}

function getSettings() { // return the settings injected scripts need
    var settings = new Object();
    settings.maxinvdim = maxinvdim;
    settings.useH264 = safari.extension.settings["useH264"];
    settings.usePlaylists = safari.extension.settings["usePlaylists"];
    settings.showPoster = safari.extension.settings["showPoster"];
    settings.H264behavior = safari.extension.settings["H264behavior"];
    settings.volume = safari.extension.settings["volume"];
    settings.sifrReplacement = safari.extension.settings["sifrReplacement"];
    settings.opacity = safari.extension.settings["opacity"];
    settings.debug = safari.extension.settings["debug"];
    return settings;
}

// CORE
var CTP_instance = 0; // incremented by one whenever a ClickToPlugin instance with content is created

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
            return ++CTP_instance;
        case "sIFR":
            if (safari.extension.settings["sifrReplacement"] == "textonly") {
                return {"canLoad": false, "debug": safari.extension.settings["debug"]};
            } else return {"canLoad": true};
    }
}

function blockOrAllow(data) { // returns true if element can be loaded, the name of the plugin otherwise
    
    // no source and no type -> must allow, it's probably going to pass through here again after being modified by a script
    if(!data.attr.src && !data.attr.type && !data.attr.classid) return true;
    
    // native Safari support
    // NOTE: 3rd-party plugins can override this... Anyone still using Adobe Reader? LOL
    var ext = extractExt(data.attr.src); // used later as well
    if(data.attr.type) {
        if(isNativeType(data.attr.type)) return true;
    } else {
        // This is a vulnerability: e.g. a .png file can be served as Flash and won't be blocked...
        if(isNativeExt(ext)) return true;
    }
    
    // Deal with invisible plugins
    if(safari.extension.settings["loadInvisible"] && data.dim.width > 0 && data.dim.height > 0) {
        if(data.dim.width <= maxinvdim.width && data.dim.height <= maxinvdim.height) return true;
    }
    
    // Deal with whitelisted content
    if(safari.extension.settings["uselocWhitelist"]) {
        if(locwhitelist && matchList(locwhitelist, data.location)) return true;
        if(locblacklist && !matchList(locblacklist, data.location)) return true;
    }
    if(safari.extension.settings["usesrcWhitelist"]) {
        if(srcwhitelist && matchList(srcwhitelist, data.attr.src)) return true;
        if(srcblacklist && !matchList(srcblacklist, data.attr.src)) return true;
    }
    
    // The following determination of type is based on WebKit's internal mechanism
    var type = data.attr.type;
    var plugin = null;
    if(!type) {
        if(data.attr.classid) type = getTypeForClassid(data.attr.classid);
        if(!type) {
            var x = getPluginAndTypeForExt(ext);
            if(x) {
                type = x.type;
                plugin = x.plugin;
            }
        } else plugin = getPluginForType(type);
    } else plugin = getPluginForType(type);
    // If type is not set at this point, WebKit uses the HTTP header and/or (?) determines the type from the resource itself
    // We'll just block everything.
    // We could check the HTTP header, but only asynchronously, which means we should later clone this element
    // upon restore otherwise WebKit would use fallback content (bug 44827)
    
    // Use greenlist/redlist
    if(type) {
        if(safari.extension.settings["block"] === "useRedlist") {
            if(!matchList(redlist, type)) return true;
        } else if(safari.extension.settings["block"] === "useGreenlist") {
            if(matchList(greenlist, type)) return true;
        }
    }
    
    var pluginName = "?";
    if(plugin) pluginName = getPluginNameFromPlugin(plugin);
    else if(type) pluginName = getPluginNameFromType(type);
    
    if(safari.extension.settings["allowQT"] && pluginName === "QuickTime") return true;
    
    // At this point we know we should block the element
    
    // Exception: ask the user what to do if a QT object would launch QTP
    if(data.attr.autohref && data.attr.target === "quicktimeplayer" && data.attr.href) {
        if(data.className === "CTFallowedToLoad") return true;
        if(confirm(QT_CONFIRM_LAUNCH_DIALOG(data.attr.href))) return true;
    }
    
    // Exception 2: JS-Silverlight interaction?
    /*if(pluginName == "Silverlight" && !data.src) {
        if(!confirm(SL_CONFIRM_BLOCK_DIALOG(data.width + "x" + data.height))) return null;
    }*/
    
    return pluginName;
}

// CONTEXT MENU
function handleContextMenu(event) {
    var s = safari.extension.settings;
    var u = event.userInfo;
    
    if(!u.instance) { // Generic menu
        if(s.useLAcontext && u.blocked > 0 && (u.blocked > u.invisible || !s.useLIcontext)) event.contextMenu.appendContextMenuItem("loadall", LOAD_ALL_PLUGINS + " (" + u.blocked + ")");
        if(s.useLIcontext && u.invisible > 0) event.contextMenu.appendContextMenuItem("loadinvisible", LOAD_INVISIBLE_PLUGINS + " (" + u.invisible + ")");
        if(s.useWLcontext) event.contextMenu.appendContextMenuItem("locwhitelist", ADD_TO_LOC_WHITELIST + "\u2026");
        return;
    }
    
    var pluginName = /[A-Z]/.test(u.plugin) ? u.plugin : PLUGIN_GENERIC;
    if(u.isVideo) event.contextMenu.appendContextMenuItem("reload", RELOAD_IN_PLUGIN(pluginName));
    else {
        if(u.hasH264) event.contextMenu.appendContextMenuItem("plugin", LOAD_PLUGIN(pluginName));
        event.contextMenu.appendContextMenuItem("remove", REMOVE_PLUGIN(pluginName));
    }
    if(u.isVideo || u.hasH264) {
        if(s.useDVcontext) event.contextMenu.appendContextMenuItem("download", u.mediaType == "audio" ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
        if(u.siteInfo && s.useVScontext) event.contextMenu.appendContextMenuItem("gotosite", VIEW_ON_SITE(u.siteInfo.name));
        if(s.useQTcontext) event.contextMenu.appendContextMenuItem("qtp", VIEW_IN_QUICKTIME_PLAYER);
    }
    if(!u.isVideo) {
        if(s.useWLcontext) event.contextMenu.appendContextMenuItem("srcwhitelist", ADD_TO_SRC_WHITELIST + "\u2026");
        // BEGIN DEBUG
        if(s.debug) event.contextMenu.appendContextMenuItem("show", SHOW_ELEMENT + " " + u.instance + "." + u.elementID);
        //END DEBUG
    }
}

function doCommand(event) {
    switch(event.command) {
        case "gotosite":
            var newTab = safari.application.activeBrowserWindow.openTab("foreground");
            newTab.url = event.userInfo.siteInfo.url;
            break;
        case "locwhitelist":
            handleWhitelisting(true, event.userInfo.location);
            break;
        case "srcwhitelist":
            handleWhitelisting(false, event.userInfo.src);
            break;
        case "loadall":
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadAll", "");
            break;
        case "loadinvisible":
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadInvisible", "");
            break;
        default:
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadContent", {"instance": event.userInfo.instance, "elementID": event.userInfo.elementID, "command": event.command});
            break;
    }
}

function handleWhitelisting(type, url) {
    var newWLstring = prompt(type ? ADD_TO_LOC_WHITELIST_DIALOG : ADD_TO_SRC_WHITELIST_DIALOG, url);
    if(newWLstring) {
        safari.extension.settings["use" + (type ? "loc" : "src") + "Whitelist"] = true;
        if(type && safari.extension.settings["locwhitelist"] == "www.example.com www.example2.com") { // get rid of the example
            safari.extension.settings["locwhitelist"] = newWLstring;
        } else {
            var space = safari.extension.settings[(type ? "loc" : "src") + "whitelist"] ? " " : "";
            safari.extension.settings[(type ? "loc" : "src") + "whitelist"] += space + newWLstring;
        }
        // load targeted content at once
        dispatchMessageToAllPages(type ? "locwhitelist" : "srcwhitelist", newWLstring);
    }
}

// KILLERS
const killers = [new YouTubeKiller(), new VimeoKiller(), new DailymotionKiller(), new VeohKiller(), new GenericKiller(), new SLKiller(), new QTKiller(), new WMKiller(), new DivXKiller()];

function findKillerFor(data) {
    for (var i = 0; i < killers.length; i++) {
        if(killers[i].canKill(data)) return i;
    }
    return null;
}

function killPlugin(data) {
    var killerID = findKillerFor(data);
    if(killerID === null) return;
    
    var callback = function(mediaData) {
        if(safari.extension.settings["H264autoload"]) {
            if(!safari.extension.settings["H264whitelist"]) mediaData.autoload = true;
            else {
                mediaData.autoload = matchList(safari.extension.settings["H264whitelist"].split(/\s+/), data.location);
            }
        }
        mediaData.elementID = data.elementID;
        mediaData.instance = data.instance;
        // the following messsage must be dispatched to all pages to make sure that
        // pages or tabs loading in the background get their mediaData
        dispatchMessageToAllPages("mediaData", mediaData);
    };
    killers[killerID].processElement(data, callback);
}

// EVENT LISTENERS
safari.application.addEventListener("message", respondToMessage, false);
safari.application.addEventListener("contextmenu", handleContextMenu, false);
safari.application.addEventListener("command", doCommand, false);
safari.extension.settings.addEventListener("change", handleChangeOfSettings, false);

