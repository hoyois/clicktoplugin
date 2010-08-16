var CTP_instance = 0; // incremented by one whenever a ClickToPlugin instance with content is created
const killers = [new YouTubeKiller(), new VimeoKiller(), new DailymotionKiller(), new VeohKiller(), new JWKiller(), new SLKiller(), new QTKiller(), new WMKiller(), new DivXKiller()];

function pluginName(plugin) {
    if(plugin.name == "Shockwave Flash") return "Flash";
	if(plugin.name == "Silverlight Plug-In") return "Silverlight";
    if(plugin.name.match("Java")) return "Java";
    if(plugin.name.match("QuickTime")) return "QuickTime";
    if(plugin.name.match("Flip4Mac")) return "WM";
    if(plugin.name == "iPhotoPhotocast") return "iPhoto";
    if(plugin.name == "Quartz Composer Plug-In") return "Quartz";
    if(plugin.name == "VideoLAN VLC Plug-in") return "VLC";
    if(plugin.name == "DivX Web Player") return "DivX";
    if(plugin.name == ("RealPlayer Plugin.plugin")) return "RealPlayer";
    return plugin.name;
    /*switch (plugin.name) {
        case "Flip4Mac Windows Media Web Plugin 2.3.4": return "WM";
        case "Flip4Mac Windows Media Plugin 2.3.4": return "WM";
        case "Silverlight Plug-In": return "Silverlight";
        case "Shockwave Flash": return "Flash";
        case "Switchable Java Plug-in for WebKit": return "Java";
        case "Java Plug-In 2 for NPAPI Browsers": return "Java";
        case "iPhotoPhotocast": return "iPhoto";
        case "QuickTime Plug-in 7.6.6": return "QuickTime";
        case "Quartz Composer Plug-In": return "Quartz";
        default: return plugin.name;
    }*/
}

/*
LIST OF CLASSID (What is this stuff anyway?)
QuickTime: 02BF25D5-8C17-4B23-BC80-D3488ABDDC6B
WMP 6: 22d6f312-b0f6-11d0-94ab-0080c74c7e95
WMP >6: 6BF52A52-394A-11D3-B153-00C04F79FAA6
Flash: d27cdb6e-ae6d-11cf-96b8-444553540000
Real Player: CFCDAA03-8BE4-11cf-B84B-0020AFBBCCFA
?? calendar: 8E27C92B-1264-101C-8A2F-040224009C02
?? graphics: 369303C2-D7AC-11D0-89D5-00A0C90833E6
?? slider: F08DF954-8592-11D1-B16A-00C0F0283628
DivX: 67DABFBF-D0AB-41fa-9C46-CC0F21721616
*/


function getPluginForType(MIMEType) { // MIMEType is a string
    for(var i = 0; i < navigator.plugins.length; i++) {
        for(var j = 0; j < navigator.plugins[i].length; j++) {
            if(navigator.plugins[i][j].type == MIMEType) return navigator.plugins[i];
        }
    }
    return null;
}

function getPluginAndTypeForExt(ext) {
    var suffixes = null;
    for(var i = 0; i < navigator.plugins.length; i++) {
        for(var j = 0; j < navigator.plugins[i].length; j++) {
            suffixes = navigator.plugins[i][j].suffixes.split(",");
            for(var k = 0; k < suffixes.length; k++) {
                if(ext == suffixes[k]) return {"plugin": navigator.plugins[i], "type": navigator.plugins[i][j].type};
            }
        }
    }
    return {"plugin": null, "type": null};
}

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
			locwhitelist = locwhitelist.split(/,(?![^\(]*\))/);
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
    var MIMEType = data.type.replace(/\s+/g,"");
    var badgeLabel = "?";
    if(MIMEType) {
        badgeLabel = MIMEType.split(";")[0].split("/")[1]; // temporary unless no plugin can be found to play MIMEType
        plugin = getPluginForType(MIMEType);
    }
    if(!plugin && data.src) {
        var x = getPluginAndTypeForExt(ext);
        plugin = x.plugin;
        MIMEType = x.type;
    }
    if(plugin) badgeLabel = pluginName(plugin);

	if(safari.extension.settings["allowQT"] && badgeLabel == "QuickTime") return null;
    
    if(MIMEType) {
        if(safari.extension.settings["block"] == "useRedlist") {
            var redlist = safari.extension.settings["redlist"].replace(/\s+/g,"");
            if(!redlist) return null;
            redlist = redlist.split(/,(?![^\(]*\))/); // matches all , except those in parentheses (used in regexp)
            if(!matchList(redlist, MIMEType, true)) return null;
        } else if(safari.extension.settings["block"] == "useGreenlist") {
            var greenlist = safari.extension.settings["greenlist"].replace(/\s+/g,"");
            if(greenlist) {
                greenlist = greenlist.split(/,(?![^\(]*\))/);
                if(matchList(greenlist, MIMEType, true)) return null;
            }
        }
    }
    // At this point we know we'll have to block the element
    
    for(var key in data.otherInfo) {
        if(key == "target" && data.otherInfo.target == "quicktimeplayer") {
            // A quicktime object that would launch QTP
            if(confirm("A QuickTime object would like to play\n\n" + data.src + "\n\nin QuickTime Player. Do you want to allow it?")) {
                return null;
            }
        }
    }
    return badgeLabel;
    
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
        case "downloadMedia":
            //var newTab = safari.application.activeBrowserWindow.openTab("foreground");
            //newTab.url = event.message;
            prompt("Copy the following URL and paste it into the Downloads window.", event.message);
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

