/*
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
NOTE TO SELF
ALWAYS ALWAYS ALWAYS ALWAYS USE the 'var' keyword in 'for' loops!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
*/


/****************************
ClickToPlugin class definition
*****************************/

function ClickToPlugin() {
    
    this.blockedElements = new Array();// array containing the Flash HTML elements
    this.placeholderElements = new Array();// array containing the corresponding placeholder elements
	this.mediaPlayers = new Array();// array containing the HTML5 media players
    
    this.settings = null;
    this.instance = null;
    this.numberOfBlockedElements = 0;
	this.numberOfUnblockedElements = 0;
    this.location = window.location.href;
    
	var _this = this;
	
	this.respondToMessageTrampoline = function(event) {
        _this.respondToMessage(event);
    };
	
	this.handleEventTrampoline = function(event) {
		_this.handleEvent(event);
	};

	safari.self.addEventListener("message", this.respondToMessageTrampoline, false);
	document.addEventListener("beforeload", this.handleEventTrampoline, true);
    document.addEventListener("DOMContentLoaded", this.handleEventTrampoline, false);
	document.addEventListener("DOMNodeInserted", this.handleEventTrampoline, false);
    //document.addEventListener("DOMNodeInsertedIntoDocument", this.handleEventTrampoline, false);
    
    document.oncontextmenu = function(event) {
        safari.self.tab.setContextMenuEventUserInfo(event, {"location": _this.location, "blocked": _this.numberOfBlockedElements - _this.numberOfUnblockedElements});
    };
}

ClickToPlugin.prototype.clearAll = function(elementID) {
    this.blockedElements[elementID] = null;
    this.placeholderElements[elementID] = null;
    this.mediaPlayers[elementID] = null;
};

ClickToPlugin.prototype.respondToMessage = function(event) {
    if (event.name == "mediaData") {
        if(event.message.CTPInstance != this.instance) return; // ignore message from other CTP instances
        this.prepMedia(event.message);
    } else if (event.name == "loadContent") {
        var loadData = event.message.split(","); // [0] CTPInstance, [1] elementID, [2] message
        if (loadData[0] != this.instance) return; // ignore message from other CTP instances
        if (loadData[2] == "plugin") {
            this.loadPluginForElement(loadData[1]);
        } else if (loadData[2] == "video") {
            this.loadMediaForElement(loadData[1]);
        } else if (loadData[2] == "reloadPlugin") {
            this.loadInPlugin(loadData[1]);
        } else if (loadData[2] == "remove") {
            this.removeElement(loadData[1]);
        } else if (loadData[2] == "qtp") {
	    	this.launchInQuickTimePlayer(loadData[1]);
		} else if (loadData[2] == "show") {
            alert(document.HTMLToString(this.blockedElements[loadData[1]]));
        }
    } else if (event.name == "updateVolume") {
        this.setVolumeTo(event.message);
    } else if (event.name == "updateOpacity") {
		this.setOpacityTo(event.message);
	} else if(event.name == "loadAll") {
        this.loadAll();
    }
};

/* NOTE on embedded content and plugins
According to the W3C HTML5 spec, to activate a plugin,
-> an 'embed' element must have either the 'src' or the 'type' attribute with nonempty value
-> an 'object' element must have either the 'data' or the 'type' attribute with nonempty value.
In the real world, however, (AS IS RECOMMANDED ON ADOBE'S WEBSITE, BY THE WAY!)
one often finds an 'object' with neither 'data' nor 'type', with an 'embed' element
as child with 'src' and/or 'type' attribute set.
*/

ClickToPlugin.prototype.handleEvent = function(event) {
    switch(event.type) {
        case "beforeload":
            this.handleBeforeLoadEvent(event);
            break;
        default:
            this.handleDOMContentEvent(event);
    }
    
};

// event.type is DOMContentLoaded or DOMNodeInserted (-> block <applet> tags)
ClickToPlugin.prototype.handleDOMContentEvent = function(event) {
    if(event.target.nodeType != 1 && event.target.nodeType != 9) return; // the node is not an HTML Element nor the document
    const applets = event.target.getElementsByTagName("applet");
    // Convert NodeList to Array
    var appletElements = new Array();
    for(var i = 0; i < applets.length; i++) {
        appletElements.push(applets[i]);
    }
    
    for(var i = 0; i < appletElements.length; i++) {
        if(appletElements[i].allowedToLoad) continue;
        appletElements[i].tag = "applet";
        appletElements[i].source = getSrcOf(appletElements[i]);

        var pluginName = safari.self.tab.canLoad(event, {"src": appletElements[i].source, "type": "application/x-java-applet", "classid": "", "params": "", "location": this.location, "width": appletElements[i].offsetWidth, "height": appletElements[i].offsetHeight, "otherInfo": null});
        if(!pluginName) continue; // whitelisted
        
        appletElements[i].plugin = pluginName;
        
        if(this.settings == null) {
            this.settings = safari.self.tab.canLoad(event, "getSettings");
        }
        if(this.instance == null) {
            this.instance = safari.self.tab.canLoad(event, "getInstance");
        }
        var elementID = this.numberOfBlockedElements++;
        this.processBlockedElement(appletElements[i], elementID); // this removes appletElements[0] from the document
    }
};

