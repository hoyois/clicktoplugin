/****************************
ClickToFlash class definition
*****************************/

function ClickToFlash() {
    
    this.blockedElements = new Array();// array containing the Flash HTML elements
    this.placeholderElements = new Array();// array containing the corresponding placeholder elements
	this.mediaPlayers = new Array();// array containing the HTML5 media players
    
    this.settings = null;
    this.instance = null;
    this.numberOfBlockedElements = 0;
	this.numberOfUnblockedElements = 0;
    
	var _this = this;	
	
	this.respondToMessageTrampoline = function(event) {
        _this.respondToMessage(event);
    };
	
	this.handleBeforeLoadEventTrampoline = function(event) {
		_this.handleBeforeLoadEvent(event);
	};
	
	safari.self.addEventListener("message", this.respondToMessageTrampoline, false);
	document.addEventListener("beforeload", this.handleBeforeLoadEventTrampoline, true);
    /* NOTE ALPHA (READ IF YOU WANT TO PLAY WITH THE CODE!)
    It sometimes happen, though the reason is still mysterious to me, that several 'beforeload' events
    are fired with the SAME target. It's just a fact of life (or a webkit bug?) we have to live with.
    Thus, if you modify manually properties of the HTML Element event.target
    while handling the beforeload event, YOU CANNOT ASSUME THAT THESE PROPERTIES ARE CONSTANT.
    Eg, suppose you do
    
    element1 = event.target; 
    element1.elementID = 1;
    
    and later for a second event
    
    element2 = event.target; 
    element2.elementID = 2;
    
    If the two events have the same target, then element1.elementID will be changed to 2,
    which can yield undesirable results if element1 is still being processed.
    
    ALSO, this is the reason for the error 'element.parentNode is null' towards the end of this document:
    element2 loses its parentNode when element1.parentNode.replaceChild(..., element1) is executed.
    
    Of course, when such a redundant event happens, we should ignore it altogether. As of now,
    redundant events are never passed to killers. Further optimization will be possible once a Webkit
    bug is fixed (already is in the nightlies).
    */
    document.oncontextmenu = function(event) {
        safari.self.tab.setContextMenuEventUserInfo(event, {"location": window.location.href, "blocked": _this.numberOfBlockedElements - _this.numberOfUnblockedElements});
    };
}

ClickToFlash.prototype.clearAll = function(elementID) {
    this.blockedElements[elementID] = null;
    this.placeholderElements[elementID] = null;
    this.mediaPlayers[elementID] = null;
};