function printMedia(mediaType) {
    switch(mediaType) {
        case "video": return "Video";
        case "audio": return "Audio";
        default: return "Video";
    }
}

function handleContextMenu(event) {
    if(!event.userInfo.CTPInstance) {
        if(event.userInfo.blocked > 0) event.contextMenu.appendContextMenuItem("loadall", "Load All Plugins (" + event.userInfo.blocked + ")");
        if(safari.extension.settings["useWLcontext"]) {
            event.contextMenu.appendContextMenuItem("locwhitelist", "Add Location to Whitelist\u2026");
        }
        return;
    }
    // NOTE: just uncomment the 2 lines below to activate the 'open video in new tab' functionality
    // (didn't seem worth taking a place in the context menu)
    if(event.userInfo.isH264) {
        // if(event.userInfo.isPlaylist) {
        //             event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",next", "Next Track");
        //             event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",prev", "Previous Track");
        //         }
        event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",download", "Download " + printMedia(event.userInfo.mediaType) + "\u2026");
		if(event.userInfo.siteInfo) event.contextMenu.appendContextMenuItem("gotosite", "View on " + event.userInfo.siteInfo.name);
        event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",reloadPlugin", "Reload in " + event.userInfo.plugin);
    } else {
        if(event.userInfo.hasH264) {
            event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",plugin", "Load " + event.userInfo.plugin);
            event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",video", "Load " + printMedia(event.userInfo.mediaType));
            event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",download", "Download " + printMedia(event.userInfo.mediaType) + "\u2026");
			if(event.userInfo.siteInfo) event.contextMenu.appendContextMenuItem("gotosite", "View on " + event.userInfo.siteInfo.name);
        } else {
            event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",plugin", "Load Plugin");
        }
        if(safari.extension.settings["useWLcontext"]) {
            event.contextMenu.appendContextMenuItem("srcwhitelist", "Add Source to Whitelist\u2026");
        }
        event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",remove", "Remove Element");
        // BEGIN DEBUG
        if(safari.extension.settings["debug"]) {
            event.contextMenu.appendContextMenuItem(event.userInfo.CTPInstance + "," + event.userInfo.elementID + ",show", "Show Element " + event.userInfo.CTPInstance + "." + event.userInfo.elementID);
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
    var newWLstring = prompt("Allow embedded content " + (type ? "on locations" : "from sources") + " matching:", url);
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
        // send to all pages or just the active one??
        safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("updateVolume", event.newValue);
    }
}

function getSettings() {
	var settings = new Object();
	settings.useH264 = safari.extension.settings["useH264"];
	settings.usePlaylists = safari.extension.settings["usePlaylists"];
	//settings.maxres = safari.extension.settings["maxresolution"];
    settings.H264autoload = safari.extension.settings["H264autoload"];
    settings.H264behavior = safari.extension.settings["H264behavior"];
    settings.volume = safari.extension.settings["volume"];
    settings.sifrReplacement = safari.extension.settings["sifrReplacement"];
    settings.debug = safari.extension.settings["debug"];
	return settings;
}

function killPlugin(data) {
    var killerID = findKillerFor(data);
    if(killerID == null) return;
    // BEGIN DEBUG
    if(safari.extension.settings["debug"]) {
        if(!confirm("Killer '" + killers[killerID].name + "' thinks it might be able to process target " + data.CTPInstance +"."+ data.elementID + ".")) return;
    }
    // END DEBUG
    var callback = function(mediaData) {
        mediaData.elementID = data.elementID;
        mediaData.CTPInstance = data.CTPInstance;
        // the following messsage must be dispatched to all pages to make sure that
        // pages or tabs loading in the background get their videoData
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

