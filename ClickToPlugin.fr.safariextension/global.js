var CTP_instance = 0; // incremented by one whenever a ClickToPlugin instance with content is created
const killers = [new YouTubeKiller(), new VimeoKiller(), new DailymotionKiller(), new VeohKiller(), new JWKiller(), new SLKiller(), new QTKiller(), new WMKiller(), new DivXKiller()];

function blockOrAllow(data) { // returns null if element can be loaded, the name of the plugin otherwise
    
    // no source and no type -> must allow, it's probably going to pass through here again after being modified by a script
    if(!data.src && !data.type && !data.classid) return null;

    // native Safari support
    var ext = extractExt(data.src); // used later as well
    if(data.type) {
        if(isNativeType(data.type)) return null;
    } else {
        if(isNativeExt(ext)) return null;
    }
    
    // try not to block objects created by other extensions
    if(data.src.substring(0,19) == "safari-extension://") return null;

    // Deal with invisible plugins
    if(safari.extension.settings["loadInvisible"]) {
        if(data.width <= safari.extension.settings["maxinvdim"] && data.height <= safari.extension.settings["maxinvdim"]) {
            return null;
        }
    }
    
    // Deal with whitelisted content
    if(safari.extension.settings["uselocWhitelist"]) {
        var locwhitelist = safari.extension.settings["locwhitelist"].replace(/\s+/g,"");
        var locblacklist = safari.extension.settings["locblacklist"].replace(/\s+/g,"");
        if(locwhitelist) {
            locwhitelist = locwhitelist.split(/,(?![^\(]*\))/); // matches all , except those in parentheses (used in regexp)
            if(matchList(locwhitelist, data.location)) return null;
        }
        if(locblacklist) {
            locblacklist = locblacklist.split(/,(?![^\(]*\))/);
            if(!matchList(locblacklist, data.location)) return null;
        }
    }
    if(safari.extension.settings["usesrcWhitelist"]) {
        var srcwhitelist = safari.extension.settings["srcwhitelist"].replace(/\s+/g,"");
        var srcblacklist = safari.extension.settings["srcblacklist"].replace(/\s+/g,"");
        if(srcwhitelist) {
            srcwhitelist = srcwhitelist.split(/,(?![^\(]*\))/);
            if(matchList(srcwhitelist, data.src)) return null;
        }
        if(locblacklist) {
            srcblacklist = srcblacklist.split(/,(?![^\(]*\))/);
            if(!matchList(srcblacklist, data.src)) return null;
        }
    }
    
    // We use a 'soft' method to get the MIME type
    // It is not necessarily correct, but always returns a MIME type handled by the correct plugin
    // To get the correct MIME type an AJAX request would be needed, out of the question here!
    var plugin = null;
    var MIMEType = data.type;
    var pluginName = "?";
    if(MIMEType) plugin = getPluginForType(MIMEType);
    if(!plugin && data.src) {
        var x = getPluginAndTypeForExt(ext);
        plugin = x.plugin;
        MIMEType = x.type;
    }
    if(plugin) pluginName = getPluginNameFromPlugin(plugin);
    else if(MIMEType) pluginName = getPluginNameFromType(MIMEType);
    else if(data.classid) pluginName = getPluginNameFromClassid(data.classid.replace("clsid:", ""));

    if(safari.extension.settings["allowQT"] && pluginName == "QuickTime") return null;
    
    // Use greenlist/redlist
    if(MIMEType) {
        if(safari.extension.settings["block"] == "useRedlist") {
            var redlist = safari.extension.settings["redlist"].replace(/\s+/g,"");
            if(!redlist) return null;
            redlist = redlist.split(/,(?![^\(]*\))/);
            if(!matchList(redlist, MIMEType, true)) return null;
        } else if(safari.extension.settings["block"] == "useGreenlist") {
            var greenlist = safari.extension.settings["greenlist"].replace(/\s+/g,"");
            if(greenlist) {
                greenlist = greenlist.split(/,(?![^\(]*\))/);
                if(matchList(greenlist, MIMEType, true)) return null;
            }
        }
    }
    // At this point we know we should block the element
    
    // Exception: ask the user what to do if a QT object would launch QTP
    if(data.launchInQTP) {
        if(confirm("Un objet QuickTime voudrait lancer le lecture de\n\n" + data.launchInQTP + "\n\ndans QuickTime Player. Voulez-vous l'autoriser?")) {
            return null;
        }
    }
    
    return pluginName;
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
        case "killPlugin":
            killPlugin(event.message);
            break;
    }
}

function respondToCanLoad(message) {
    switch(message) {
        case "sIFR":
            if (safari.extension.settings["sifrReplacement"] == "textonly") {
                return {"canLoad": false, "debug": safari.extension.settings["debug"]};
            } else return {"canLoad": true};
        case "getInstance":
            return ++CTP_instance;
        case "getSettings":
            return getSettings();
        default:
            return blockOrAllow(message);
    }
}

