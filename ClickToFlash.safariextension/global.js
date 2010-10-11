var CTF_instance = 0; // incremented by one whenever a ClickToFlash instance with content is created
const killers = [new YouTubeKiller(), new VimeoKiller(), new DailymotionKiller(), new VeohKiller(), new GenericKiller()];

function blockOrAllow(data) { // check the whitelists and returns true if element can be loaded

    // Deal with invisible plugins
    if(safari.extension.settings["loadInvisible"] && data.width > 0 && data.height > 0) {
        var dim = safari.extension.settings["maxinvdim"].split("x");
        if(data.width <= parseInt(dim[0]) && data.height <= parseInt(dim[1])) return true;
    }
    
    // Deal with whitelisted content
    if(safari.extension.settings["uselocWhitelist"]) {
        if(safari.extension.settings["locwhitelist"]) {
            if(matchList(safari.extension.settings["locwhitelist"].split(/\s+/), data.location)) return true;
        }
        if(safari.extension.settings["locblacklist"]) {
            if(!matchList(safari.extension.settings["locblacklist"].split(/\s+/), data.location)) return true;
        }
    }
    if(safari.extension.settings["usesrcWhitelist"]) {
        if(safari.extension.settings["srcwhitelist"]) {
            if(matchList(safari.extension.settings["srcwhitelist"].split(/\s+/), data.src)) return true;
        }
        if(safari.extension.settings["srcblacklist"]) {
            if(!matchList(safari.extension.settings["srcblacklist"].split(/\s+/), data.src)) return true;
        }
    }
    
    return false;
}

// EVENT LISTENERS
safari.application.addEventListener("message", respondToMessage, false);
safari.application.addEventListener("contextmenu", handleContextMenu, false);
safari.application.addEventListener("command", doCommand, false);
safari.extension.settings.addEventListener("change", handleChangeOfSettings, false);

function respondToMessage(event) {
    switch (event.name) {
        case "canLoad":
            event.message = respondToCanLoad(event.message);
            break;
        case "killFlash":
            killFlash(event.message);
            break;
    }
}

function respondToCanLoad(message) {
    // Make checks in correct order for optimal performance
    if(message.src !== undefined) return blockOrAllow(message);
    switch(message) {
        case "getSettings":
            return getSettings();
        case "getInstance":
            return ++CTF_instance;
        case "sIFR":
            if (safari.extension.settings["sifrReplacement"] == "textonly") {
                return {"canLoad": false, "debug": safari.extension.settings["debug"]};
            } else return {"canLoad": true};
    }
}

function handleContextMenu(event) {
    if(!event.userInfo.instance) {
        if(safari.extension.settings["useLAcontext"] && event.userInfo.blocked > 0) event.contextMenu.appendContextMenuItem("loadall", LOAD_ALL_FLASH + " (" + event.userInfo.blocked + ")");
        if(safari.extension.settings["useWLcontext"]) {
            event.contextMenu.appendContextMenuItem("locwhitelist", ADD_TO_LOC_WHITELIST + "\u2026");
        }
        return;
    }
    if(event.userInfo.isVideo) {
        event.contextMenu.appendContextMenuItem("reload", RELOAD_IN_PLUGIN("Flash"));
        if(safari.extension.settings["useDVcontext"]) event.contextMenu.appendContextMenuItem("download", event.userInfo.mediaType == "audio" ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
        if(safari.extension.settings["useQTcontext"]) event.contextMenu.appendContextMenuItem("qtp", VIEW_IN_QUICKTIME_PLAYER);
        if(event.userInfo.siteInfo && safari.extension.settings["useVScontext"]) event.contextMenu.appendContextMenuItem("gotosite", VIEW_ON_SITE(event.userInfo.siteInfo.name));
    } else {
        if(event.userInfo.hasH264) {
            event.contextMenu.appendContextMenuItem("plugin", LOAD_PLUGIN("Flash"));
            event.contextMenu.appendContextMenuItem("remove", REMOVE_PLUGIN("Flash"));
            if(safari.extension.settings["useDVcontext"]) event.contextMenu.appendContextMenuItem("download", event.userInfo.mediaType == "audio" ? DOWNLOAD_AUDIO : DOWNLOAD_VIDEO);
            if(safari.extension.settings["useQTcontext"]) event.contextMenu.appendContextMenuItem("qtp", VIEW_IN_QUICKTIME_PLAYER);
            if(event.userInfo.siteInfo && safari.extension.settings["useVScontext"]) event.contextMenu.appendContextMenuItem("gotosite", VIEW_ON_SITE(event.userInfo.siteInfo.name));
        } else {
            event.contextMenu.appendContextMenuItem("remove", REMOVE_PLUGIN("Flash"));
        }
        if(safari.extension.settings["useWLcontext"]) {
            event.contextMenu.appendContextMenuItem("srcwhitelist", ADD_TO_SRC_WHITELIST + "\u2026");
        }
        // BEGIN DEBUG
        if(safari.extension.settings["debug"]) {
            event.contextMenu.appendContextMenuItem("show", SHOW_ELEMENT + " " + event.userInfo.instance + "." + event.userInfo.elementID);
        }
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
        default:
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadContent", {"instance": event.userInfo.instance, "elementID": event.userInfo.elementID, "command": event.command});
            break;
    }
}

function handleWhitelisting(type, url) {
    var newWLstring = prompt(type ? ADD_TO_LOC_WHITELIST_DIALOG_FLASH : ADD_TO_SRC_WHITELIST_DIALOG_FLASH, url);
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

function handleChangeOfSettings(event) {
    if(event.key == "volume") {
        safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("updateVolume", event.newValue);
    } else if(event.key = "opacity") {
        dispatchMessageToAllPages("updateOpacity", event.newValue);
    }
}

function getSettings() { // return the settings injected scripts need
    var settings = new Object();
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

function findKillerFor(data) {
    for (var i = 0; i < killers.length; i++) {
        if(killers[i].canKill(data)) return i;
    }
    return null;
}

function killFlash(data) {
    var killerID = findKillerFor(data);
    if(killerID === null) return; // this flash element can't be killed :(
    
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