ClickToFlash.prototype.respondToMessage = function(event) {
    if (event.name == "mediaData") {
        if(event.message.CTFInstance != this.instance) return; // ignore message from other CTF instances
        this.prepMedia(event.message);
    } else if (event.name == "loadContent") {
        var loadData = event.message.split(","); // [0] CTFInstance, [1] elementID, [2] message
        if (loadData[0] != this.instance) return; // ignore message from other CTF instances
        if (loadData[2] == "flash") {
            this.loadFlashForElement(loadData[1]);
        } else if (loadData[2] == "video") {
            this.loadMediaForElement(loadData[1]);
        } else if (loadData[2] == "reloadFlash") {
            this.loadInPlugin(loadData[1]);
        } else if (loadData[2] == "remove") {
            this.removeElement(loadData[1]);
        } else if (loadData[2] == "download") {
            var track = this.mediaPlayers[loadData[1]].currentTrack;
			if(track == null) track = 0; // download from placeholder
            safari.self.tab.dispatchMessage("downloadMedia", this.mediaPlayers[loadData[1]].playlist[track].mediaURL);
        } else if (loadData[2] == "show") {
            alert(document.HTMLToString(this.blockedElements[loadData[1]]));
        }
    } else if (event.name == "updateVolume") {
        this.setVolumeTo(event.message);
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

ClickToFlash.prototype.handleBeforeLoadEvent = function(event) {
	const element = event.target;
    
    // deal with sIFR script first
    if(element instanceof HTMLScriptElement && element.getAttribute("src").indexOf("sifr.js") != (-1)) {
        var sIFRData = safari.self.tab.canLoad(event, "sIFR");
        if(!sIFRData.canLoad) {
            // BEGIN DEBUG
            if(sIFRData.debug) {
                if(!confirm("ClickToFlash has detected an sIFR script and is about to block it:\n\n" + document.HTMLToString(element))) return;
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
    
    element.source = getSrcOf(element);
    element.MIMEType = getTypeOf(element);
    if(allowElement(element.MIMEType, element.source)) return;
    
    // At this point we know we're dealing with Evil itself
    
    // Load the user settings
    if(this.settings == null) {
        this.settings = safari.self.tab.canLoad(event, "getSettings");
    }
    
    // Deal with sIFR Flash
    if (element.className == "sIFR-flash" || element.getAttribute("sifr")) {
        if (this.settings["sifrReplacement"] == "autoload") {
            // BEGIN DEBUG
            if(this.settings["debug"]) {
                alert("sIFR text replacement loaded:\n\n" + document.HTMLToString(element));
            }
            // END DEBUG
            element.allowedToLoad = true;
            return;
        }
    }
    
    // Deal with invisible Flash
    if(this.settings["loadInvisible"]) {
        if(element.offsetWidth > 0 && element.offsetHeight > 0) { // there are no 0x0 Flash objects (?)
            if(element.offsetWidth <= this.settings["maxinvdim"] && element.offsetHeight <= this.settings["maxinvdim"]) {
                // BEGIN DEBUG
                if(this.settings["debug"]) {
                    alert("Invisible Flash element of size " + element.offsetWidth + "x" + element.offsetHeight + " loaded:\n\n" + document.HTMLToString(element));
                }
                // END DEBUG
                element.allowedToLoad = true;
                return;
            }
        }
    }
    
    // Deal with whitelisted content
    if(this.settings["locwhitelist"]) {
        if(matchList(this.settings["locwhitelist"], window.location.href)) {
            element.allowedToLoad = true;
            return;
        }
    }
    if(this.settings["locblacklist"]) {
        if(!matchList(this.settings["locblacklist"], window.location.href)) {
            element.allowedToLoad = true;
            return;
        }
    }
    if(this.settings["srcwhitelist"]) {
        if(matchList(this.settings["srcwhitelist"], element.source)) {
            element.allowedToLoad = true;
            return;
        }
    }
    if(this.settings["srcblacklist"]) {
        if(!matchList(this.settings["srcblacklist"], element.source)) {
            element.allowedToLoad = true;
            return;
        }
    }
    
    // At this point we know we have to block 'element' from loading
    
    var elementID = this.numberOfBlockedElements++; // DO NOT STORE THIS AS A PROPERTY OF element!! see NOTE ALPHA above
    
    // Give an address to this CTF instance to receive messages
    if(this.instance == null) {
        this.instance = safari.self.tab.canLoad(event, "getInstance");
    }

    // BEGIN DEBUG
    if(this.settings["debug"]) {
        if(!confirm("ClickToFlash detected Flash element " + this.instance + "." + elementID + ":\n\n" + document.HTMLToString(element))) return;
    } 
    // END DEBUG
    
    event.preventDefault(); // prevents 'element' from loading
    this.processBlockedElement(element, elementID);
};

ClickToFlash.prototype.prepMedia = function(mediaData) {
    if(!mediaData.playlist[0].mediaURL) return;
	if(!this.mediaPlayers[mediaData.elementID]) {
		this.mediaPlayers[mediaData.elementID] = new mediaPlayer(mediaData.isAudio ? "audio" : "video", this.settings["usePlaylists"] && !mediaData.noPlaylistControls);
	}
	if(mediaData.loadAfter) { // just adding stuff to the playlist
		// BEGIN DEBUG
	    if(this.settings["debug"]) {
	        if(!confirm("Preparing to add " + mediaData.playlist.length + " tracks to the playlist for element " + this.instance +"."+ mediaData.elementID)) return;
	    }
	    // END DEBUG
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
	// frankly, this can't happen since the loadAfter uses AJAX
	this.mediaPlayers[mediaData.elementID].addToPlaylist(mediaData.playlist, true);
	this.mediaPlayers[mediaData.elementID].playlistLength = mediaData.playlistLength ? mediaData.playlistLength : mediaData.playlist.length;
	this.mediaPlayers[mediaData.elementID].startTrack = mediaData.startTrack ? mediaData.startTrack : 0;

    // Check if we should load video at once
    if(this.settings["H264autoload"]) {
        this.loadMediaForElement(mediaData.elementID);
        return;
    }
    var badgeLabel = mediaData.badgeLabel;
    if(!badgeLabel) badgeLabel = "Video";
				
    this.displayBadge(badgeLabel, mediaData.elementID);
};

ClickToFlash.prototype.loadFlashForElement = function(elementID) {
    var placeholderElement = this.placeholderElements[elementID];
	var element = this.blockedElements[elementID];
	element.allowedToLoad = true;
    if(placeholderElement.parentNode) {
        placeholderElement.parentNode.replaceChild(element, placeholderElement);
		this.numberOfUnblockedElements++;
        this.clearAll(elementID); // no turning back from loading Flash...
    }
};

ClickToFlash.prototype.loadAll = function() {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i]) {
            this.loadFlashForElement(i);
        }
    }
	this.numberOfUnblockedElements = this.numberOfBlockedElements;
};

ClickToFlash.prototype.loadInPlugin = function(elementID) {
    var containerElement = this.mediaPlayers[elementID].containerElement;
	var element = this.blockedElements[elementID];
	element.allowedToLoad = true;
	containerElement.parentNode.replaceChild(element, containerElement);
	this.numberOfUnblockedElements++;
    this.clearAll(elementID);
};

ClickToFlash.prototype.loadMediaForElement = function(elementID) {
    var placeholderElement = this.placeholderElements[elementID];
    
    var contextInfo = {
        "CTFInstance": this.instance,
        "elementID": elementID,
        "isH264": true,
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

ClickToFlash.prototype.setVolumeTo = function(volume) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.mediaPlayers[i] && this.mediaPlayers[i].mediaElement) this.mediaPlayers[i].mediaElement.volume = volume;
    }
};

ClickToFlash.prototype.removeElement = function(elementID) {
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
ClickToFlash.prototype.displayBadge = function(badgeLabel, elementID) {
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
ClickToFlash.prototype.unhideLogo = function(elementID) {
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

ClickToFlash.prototype.clickPlaceholder = function(elementID) {
	if (this.mediaPlayers[elementID] && this.mediaPlayers[elementID].startTrack != null) {
		this.loadMediaForElement(elementID);
	} else {
        this.loadFlashForElement(elementID);
	}
};

ClickToFlash.prototype.processBlockedElement = function(element, elementID) {
    
    // Creating the placeholder element
	var placeholderElement = document.createElement("div");
	placeholderElement.style.width = element.offsetWidth + "px";
	placeholderElement.style.height = element.offsetHeight + "px";
    
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
            "CTFInstance": _this.instance,
            "elementID": elementID,
            "src": element.source 
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
    this.displayBadge("Flash", elementID);
    // Look for video replacements
    if(this.settings["useH264"]) {
        if(!this.directKill(elementID)) {
            var elementData = {
                "src": element.source,
                "params": getParamsOf(element),
                "elementID": elementID,
                "CTFInstance": this.instance,
				"location": window.location.href
            };
            safari.self.tab.dispatchMessage("killFlash", elementData);
        }
    }
    
};

// Sometimes a flash <object> tag is just a wrapper for an HTML5 video element
ClickToFlash.prototype.directKill = function(elementID) {
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

new ClickToFlash();