ClickToPlugin.prototype.handleBeforeLoadEvent = function(event) {
	const element = event.target;
        
    // deal with sIFR script first
    if(element instanceof HTMLScriptElement && element.getAttribute("src").indexOf("sifr.js") != (-1)) {
        var sIFRData = safari.self.tab.canLoad(event, "sIFR");
        if(!sIFRData.canLoad) {
            // BEGIN DEBUG
            if(sIFRData.debug) {
                if(!confirm("ClickToPlugin has detected an sIFR script and is about to block it:\n\n" + document.HTMLToString(element))) return;
            }
            // END DEBUG
            event.preventDefault(); // prevents loading of sifr.js
            return;
        }
    }
    
    // the following happens when the Flash element is reloaded
    // (for instance after the user clicks on its placeholder):
    // the beforeload event is fired again but this time the
    // flash element must not be blocked
    if (element.allowedToLoad) return;
	if (element instanceof HTMLEmbedElement) {
        element.tag = "embed";
    } else if (element instanceof HTMLObjectElement) {
        element.tag = "object";
    } else {
        return;
    }
    
    // Load the user settings
    if(this.settings == null) {
        this.settings = safari.self.tab.canLoad(event, "getSettings");
    }
    
    // Give an address to this CTP instance to receive messages
    if(this.instance == null) {
        this.instance = safari.self.tab.canLoad(event, "getInstance");
    }
    
    element.otherInfo = new Object();
    element.source = getSrcOf(element);
	
    var pluginName = safari.self.tab.canLoad(event, {"src": element.source, "type": getTypeOf(element), "classid": element.getAttribute("classid"), "params": this.settings["useH264"] ? getParamsOf(element) : "", "location": this.location, "width": element.offsetWidth, "height": element.offsetHeight, "otherInfo": element.otherInfo});
    if(!pluginName) return; // whitelisted
    //alert(pluginName);
    
    

	// if useh264...
    
    // Deal with sIFR Flash
    if (element.className == "sIFR-flash" || element.getAttribute("sifr")) {
        if (this.settings["sifrReplacement"] == "autoload") {
            // BEGIN DEBUG
            if(this.settings["debug"]) {
                alert("sIFR text replacement loaded:\n\n" + document.HTMLToString(element));
            }
            // END DEBUG
            return;
        }
    }
    
    // At this point we know we have to block 'element' from loading
    element.plugin = pluginName;
	var elementID = this.numberOfBlockedElements++;
    
    // BEGIN DEBUG
    if(this.settings["debug"]) {
        if(!confirm(window.location.href + "\n" + window.top.location.href + "\nClickToPlugin is about to block embedded content " + this.instance + "." + elementID + ":\n\n" + document.HTMLToString(element))) return;
        //alert(element.source + "\n -- \n" + event.url);
    }
    // END DEBUG
    
    event.preventDefault(); // prevents 'element' from loading
    this.processBlockedElement(element, elementID);
};

