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
    
    Of course, when such a redundant event happens, we should ignore it as soon as early as possible.
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
    switch(event.name) {
        case "mediaData":
            if(event.message.instance != this.instance) return; // ignore message from other CTF instances
            this.prepMedia(event.message);
            break;
        case "loadContent":
            var loadData = event.message.split(","); // [0] CTFInstance, [1] elementID, [2] message
            if (loadData[0] != this.instance) return; // ignore message from other CTF instances
            switch(loadData[2]) {
                case "plugin":
                    this.loadFlashForElement(loadData[1]);
                    break;
                case "remove":
                    this.removeElement(loadData[1]);
                    break;
                case "reload":
                    this.reloadInPlugin(loadData[1]);
                    break;
                case "qtp":
                    this.launchInQuickTimePlayer(loadData[1]);
                    break;
                case "show":
                    alert(document.HTMLToString(this.blockedElements[loadData[1]]));
                    break;
            }
            break;
        case "loadAll":
            this.loadAll();
            break;
        case "updateVolume":
            this.setVolumeTo(event.message);
            break;
        case "updateOpacity":
            this.setOpacityTo(event.message);
            break;
    }
};

/* NOTE on embedded content and plugins
According to the W3C HTML5 spec, to activate a plugin,
-> an 'embed' element must have either the 'src' or the 'type' attribute with nonempty value
-> an 'object' element must have either the 'data' or the 'type' attribute with nonempty value.
In the real world, however, one often finds an 'object' with neither 'data' nor 'type',
with an 'embed' element as child with 'src' and/or 'type' attribute set.
*/

ClickToFlash.prototype.handleBeforeLoadEvent = function(event) {
    const element = event.target;
    
    // deal with sIFR script first
    if(element instanceof HTMLScriptElement && element.src.indexOf("sifr.js") != (-1)) {
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
    
    // Check if it is Flash
    if(!(/.(swf|spl)(\?|$)/.test(event.url))) {
        // Check MIME type (elements with no source still launch the plugin if they have the right type)
        var type = getTypeOf(element);
        if(type != "application/x-shockwave-flash" && type != "application/futuresplash") {
            return;
        }
    }
    
    // At this point we know we're dealing with Evil itself
    
    // Need to store the absolute source of the element
    if(!event.url) element.source = "";
    else {
        var tmpAnchor = document.createElement("a");
        tmpAnchor.href = event.url;
        element.source = tmpAnchor.href;
    }
    
    // Load the user settings
    if(this.settings == null) {
        this.settings = safari.self.tab.canLoad(event, "getSettings");
    }
    
    // Deal with sIFR Flash
    if (element.className == "sIFR-flash" || element.hasAttribute("sifr")) {
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
    var elementID = this.numberOfBlockedElements++;
    
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
        var showPlaylist = "(" + mediaData.playlist.length + " track" + (mediaData.playlist.length > 1 ? "s" : "");
        if(mediaData.playlistLength) showPlaylist += ", expecting " + mediaData.playlistLength;
        showPlaylist += ")";
        for (var i = 0; i < mediaData.playlist.length; i++) {
            showPlaylist += "\n[" + (i + 1) + "] (" + mediaData.playlist[i].mediaType + ")" + "\nposterURL: " + mediaData.playlist[i].posterURL + "\nmediaURL: " + mediaData.playlist[i].mediaURL + "\n";
        }
        if(!confirm("Preparing media for element " + this.instance +"."+ mediaData.elementID +
        ":\n\nbadgeLabel: " + mediaData.badgeLabel + "\n\nPLAYLIST " + showPlaylist)) return;
    }
    // END DEBUG

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

ClickToFlash.prototype.reloadInPlugin = function(elementID) {
    var containerElement = this.mediaPlayers[elementID].containerElement;
    var element = this.blockedElements[elementID];
    element.allowedToLoad = true;
    containerElement.parentNode.replaceChild(element, containerElement);
    this.clearAll(elementID);
};

ClickToFlash.prototype.loadMediaForElement = function(elementID) {
    var placeholderElement = this.placeholderElements[elementID];
    
    var contextInfo = {
        "instance": this.instance,
        "elementID": elementID,
        "isH264": true
        //"blocked": this.numberOfBlockedElements - this.numberOfUnblockedElements
    };

    // Initialize player
    var w = parseInt(placeholderElement.style.width.replace("px",""));
    var h = parseInt(placeholderElement.style.height.replace("px",""));
    this.mediaPlayers[elementID].initialize(this.settings["H264behavior"], w, h, this.settings["volume"], contextInfo);
    // mediaElement.allowedToLoad = true; // not used

    // Replace placeholder and load first track
    placeholderElement.parentNode.replaceChild(this.mediaPlayers[elementID].containerElement, placeholderElement);
    this.mediaPlayers[elementID].loadTrack(0);
    this.numberOfUnblockedElements++;
    this.placeholderElements[elementID] = null;
    
};

ClickToFlash.prototype.launchInQuickTimePlayer = function(elementID) {
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
    // QTObject.setAttribute("postdomevents", "true");
    element.appendChild(QTObject);
    // There doesn't seem to exist an appropriate event, so we just wait a bit...
    setTimeout(function() {element.removeChild(QTObject);}, 100);
};

ClickToFlash.prototype.setVolumeTo = function(volume) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.mediaPlayers[i] && this.mediaPlayers[i].mediaElement) this.mediaPlayers[i].mediaElement.volume = volume;
    }
};

ClickToFlash.prototype.setOpacityTo = function(opacity) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i]) this.placeholderElements[i].style.opacity = opacity;
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
    
    this.unhideLogo(elementID, 0);
};

// NOTE: this function should never be called directly (use displayBadge instead)
ClickToFlash.prototype.unhideLogo = function(elementID, i) {
    var logoContainer = this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild;
    var w0 = this.placeholderElements[elementID].offsetWidth;
    var h0 = this.placeholderElements[elementID].offsetHeight;
    var w1 = logoContainer.childNodes[0].offsetWidth;
    var h1 = logoContainer.childNodes[0].offsetHeight; 
    var w2 = logoContainer.childNodes[1].offsetWidth;
    var h2 = logoContainer.childNodes[1].offsetHeight;
    
    if(w2 == 0 || h2 == 0 || w1 == 0 || h1 == 0 || w0 == 0 || h0 == 0) {
        if(i > 9) return;
        // 2 options: leave the logo hidden (no big deal, and rarely happens), 
        // or run unhideLogo again later <- THIS
        var _this = this;
        setTimeout(function() {_this.unhideLogo(elementID, ++i);}, 100); // there's no hurry here
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
            "instance": _this.instance,
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
                "instance": this.instance,
                "elementID": elementID,
                "src": element.source,
                "params": getParamsOf(element),
                "location": window.location.href
            };
            safari.self.tab.dispatchMessage("killFlash", elementData);
        }
    }
    
};

// Sometimes an <object> has a media element as fallback content
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
        "badgeLabel": mediaType == "audio" ? "Audio" : "Video"
    };
    this.prepMedia(mediaData);
    return true;
};

new ClickToFlash();
