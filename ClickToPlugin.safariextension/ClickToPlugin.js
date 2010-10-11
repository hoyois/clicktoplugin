/*****************************
ClickToPlugin class definition
*****************************/

function ClickToPlugin() {
    
    this.blockedElements = new Array(); // array containing the blocked HTML elements
    this.placeholderElements = new Array(); // array containing the corresponding placeholder elements
    this.mediaPlayers = new Array(); // array containing the HTML5 media players
    
    /*
    Each item in blockedElements will acquire 3 additional properties:
    -> tag: 'embed', 'object', or 'applet'
    -> plugin: the name of the plugin that would handle the element
    -> info: an object gathering relevent attributes of the element
    */
    
    this.settings = null;
    this.instance = null;
    this.numberOfBlockedElements = 0;
    this.stack = null;
    /*
    The stack is a <div> appended as a child of <body> in which the blocked elements are stored unmodified.
    This allows scripts that need to set custom JS properties to those elements (or otherwise modify them) to work.
    The stack itself has display:none so that plugins are not instantiated.
    Scripts that try to interact with the plugin will still fail, of course. No way around that.
    */
    
    var _this = this;
    
    this.respondToMessageTrampoline = function(event) {
        _this.respondToMessage(event);
    };
    this.handleBeforeLoadEventTrampoline = function(event) {
        _this.handleBeforeLoadEvent(event);
    };
    
    safari.self.addEventListener("message", this.respondToMessageTrampoline, false);
    document.addEventListener("beforeload", this.handleBeforeLoadEventTrampoline, true);
    
    document.oncontextmenu = function(event) {
        safari.self.tab.setContextMenuEventUserInfo(event, {"location": window.location.href, "blocked": this.getElementsByClassName("CTFplaceholder").length});
    };
}

ClickToPlugin.prototype.clearAll = function(elementID) {
    this.blockedElements[elementID] = null;
    this.placeholderElements[elementID] = null;
    this.mediaPlayers[elementID] = null;
};

ClickToPlugin.prototype.respondToMessage = function(event) {
    switch(event.name) {
        case "mediaData":
            if(event.message.instance != this.instance) return; // ignore message from other instances
            this.prepMedia(event.message);
            break;
        case "loadContent":
            if(event.message.instance !== this.instance) return; // ignore message from other instances
            switch(event.message.command) {
                case "plugin":
                    this.loadPluginForElement(event.message.elementID);
                    break;
                case "remove":
                    this.removeElement(event.message.elementID);
                    break;
                case "reload":
                    this.reloadInPlugin(event.message.elementID);
                    break;
                case "download":
                    this.downloadMedia(event.message.elementID);
                    break;
                case "qtp":
                    this.viewInQuickTimePlayer(event.message.elementID);
                    break;
                case "show":
                    this.showElement(event.message.elementID);
                    break;
            }
            break;
        case "loadAll":
            this.loadAll();
            break;
        case "srcwhitelist":
            this.loadSrc(event.message);
            break;
        case "locwhitelist":
            if(window.location.href.indexOf(event.message) != -1) this.loadAll();
            break;
        case "updateVolume":
            this.setVolumeTo(event.message);
            break;
        case "updateOpacity":
            this.setOpacityTo(event.message);
            break;
    }
};