ClickToPlugin.prototype.prepMedia = function(mediaData) {
    if(mediaData.playlist.length == 0 || !mediaData.playlist[0].mediaURL) return;
	if(!this.mediaPlayers[mediaData.elementID]) {
		this.mediaPlayers[mediaData.elementID] = new mediaPlayer(mediaData.isAudio ? "audio" : "video");
	}
	if(mediaData.loadAfter) { // just adding stuff to the playlist
		// BEGIN DEBUG
	    if(this.settings["debug"]) {
	        if(!confirm("Preparing to add " + mediaData.playlist.length + " tracks to the playlist for element " + this.instance +"."+ mediaData.elementID)) return;
	    }
	    // END DEBUG
		this.mediaPlayers[mediaData.elementID].playlistLength -= mediaData.missed;
		this.mediaPlayers[mediaData.elementID].addToPlaylist(mediaData.playlist);
		return;
	}
	// BEGIN DEBUG
	if(this.settings["debug"]) {
        var showPlaylist = "(" + mediaData.playlist.length + " track" + (mediaData.playlist.length > 1 ? "s" : "") + ")";
        for (var i = 0; i < mediaData.playlist.length; i++) {
            showPlaylist += "\n[" + (i + 1) + "] (" + mediaData.playlist[i].mediaType + ")" + (mediaData.playlist[i].mediaType == "video" ? ("\nposterURL: " + mediaData.playlist[i].posterURL) : "") + "\nmediaURL: " + mediaData.playlist[i].mediaURL + "\n";
        }
        if(!confirm("Preparing media for element " + this.instance +"."+ mediaData.elementID +
        ":\n\nbadgeLabel: " + mediaData.badgeLabel + "\n\nPLAYLIST " + showPlaylist)) return;
    }
    // END DEBUG

	// do it backward just in case a loadAfter came first
	// can happen for embedded playlists
	
	this.mediaPlayers[mediaData.elementID].addToPlaylist(mediaData.playlist, true);
	this.mediaPlayers[mediaData.elementID].playlistLength = mediaData.playlistLength ? mediaData.playlistLength : mediaData.playlist.length;
	this.mediaPlayers[mediaData.elementID].startTrack = mediaData.startTrack ? mediaData.startTrack : 0;
	
	this.mediaPlayers[mediaData.elementID].usePlaylistControls = this.settings["usePlaylists"] && !mediaData.noPlaylistControls && this.mediaPlayers[mediaData.elementID].playlistLength > 1;

    // Check if we should load video at once
    if(this.settings["H264autoload"]) {
        this.loadMediaForElement(mediaData.elementID);
        return;
    }
    var badgeLabel = mediaData.badgeLabel;
    if(!badgeLabel) badgeLabel = "Video";
	
    this.displayBadge(badgeLabel, mediaData.elementID);
};

ClickToPlugin.prototype.loadPluginForElement = function(elementID) {
    var placeholderElement = this.placeholderElements[elementID];
	var element = this.blockedElements[elementID];
	element.allowedToLoad = true;
    if(placeholderElement.parentNode) {
        placeholderElement.parentNode.replaceChild(element, placeholderElement);
		this.numberOfUnblockedElements++;
        this.clearAll(elementID);
    }
};


ClickToPlugin.prototype.loadAll = function() {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i]) {
            this.loadPluginForElement(i);
        }
    }
	this.numberOfUnblockedElements = this.numberOfBlockedElements;
};

ClickToPlugin.prototype.loadInPlugin = function(elementID) {
    var containerElement = this.mediaPlayers[elementID].containerElement;
	var element = this.blockedElements[elementID];
	element.allowedToLoad = true;
	containerElement.parentNode.replaceChild(element, containerElement);
    this.clearAll(elementID);
};

ClickToPlugin.prototype.loadMediaForElement = function(elementID) {
    var placeholderElement = this.placeholderElements[elementID];
    
    var contextInfo = {
        "CTPInstance": this.instance,
        "elementID": elementID,
        "isH264": true,
        "plugin": this.blockedElements[elementID].plugin
		//"blocked": this.numberOfBlockedElements - this.numberOfUnblockedElements
    };

	// Initialize player
	var w = parseInt(placeholderElement.style.width.replace("px",""));
	var h = parseInt(placeholderElement.style.height.replace("px",""));
	this.mediaPlayers[elementID].initialize(this.settings["H264behavior"], w, h, this.settings["volume"], contextInfo);
    //mediaElement.allowedToLoad = true; // not used for now

	// Load first track
	this.mediaPlayers[elementID].loadTrack(0);

	// Replace placeholder
	placeholderElement.parentNode.replaceChild(this.mediaPlayers[elementID].containerElement, placeholderElement);
	this.numberOfUnblockedElements++;
    this.placeholderElements[elementID] = null;
    
};

ClickToPlugin.prototype.launchInQuickTimePlayer = function(elementID) {
	var track = this.mediaPlayers[elementID].currentTrack;
	var element = null;
	if(track == null) {
		track = 0;
		element = this.placeholderElements[elementID];
	} else {
		element = this.mediaPlayers[elementID].containerElement;
	}
    var mediaURL = this.mediaPlayers[elementID].playlist[track].mediaURL;
	var QTObject = document.createElement("embed");
	QTObject.allowedToLoad = true;
	QTObject.className = "CTFQTObject";
	QTObject.setAttribute("type", "video/quicktime");
	QTObject.setAttribute("width", "0");
	QTObject.setAttribute("height", "0");
	// need an external URL for source, since QT plugin doesn't accept safari-extension:// protocol
	// Apple has a small 1px image for this exact purpose
	QTObject.setAttribute("src", "http://images.apple.com/apple-events/includes/qtbutton.mov");
	QTObject.setAttribute("href", mediaURL);
	QTObject.setAttribute("target", "quicktimeplayer");
	QTObject.setAttribute("autohref", "true");
	QTObject.setAttribute("controller", "false");
	//QTObject.setAttribute("postdomevents", "true");
	element.appendChild(QTObject);
	// There doesn't seem to exist an appropriate event, so we just wait a bit...
	setTimeout(function() {element.removeChild(QTObject);}, 100);
};