function handleContextMenu(event) {
    if(!event.userInfo.instance) {
        if(safari.extension.settings["useLAcontext"] && event.userInfo.blocked > 0) event.contextMenu.appendContextMenuItem("loadall", "Débloquer tous les plugins (" + event.userInfo.blocked + ")");
        if(safari.extension.settings["useWLcontext"]) {
            event.contextMenu.appendContextMenuItem("locwhitelist", "Ajouter à la liste blanche\u2026");
        }
        return;
    }
    var pluginName = /[A-Z]/.test(event.userInfo.plugin) ? event.userInfo.plugin : "Plugin";
    if(event.userInfo.isH264) {
        event.contextMenu.appendContextMenuItem(event.userInfo.instance + "," + event.userInfo.elementID + ",reload", "Relancer avec " + pluginName);
        if(safari.extension.settings["useQTcontext"]) event.contextMenu.appendContextMenuItem(event.userInfo.instance + "," + event.userInfo.elementID + ",qtp", "Ouvrir avec QuickTime Player");
        if(event.userInfo.siteInfo && safari.extension.settings["useVScontext"]) event.contextMenu.appendContextMenuItem("gotosite", "Voir la vidéo sur " + event.userInfo.siteInfo.name);
    } else {
        if(event.userInfo.hasH264) {
            event.contextMenu.appendContextMenuItem(event.userInfo.instance + "," + event.userInfo.elementID + ",plugin", "Lancer " + pluginName);
            event.contextMenu.appendContextMenuItem(event.userInfo.instance + "," + event.userInfo.elementID + ",remove", "Supprimer " + pluginName);
            //if(safari.extension.settings["useLAcontext"] && event.userInfo.blocked > 1) event.contextMenu.appendContextMenuItem("loadall", "Load All Plugins (" + event.userInfo.blocked + ")");
            if(safari.extension.settings["useQTcontext"]) event.contextMenu.appendContextMenuItem(event.userInfo.instance + "," + event.userInfo.elementID + ",qtp", "Ouvrir avec QuickTime Player");
            if(event.userInfo.siteInfo && safari.extension.settings["useVScontext"]) event.contextMenu.appendContextMenuItem("gotosite", "Voir la vidéo sur " + event.userInfo.siteInfo.name);
        } else {
            event.contextMenu.appendContextMenuItem(event.userInfo.instance + "," + event.userInfo.elementID + ",remove", "Supprimer " + pluginName);
            //if(safari.extension.settings["useLAcontext"] && event.userInfo.blocked > 1) event.contextMenu.appendContextMenuItem("loadall", "Load All Plugins (" + event.userInfo.blocked + ")");
        }
        if(safari.extension.settings["useWLcontext"]) {
            event.contextMenu.appendContextMenuItem("srcwhitelist", "Ajouter à la liste blanche\u2026");
        }
        // BEGIN DEBUG
        if(safari.extension.settings["debug"]) {
            event.contextMenu.appendContextMenuItem(event.userInfo.instance + "," + event.userInfo.elementID + ",show", "Voir l'élément " + event.userInfo.instance + "." + event.userInfo.elementID);
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
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("loadContent", event.command);
            break;
    }
}

function handleWhitelisting (type, url) {
    var newWLstring = prompt("Autoriser les plugins " + (type ? "si l'adresse de la page contient" : "provenant de"), url);
    if(newWLstring) {
        safari.extension.settings["use" + (type ? "loc" : "src") + "Whitelist"] = true;
        if(type && safari.extension.settings["locwhitelist"] == "www.example.com, www.example2.com") { // get rid of the example
            safari.extension.settings[(type ? "loc" : "src") + "whitelist"] = newWLstring;
        } else {
            var comma = safari.extension.settings[(type ? "loc" : "src") + "whitelist"].replace(/\s+/,"") ? ", " : "";
            safari.extension.settings[(type ? "loc" : "src") + "whitelist"] += comma + newWLstring;
        }
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
    settings.H264autoload = safari.extension.settings["H264autoload"];
    settings.H264behavior = safari.extension.settings["H264behavior"];
    settings.volume = safari.extension.settings["volume"];
    settings.sifrReplacement = safari.extension.settings["sifrReplacement"];
    settings.opacity = safari.extension.settings["opacity"];
    settings.debug = safari.extension.settings["debug"];
    return settings;
}

function killPlugin(data) {
    var killerID = findKillerFor(data);
    if(killerID == null) return;
    // BEGIN DEBUG
    if(safari.extension.settings["debug"]) {
        if(!confirm("Killer '" + killers[killerID].name + "' thinks it might be able to process target " + data.instance +"."+ data.elementID + ".")) return;
    }
    // END DEBUG
    var callback = function(mediaData) {
        mediaData.elementID = data.elementID;
        mediaData.instance = data.instance;
        // the following messsage must be dispatched to all pages to make sure that
        // pages or tabs loading in the background get their mediaData
        dispatchMessageToAllPages("mediaData", mediaData);
    };
    killers[killerID].processElement(data, callback);
}

function findKillerFor(data) {
    for (i = 0; i < killers.length; i++) {
        if(killers[i].canKill(data)) return i;
    }
    return null;
}

function dispatchMessageToAllPages(name, message) {
    for(var i = 0; i < safari.application.browserWindows.length; i++) {
        for(var j = 0; j < safari.application.browserWindows[i].tabs.length; j++) {
            // must be careful here since tabs such as Bookmarks or Top Sites do not have the .page proxy
            if(safari.application.browserWindows[i].tabs[j].page) {
                safari.application.browserWindows[i].tabs[j].page.dispatchMessage(name, message);
            }
        }
    }
}