ClickToPlugin.prototype.handleBeforeLoadEvent = function(event) {
    const element = event.target;
    
    // deal with sIFR script first
    if(element instanceof HTMLScriptElement && element.src.indexOf("sifr.js") != -1) {
        var sIFRData = safari.self.tab.canLoad(event, "sIFR");
        if(!sIFRData.canLoad) {
            // BEGIN DEBUG
            if(sIFRData.debug) {
                if(!confirm("ClickToPlugin is about to block an sIFR script:\n\n" + element.src)) return;
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
    
    if (element instanceof HTMLObjectElement) {
        element.tag = "object";
    } else if (element instanceof HTMLEmbedElement) {
        element.tag = "embed";
    } else {
        return;
    }
    
    element.info = getInfo(element, event.url);
    
    element.plugin = safari.self.tab.canLoad(event, {"src": element.info.src, "type": getTypeOf(element), "classid": element.getAttribute("classid"), "location": window.location.href, "width": element.offsetWidth, "height": element.offsetHeight, "launchInQTP": (element.info.autohref && element.info.target == "quicktimeplayer" ? element.info.href : null)});
    if(true === element.plugin) return; // whitelisted
    
    // Load the user settings
    if(this.settings === null) {
        this.settings = safari.self.tab.canLoad(event, "getSettings");
    }
    
    // Deal with sIFR Flash
    if (element.className == "sIFR-flash" || element.hasAttribute("sifr")) {
        if (this.settings["sifrReplacement"] == "autoload") return;
    }
    
    // At this point we know we have to block 'element' from loading
    var elementID = this.numberOfBlockedElements++;
    
    // Give an address to this CTP instance to receive messages
    if(this.instance === null) {
        this.instance = safari.self.tab.canLoad(event, "getInstance");
    }
    
    // BEGIN DEBUG
    if(this.settings["debug"]) {
        var e = element, positionX = 0, positionY = 0;
        do {
            positionX += e.offsetLeft; positionY += e.offsetTop;
        } while(e = e.offsetParent);
        if(!confirm("ClickToPlugin is about to block element " + this.instance + "." + elementID + ":\n" + "\nType: " + element.plugin + "\nLocation: " + window.location.href + "\nSource: " + element.info.src + "\nPosition: (" + positionX + "," + positionY + ")\nSize: " + element.offsetWidth + "x" + element.offsetHeight)) return;
    }
    // END DEBUG
    
    event.preventDefault(); // prevents 'element' from loading
    
    if(event.url || element.id) {
        this.processBlockedElement(element, elementID);
    }
};

ClickToPlugin.prototype.loadPluginForElement = function(elementID) {
    this.blockedElements[elementID].allowedToLoad = true;
    if(this.placeholderElements[elementID].parentNode) {
        this.placeholderElements[elementID].parentNode.replaceChild(this.blockedElements[elementID], this.placeholderElements[elementID]);
        this.clearAll(elementID);
    }
};

ClickToPlugin.prototype.reloadInPlugin = function(elementID) {
    this.blockedElements[elementID].allowedToLoad = true;
    this.mediaPlayers[elementID].containerElement.parentNode.replaceChild(this.blockedElements[elementID], this.mediaPlayers[elementID].containerElement);
    this.clearAll(elementID);
};

ClickToPlugin.prototype.loadAll = function() {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i]) {
            this.loadPluginForElement(i);
        }
    }
};

ClickToPlugin.prototype.loadSrc = function(string) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i] && this.blockedElements[i].info.src.indexOf(string) != -1) {
            this.loadPluginForElement(i);
        }
    }
};

ClickToPlugin.prototype.prepMedia = function(mediaData) {
    if(mediaData.playlist.length == 0 || !mediaData.playlist[0].mediaURL) return;
    if(!this.blockedElements[mediaData.elementID]) return; // User has loaded Flash already
    
    if(!this.mediaPlayers[mediaData.elementID]) {
        this.mediaPlayers[mediaData.elementID] = new mediaPlayer(mediaData.isAudio ? "audio" : "video");
    }
    if(mediaData.loadAfter) { // just adding stuff to the playlist
        this.mediaPlayers[mediaData.elementID].playlistLength -= mediaData.missed;
        this.mediaPlayers[mediaData.elementID].addToPlaylist(mediaData.playlist);
        return;
    }
    
    this.mediaPlayers[mediaData.elementID].addToPlaylist(mediaData.playlist, true);
    this.mediaPlayers[mediaData.elementID].playlistLength = mediaData.playlistLength ? mediaData.playlistLength : mediaData.playlist.length;
    this.mediaPlayers[mediaData.elementID].startTrack = mediaData.startTrack ? mediaData.startTrack : 0;
    
    this.mediaPlayers[mediaData.elementID].usePlaylistControls = this.settings["usePlaylists"] && !mediaData.noPlaylistControls && this.mediaPlayers[mediaData.elementID].playlistLength > 1;

    // Check if we should load video at once
    if(mediaData.autoload) {
        this.loadMediaForElement(mediaData.elementID);
        return;
    } else {
        if(this.settings["showPoster"] && mediaData.playlist[0].posterURL) {
            // show poster as background image
            this.placeholderElements[mediaData.elementID].style.opacity = "1";
            this.placeholderElements[mediaData.elementID].style.backgroundImage = "url('" + mediaData.playlist[0].posterURL + "') !important";
            this.placeholderElements[mediaData.elementID].className = "CTFplaceholder"; // remove 'noimage' class
            this.placeholderElements[mediaData.elementID].removeAttribute("title"); // remove tooltip
        }
    }
    
    var badgeLabel = mediaData.badgeLabel;
    if(!badgeLabel) badgeLabel = "Video";
    
    this.displayBadge(badgeLabel, mediaData.elementID);
};