ClickToPlugin.prototype.setVolumeTo = function(volume) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.mediaPlayers[i] && this.mediaPlayers[i].mediaElement) this.mediaPlayers[i].mediaElement.volume = volume;
    }
};

ClickToPlugin.prototype.setOpacityTo = function(opacity) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i]) this.placeholderElements[i].style.opacity = opacity;
    }
};

ClickToPlugin.prototype.removeElement = function(elementID) {
    var element = this.placeholderElements[elementID];
    while(element.parentNode.childNodes.length == 1) {
        element = element.parentNode;
    }
    element.parentNode.removeChild(element);
	this.numberOfUnblockedElements++;
    this.clearAll(elementID);
};

// I really don't like the next two methods, but can't come up with something better
// They are certainly NOT theoretically sound (due to asynchronicity)
// The worst that can happen though is the badge overflowing the placeholder, or staying hidden.
ClickToPlugin.prototype.displayBadge = function(badgeLabel, elementID) {
    if(!badgeLabel) return;
    // remove the logo before changing the label
    this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild.className = "logoContainer nodisplay";
    // Set the new label
    this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild.childNodes[0].innerHTML = badgeLabel;
    this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild.childNodes[1].innerHTML = badgeLabel;
    
    // prepare for logo unhiding
    this.placeholderElements[elementID].className = "clickToFlashPlaceholder notable";
    this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild.className = "logoContainer hidden";
    this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild.childNodes[1].className = "logo tmp";
    
    this.unhideLogo(elementID);
};

// NOTE: this function should never be called directly (use displayBadge instead)
ClickToPlugin.prototype.unhideLogo = function(elementID) {
    var logoContainer = this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild;
    var w0 = this.placeholderElements[elementID].offsetWidth;
    var h0 = this.placeholderElements[elementID].offsetHeight;
    var w1 = logoContainer.childNodes[0].offsetWidth;
    var h1 = logoContainer.childNodes[0].offsetHeight; 
    var w2 = logoContainer.childNodes[1].offsetWidth;
    var h2 = logoContainer.childNodes[1].offsetHeight;
    
    if(w2 == 0 || h2 == 0 || w1 == 0 || h1 == 0 || w0 == 0 || h0 == 0) {
        // 2 options: leave the logo hidden (no big deal, and rarely happens), 
        // or run unhideLogo again later (this might cause unexpected results due to asynchronicity)
        var _this = this;
        setTimeout(function() {_this.unhideLogo(elementID);}, 100); // there's no hurry here
        return;
    }
    
    if(logoContainer.childNodes[1].className != "logo tmp") return;
    
    if (w1 <= w0 - 6 && h1 <= h0 - 6) {
        logoContainer.childNodes[1].className = "logo inset";
        this.placeholderElements[elementID].className = "clickToFlashPlaceholder";
        logoContainer.className = "logoContainer";
        return;
    } else if (w2 <= w0 - 6 && h2 <= h0 - 6) {
        logoContainer.childNodes[1].className = "logo inset";
        this.placeholderElements[elementID].className = "clickToFlashPlaceholder";
        logoContainer.className = "logoContainer mini";
        return;
    } else {
        logoContainer.childNodes[1].className = "logo inset";
        this.placeholderElements[elementID].className = "clickToFlashPlaceholder";
        logoContainer.className = "logoContainer nodisplay";
        return;
    }
};

ClickToPlugin.prototype.clickPlaceholder = function(elementID) {
	if (this.mediaPlayers[elementID] && this.mediaPlayers[elementID].startTrack != null) {
		this.loadMediaForElement(elementID);
	} else {
        this.loadPluginForElement(elementID);
	}
};

ClickToPlugin.prototype.processBlockedElement = function(element, elementID) {
    
    // Creating the placeholder element
	var placeholderElement = document.createElement("div");
	placeholderElement.style.width = element.offsetWidth + "px";
	placeholderElement.style.height = element.offsetHeight + "px";
	placeholderElement.style.opacity = this.settings["opacity"];
    
	placeholderElement.className = "clickToFlashPlaceholder";
    
    // Replacing element by placeholderElement
    if (element.parentNode) {
        element.parentNode.replaceChild(placeholderElement, element);
    } else {
        // the same element has fired the 'beforeload' event more than once: ignore
        // BEGIN DEBUG
        if(this.settings["debug"]) {
            alert("Ignoring duplicate element " + this.instance + "." + elementID + ".");
        }
        // END DEBUG
		this.numberOfUnblockedElements++;
        return;
    }

	var _this = this;
	placeholderElement.onclick = function(event){_this.clickPlaceholder(elementID);};
	placeholderElement.oncontextmenu = function(event) {
		var contextInfo = {
            "CTPInstance": _this.instance,
            "elementID": elementID,
			"src": element.source,
            "plugin": element.plugin,
			"blocked": _this.numberOfBlockedElements - _this.numberOfUnblockedElements
        };
        if (_this.mediaPlayers[elementID] && _this.mediaPlayers[elementID].startTrack != null) {
			contextInfo.hasH264 = true;
            _this.mediaPlayers[elementID].setContextInfo(event, contextInfo);
        } else {
			contextInfo.hasH264 = false;
			safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
			event.stopPropagation();
        }
	};
    
    // Building the placeholder
	var container = document.createElement("div");
	container.className = "clickToFlashPlaceholderContainer";
	placeholderElement.appendChild(container);
	
	var verticalPositionElement = document.createElement("div");
	verticalPositionElement.className = "logoVerticalPosition";
	container.appendChild(verticalPositionElement);

	var horizontalPositionElement = document.createElement("div");
	horizontalPositionElement.className = "logoHorizontalPosition";
	verticalPositionElement.appendChild(horizontalPositionElement);

	var logoContainer = document.createElement("div");
	logoContainer.className = "logoContainer nodisplay"; // keep the logo hidden at first
	horizontalPositionElement.appendChild(logoContainer);
	
	var logoElement = document.createElement("div");
	logoElement.className = "logo";
	logoContainer.appendChild(logoElement);
	
	var logoInsetElement = document.createElement("div");
	logoInsetElement.className = "logo inset";
	logoContainer.appendChild(logoInsetElement);
    
    // Filling the main arrays
    this.blockedElements[elementID] = element;
    this.placeholderElements[elementID] = placeholderElement;
    // Display the badge
    this.displayBadge(element.plugin, elementID);
    // Look for video replacements
    if(this.settings["useH264"]) {
        if(!this.directKill(elementID)) {
            var elementData = {
                "plugin": element.plugin,
                "src": element.source,
                "presrc": element.presource, // TEMP!!
                "params": getParamsOf(element),
                "elementID": elementID,
                "CTPInstance": this.instance,
                "location": this.location,
                "image": element.image
            };
            safari.self.tab.dispatchMessage("killPlugin", elementData);
        }
    }
    
};

// Sometimes an <object> has a media element as fallback content
ClickToPlugin.prototype.directKill = function(elementID) {
    var mediaElements = this.blockedElements[elementID].getElementsByTagName("video");
    var audioElements = this.blockedElements[elementID].getElementsByTagName("audio");
    var mediaType = null;
    if(mediaElements.length == 0) {
        if(audioElements.length == 0) return false;
        else mediaType = "audio";
    } else mediaType = "video";
    if(mediaType == "audio") mediaElements = audioElements;
    mediaURL = mediaElements[0].getAttribute("src");
    
    if(!mediaURL) { // look for <source> tags
        var sourceElements = mediaElements[0].getElementsByTagName("source");
        for(var i = 0; i < sourceElements.length; i++) {
            if(mediaElements[0].canPlayType(sourceElements[i].getAttribute("type"))) {
                mediaURL = sourceElements[i].getAttribute("src"); 
                break;
            }
        }
    }
    if(!mediaURL) return false;
    
    // BEGIN DEBUG
    if(this.settings["debug"]) {
        if(!confirm("Blocked element " + this.instance + "." + elementID + " is about to be suffer a direct kill.")) return false;
    }
    // END DEBUG
    var mediaData = {
        "elementID": elementID,
        "playlist": [{"mediaType": mediaType, "posterURL": mediaElements[0].getAttribute("poster"), "mediaURL": mediaURL}],
        "badgeLabel": "Video"
    };
    this.prepMedia(mediaData);
    return true;
};

new ClickToPlugin();