ClickToPlugin.prototype.loadMediaForElement = function(elementID) {
    var contextInfo = {
        "instance": this.instance,
        "elementID": elementID,
        "plugin": this.blockedElements[elementID].plugin
    };

    // Initialize player
    var w = parseInt(this.placeholderElements[elementID].style.width.replace("px",""));
    var h = parseInt(this.placeholderElements[elementID].style.height.replace("px",""));
    this.mediaPlayers[elementID].initialize(this.settings["H264behavior"], w, h, this.settings["volume"], contextInfo);
    // mediaElement.allowedToLoad = true; // not used

    // Replace placeholder and load first track
    this.placeholderElements[elementID].parentNode.replaceChild(this.mediaPlayers[elementID].containerElement, this.placeholderElements[elementID]);
    this.mediaPlayers[elementID].loadTrack(0);
    this.placeholderElements[elementID] = null;
    
};

ClickToPlugin.prototype.downloadMedia = function(elementID) {
    var track = this.mediaPlayers[elementID].currentTrack;
    if(track === null) track = 0;
    downloadURL(this.mediaPlayers[elementID].playlist[track].mediaURL);
};

ClickToPlugin.prototype.viewInQuickTimePlayer = function(elementID) {
    var track = this.mediaPlayers[elementID].currentTrack;
    var element;
    if(track === null) {
        track = 0;
        element = this.placeholderElements[elementID];
    } else {
        element = this.mediaPlayers[elementID].containerElement;
    }
    var mediaURL = this.mediaPlayers[elementID].playlist[track].mediaURL;
    // Relative URLs need to be resolved for QTP
    var tmpAnchor = document.createElement("a");
    tmpAnchor.href = mediaURL;
    mediaURL = tmpAnchor.href;
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

ClickToPlugin.prototype.setVolumeTo = function(volume) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.mediaPlayers[i] && this.mediaPlayers[i].mediaElement) this.mediaPlayers[i].mediaElement.volume = volume;
    }
};

ClickToPlugin.prototype.setOpacityTo = function(opacity) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i] && this.placeholderElements[i].className == "CTFplaceholder CTFnoimage") this.placeholderElements[i].style.opacity = opacity;
    }
};

ClickToPlugin.prototype.removeElement = function(elementID) {
    var element = this.placeholderElements[elementID];
    while(element.parentNode.childNodes.length == 1) {
        element = element.parentNode;
    }
    element.parentNode.removeChild(element);
    this.clearAll(elementID);
};

ClickToPlugin.prototype.showElement = function(elementID) {
    alert("Location: " + window.location.href + "\nSource: " + this.blockedElements[elementID].info.src + "\n\n" + document.HTMLToString(this.blockedElements[elementID]));
};

// I really don't like the next two methods, but can't come up with something better
// They are certainly NOT theoretically sound (due to asynchronicity)
// The worst that can happen though is the badge overflowing the placeholder, or staying hidden.
// In 2 months of use, I've never seen either happen
ClickToPlugin.prototype.displayBadge = function(badgeLabel, elementID) {
    if(!badgeLabel) return;
    // Hide the logo before changing the label
    this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild.className = "CTFlogoContainer CTFhidden";
    // Set the new label
    this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild.childNodes[0].innerHTML = badgeLabel;
    this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild.childNodes[1].innerHTML = badgeLabel;
    
    // Prepare for logo unhiding
    this.placeholderElements[elementID].firstChild.firstChild.firstChild.firstChild.childNodes[1].className = "CTFlogo CTFtmp";
    
    this.unhideLogo(elementID, 0);
};

// NOTE: this function should never be called directly (use displayBadge instead)
ClickToPlugin.prototype.unhideLogo = function(elementID, i) {
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
    
    if(logoContainer.childNodes[1].className != "CTFlogo CTFtmp") return;
    
    if (w1 <= w0 - 6 && h1 <= h0 - 6) {
        logoContainer.childNodes[1].className = "CTFlogo CTFinset";
        logoContainer.className = "CTFlogoContainer";
        return;
    } else if (w2 <= w0 - 6 && h2 <= h0 - 6) {
        logoContainer.childNodes[1].className = "CTFlogo CTFinset";
        logoContainer.className = "CTFlogoContainer CTFmini";
        return;
    } else {
        logoContainer.childNodes[1].className = "CTFlogo CTFinset";
        logoContainer.className = "CTFlogoContainer CTFnodisplay";
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
    
    // Create the placeholder element
    var placeholderElement = document.createElement("div");
    placeholderElement.title = element.info.src; // tooltip
    placeholderElement.className = "CTFplaceholder CTFnoimage";
    placeholderElement.style.width = element.offsetWidth + "px !important";
    placeholderElement.style.height = element.offsetHeight + "px !important";
    placeholderElement.style.opacity = this.settings["opacity"];
    
    // Copy CSS box & positioning properties that have an effect on page layout
    // Note: 'display' is set to 'inline-block', which is always the effective value for 'replaced elements'
    var style = getComputedStyle(element, null);
    placeholderElement.style.setProperty("position", style.getPropertyValue("position"), "important");
    placeholderElement.style.setProperty("clear", style.getPropertyValue("clear"), "important");
    placeholderElement.style.setProperty("float", style.getPropertyValue("float"), "important");
    placeholderElement.style.setProperty("margin-top", style.getPropertyValue("margin-top"), "important");
    placeholderElement.style.setProperty("margin-right", style.getPropertyValue("margin-right"), "important");
    placeholderElement.style.setProperty("margin-bottom", style.getPropertyValue("margin-bottom"), "important");
    placeholderElement.style.setProperty("margin-left", style.getPropertyValue("margin-left"), "important");
    placeholderElement.style.setProperty("z-index", style.getPropertyValue("z-index"), "important");
    
    // Replace the element by the placeholder
    if(element.parentNode) {
        element.parentNode.replaceChild(placeholderElement, element);
    } else return; // happens if element has fired beforeload twice
    
    // Place the blocked element in the stack
    if(this.stack ===  null) {
        this.stack = document.createElement("div");
        this.stack.id = "CTFstack";
        this.stack.className = "CTFnodisplay";
        this.stack.style.display = "none !important";
        this.stack.innerHTML = "<div class=\"CTFnodisplay\"><div class=\"CTFnodisplay\"></div></div>";
        document.body.appendChild(this.stack);
    }
    try {
        this.stack.firstChild.firstChild.appendChild(element);
    } catch(err) { // some script has modified the stack structure. No big deal, we just reset it
        this.stack.innerHTML = "<div class=\"CTFnodisplay\"><div class=\"CTFnodisplay\"></div></div>";
        this.stack.firstChild.firstChild.appendChild(element);
    }
    
    var _this = this;
    
    placeholderElement.onclick = function(event){_this.clickPlaceholder(elementID); event.stopPropagation();};
    placeholderElement.oncontextmenu = function(event) {
        var contextInfo = {
            "instance": _this.instance,
            "elementID": elementID,
            "src": element.info.src,
            "plugin": element.plugin
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
    
    // Build the placeholder
    placeholderElement.innerHTML = "<div class=\"CTFplaceholderContainer\"><div class=\"CTFlogoVerticalPosition\"><div class=\"CTFlogoHorizontalPosition\"><div class=\"CTFlogoContainer CTFnodisplay\"><div class=\"CTFlogo\"></div><div class=\"CTFlogo CTFinset\"></div></div></div></div></div>";
    
    // Fill the main arrays
    this.blockedElements[elementID] = element;
    this.placeholderElements[elementID] = placeholderElement;
    // Display the badge
    this.displayBadge(element.plugin, elementID);
    // Look for video replacements
    if(this.settings["useH264"]) {
        if(!this.directKill(elementID)) {
            // Need to pass the base URL to the killers so that they can resolve URLs, eg. for AJAX requests.
            // According to RFC1808, the base URL is given by the <base> tag if present,
            // else by the 'Content-Base' HTTP header if present, else by the current URL.
            // Fortunately the magical anchor trick takes care of all this for us!!
            var tmpAnchor = document.createElement("a");
            tmpAnchor.href = "./";
            var elementData = {
                "instance": this.instance,
                "elementID": elementID,
                "plugin": element.plugin,
                "src": element.info.src,
                "location": window.location.href,
                "baseURL": tmpAnchor.href,
                "href": element.info.href,
                "image": element.info.image,
                "params": getParamsOf(element)
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
    
    var mediaData = {
        "elementID": elementID,
        "playlist": [{"mediaType": mediaType, "posterURL": mediaElements[0].getAttribute("poster"), "mediaURL": mediaURL}],
        "badgeLabel": mediaType == "audio" ? "Audio" : "Video"
    };
    this.prepMedia(mediaData);
    return true;
};

new ClickToPlugin();
