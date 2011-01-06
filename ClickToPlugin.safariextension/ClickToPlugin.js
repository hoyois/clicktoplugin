/*****************************
ClickToPlugin class definition
*****************************/

function ClickToPlugin() {
    
    this.blockedElements = new Array(); // array containing the blocked HTML elements
    this.blockedData = new Array(); // array containing info on the blocked element (plugin, dimension, source, ...)
    this.placeholderElements = new Array(); // array containing the corresponding placeholder elements
    this.mediaPlayers = new Array(); // array containing the HTML5 media players
    
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
    
    document.addEventListener("contextmenu", function(event) {
        safari.self.tab.setContextMenuEventUserInfo(event, {"location": window.location.href, "blocked": this.getElementsByClassName("CTFplaceholder").length, "invisible": this.getElementsByClassName("CTFinvisible").length});
    }, false);
}

ClickToPlugin.prototype.clearAll = function(elementID) {
    this.blockedElements[elementID] = null;
    this.blockedData[elementID] = null;
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
                    this.downloadMedia(event.message.elementID, event.message.source);
                    break;
                case "viewInQTP":
                    this.viewInQuickTimePlayer(event.message.elementID, event.message.source);
                    break;
                case "show":
                    this.showElement(event.message.elementID);
                    break;
            }
            break;
        case "loadAll":
            this.loadAll();
            break;
        case "loadInvisible":
            this.loadInvisible();
            break;
        case "loadSource":
            this.loadSource(event.message);
            break;
        case "loadLocation":
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
    
    if (!(element instanceof HTMLObjectElement || element instanceof HTMLEmbedElement)) return;
    
    var data = getAttributes(element, event.url);
    /* PROBLEM: elements within display:none iframes fire beforeload events, and the following is incorrect
    To solve this we'd need the CSS 2.1 'computed value' of height and width (and modify the arithmetic in mediaPlayer
    to handle px and %), which might be possible using getMatchedCSSRules (returns matching rules in cascading order)
    The 'auto' value will be a problem...
    status: still see no feasible solution to this problem...*/
    data.width = element.offsetWidth;
    data.height = element.offsetHeight;
    data.location = window.location.href;
    data.className = element.className;
    
    var responseData = safari.self.tab.canLoad(event, data);
    if(responseData === true) return; // whitelisted
    
    // Load the user settings
    if(this.settings === null) {
        this.settings = safari.self.tab.canLoad(event, "getSettings");
    }
    
    // Deal with sIFR Flash
    if (element.className === "sIFR-flash" || element.hasAttribute("sifr")) {
        if (this.settings.sIFRAutoload) return;
    }
    
    // At this point we know we have to block 'element' from loading
    var elementID = this.numberOfBlockedElements++;
    
    // Give an address to this CTP instance to receive messages
    if(this.instance === null) {
        this.instance = safari.self.tab.canLoad(event, "getInstance");
    }
    
    // BEGIN DEBUG
    if(this.settings.debug) {
        var e = element, positionX = 0, positionY = 0;
        do {
            positionX += e.offsetLeft; positionY += e.offsetTop;
        } while(e = e.offsetParent);
        if(!confirm("ClickToPlugin is about to block element " + this.instance + "." + elementID + ":\n" + "\nType: " + responseData.plugin + "\nLocation: " + window.location.href + "\nSource: " + data.src + "\nPosition: (" + positionX + "," + positionY + ")\nSize: " + data.width + "x" + data.height)) return;
    }
    // END DEBUG
    
    event.preventDefault(); // prevents 'element' from loading
    
    if(!event.url && !element.id) return;
    data.plugin = responseData.plugin;
    
    // Create the placeholder element
    var placeholderElement = document.createElement("div");
    placeholderElement.title = data.src; // tooltip
    placeholderElement.className = "CTFplaceholder CTFnoimage";
    placeholderElement.style.width = data.width + "px !important";
    placeholderElement.style.height = data.height + "px !important";
    placeholderElement.style.opacity = this.settings.opacity + " !important";
    
    // Copy CSS box & positioning properties that have an effect on page layout
    // Note: 'display' is set to 'inline-block', which is always the effective value for 'replaced elements'
    var style = getComputedStyle(element, null);
    placeholderElement.style.setProperty("position", style.getPropertyValue("position"), "important");
    placeholderElement.style.setProperty("top", style.getPropertyValue("top"), "important");
    placeholderElement.style.setProperty("right", style.getPropertyValue("right"), "important");
    placeholderElement.style.setProperty("bottom", style.getPropertyValue("bottom"), "important");
    placeholderElement.style.setProperty("left", style.getPropertyValue("left"), "important");
    placeholderElement.style.setProperty("z-index", style.getPropertyValue("z-index"), "important");
    placeholderElement.style.setProperty("clear", style.getPropertyValue("clear"), "important");
    placeholderElement.style.setProperty("float", style.getPropertyValue("float"), "important");
    placeholderElement.style.setProperty("margin-top", style.getPropertyValue("margin-top"), "important");
    placeholderElement.style.setProperty("margin-right", style.getPropertyValue("margin-right"), "important");
    placeholderElement.style.setProperty("margin-bottom", style.getPropertyValue("margin-bottom"), "important");
    placeholderElement.style.setProperty("margin-left", style.getPropertyValue("margin-left"), "important");
    
    // Replace the element by the placeholder
    if(element.parentNode && element.parentNode.className !== "CTFnodisplay") {
        element.parentNode.replaceChild(placeholderElement, element);
    } else { // fired beforeload twice (NOTE: as of Safari 5.0.3, this test does not work too early in the handler! HUGE webkit bug here)
        return;
    }
    
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
    
    placeholderElement.addEventListener("click", function(event) {
        _this.clickPlaceholder(elementID, event.altKey || event.button);
        event.stopPropagation();
    }, false);
    placeholderElement.addEventListener("contextmenu", function(event) {
        var contextInfo = {
            "instance": _this.instance,
            "elementID": elementID,
            "src": data.src,
            "plugin": data.plugin
        };
        if (_this.mediaPlayers[elementID] && _this.mediaPlayers[elementID].startTrack !== null && _this.mediaPlayers[elementID].playlist[0].defaultSource !== undefined) {
            _this.mediaPlayers[elementID].setContextInfo(event, contextInfo, null);
            event.stopPropagation();
        } else {
            safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
            event.stopPropagation();
        }
    }, false);
    
    // Build the placeholder
    placeholderElement.innerHTML = "<div class=\"CTFplaceholderContainer\"><div class=\"CTFlogoVerticalPosition\"><div class=\"CTFlogoHorizontalPosition\"><div class=\"CTFlogoContainer CTFnodisplay\"><div class=\"CTFlogo\"></div><div class=\"CTFlogo CTFinset\"></div></div></div></div></div>";
    if(responseData.isInvisible) placeholderElement.firstChild.className += " CTFinvisible";
    
    // Fill the main arrays
    this.blockedElements[elementID] = element;
    this.blockedData[elementID] = data;
    this.placeholderElements[elementID] = placeholderElement;
    // Display the badge
    this.displayBadge(data.plugin, elementID);
    // Look for video replacements
    if(this.settings.replacePlugins) {
        var elementData = this.directKill(elementID);
        if(!elementData) { // send to the killers
            // Need to pass the base URL to the killers so that they can resolve URLs, eg. for AJAX requests.
            // According to RFC1808, the base URL is given by the <base> tag if present,
            // else by the 'Content-Base' HTTP header if present, else by the current URL.
            // Fortunately the magical anchor trick takes care of all this for us!!
            var tmpAnchor = document.createElement("a");
            tmpAnchor.href = "./";
            elementData = {
                "instance": this.instance,
                "elementID": elementID,
                "plugin": data.plugin,
                "src": data.src,
                "location": window.location.href,
                "title": document.title,
                "baseURL": tmpAnchor.href,
                "href": data.href,
                "params": getParams(element, data.plugin)
            };
        }
        safari.self.tab.dispatchMessage("killPlugin", elementData);
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

ClickToPlugin.prototype.loadSource = function(string) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i] && this.blockedData[i].src.indexOf(string) !== -1) {
            this.loadPluginForElement(i);
        }
    }
};

ClickToPlugin.prototype.loadInvisible = function() {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i] && this.placeholderElements[i].firstChild.className === "CTFplaceholderContainer CTFinvisible") {
            this.loadPluginForElement(i);
        }
    }
};

ClickToPlugin.prototype.prepMedia = function(mediaData) {
    var elementID = mediaData.elementID;
    if(!this.blockedElements[elementID]) return; // User has loaded plugin already

    if(!this.mediaPlayers[elementID]) {
        this.mediaPlayers[elementID] = new mediaPlayer();
    }
    
    this.mediaPlayers[elementID].handleMediaData(mediaData);
    if(mediaData.loadAfter) return;

    // Check if we should load video at once
    if(mediaData.autoload) {
        this.loadMediaForElement(elementID, null);
        return;
    }
    if(this.settings.showPoster && mediaData.playlist[0].posterURL) {
        // show poster as background image
        this.placeholderElements[elementID].style.opacity = "1 !important";
        this.placeholderElements[elementID].style.backgroundImage = "url('" + mediaData.playlist[0].posterURL + "') !important";
        this.placeholderElements[elementID].className = "CTFplaceholder"; // remove 'noimage' class
    }
    if(mediaData.playlist[0].title) this.placeholderElements[elementID].title = mediaData.playlist[0].title; // set tooltip
    else this.placeholderElements[elementID].removeAttribute("title");
    
    if(this.settings.useSourceSelector) {
        var hasSourceSelector = this.initializeSourceSelector(elementID, mediaData.playlist[0].sources, mediaData.playlist[0].defaultSource);
    }
    
    if(mediaData.badgeLabel) this.displayBadge(mediaData.badgeLabel, elementID);
    else if(hasSourceSelector) this.displayBadge(this.blockedData[elementID].plugin + "*", elementID);
};

ClickToPlugin.prototype.initializeSourceSelector = function(elementID, sources, defaultSource) {
    var _this = this;
    var loadPlugin = function(event) {
        _this.loadPluginForElement(elementID);
        event.stopPropagation();
    };
    var handleClickEvent = function(event, source) {
        _this.loadMediaForElement(elementID, source);
        event.stopPropagation();
    };
    var handleContextMenuEvent = function(event, source) {
        var contextInfo = {
            "instance": _this.instance,
            "elementID": elementID,
            "src": _this.blockedData[elementID].src,
            "plugin": _this.blockedData[elementID].plugin
        };
        _this.mediaPlayers[elementID].setContextInfo(event, contextInfo, source);
        event.stopPropagation();
    };
    
    var selector = new sourceSelector(this.blockedData[elementID].plugin, loadPlugin, handleClickEvent, handleContextMenuEvent);
    
    selector.setPosition(0,0);
    selector.buildSourceList(sources);
    selector.setCurrentSource(defaultSource);
    
    this.placeholderElements[elementID].firstChild.appendChild(selector.element);
    return selector.unhide(this.blockedData[elementID].width, this.blockedData[elementID].height);
};

ClickToPlugin.prototype.loadMediaForElement = function(elementID, source) {
    if(source === null) source = this.mediaPlayers[elementID].playlist[0].defaultSource;
    if(source === undefined) {
        this.loadPluginForElement(elementID);
        return;
    }
    var contextInfo = {
        "instance": this.instance,
        "elementID": elementID,
        "plugin": this.blockedData[elementID].plugin
    };

    // Initialize player
    var _this = this;
    this.mediaPlayers[elementID].createMediaElement(this.blockedData[elementID].plugin, function(event) {_this.reloadInPlugin(elementID); event.stopPropagation();}, this.blockedData[elementID].width, this.blockedData[elementID].height, this.settings.initialBehavior, this.settings.volume, contextInfo, this.settings.useSourceSelector);

    // Replace placeholder and load first track
    this.placeholderElements[elementID].parentNode.replaceChild(this.mediaPlayers[elementID].containerElement, this.placeholderElements[elementID]);
    this.mediaPlayers[elementID].loadTrack(0, source);
    this.placeholderElements[elementID] = null;
};

ClickToPlugin.prototype.downloadMedia = function(elementID, source) {
    var track = this.mediaPlayers[elementID].currentTrack;
    if(track === null) track = 0;
    if(source === null) source = this.mediaPlayers[elementID].currentSource;
    downloadURL(this.mediaPlayers[elementID].playlist[track].sources[source].url);
};

ClickToPlugin.prototype.viewInQuickTimePlayer = function(elementID, source) {
    var track = this.mediaPlayers[elementID].currentTrack;
    var element;
    if(track === null) {
        track = 0;
        element = this.placeholderElements[elementID];
    } else {
        element = this.mediaPlayers[elementID].containerElement;
    }
    if(source === null) source = this.mediaPlayers[elementID].currentSource;
    var mediaURL = this.mediaPlayers[elementID].playlist[track].sources[source].url;
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
    element.appendChild(QTObject);
    setTimeout(function() {element.removeChild(QTObject);}, 1000);
};

ClickToPlugin.prototype.setVolumeTo = function(volume) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.mediaPlayers[i] && this.mediaPlayers[i].mediaElement) this.mediaPlayers[i].mediaElement.volume = volume;
    }
};

ClickToPlugin.prototype.setOpacityTo = function(opacity) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i] && this.placeholderElements[i].className === "CTFplaceholder CTFnoimage") this.placeholderElements[i].style.opacity = opacity + " !important";
    }
};

ClickToPlugin.prototype.removeElement = function(elementID) {
    var element = this.placeholderElements[elementID];
    while(element.parentNode.childNodes.length === 1) {
        element = element.parentNode;
    }
    element.parentNode.removeChild(element);
    this.clearAll(elementID);
};

ClickToPlugin.prototype.showElement = function(elementID) {
    alert("Location: " + window.location.href + "\nSource: " + this.blockedData[elementID].src + "\n\n" + HTMLToString(this.blockedElements[elementID]));
};

// I really don't like the next two methods, but can't come up with something better
// They are certainly NOT theoretically sound (due to asynchronicity)
// The worst that can happen though is the badge overflowing the placeholder, or staying hidden.
// Never saw either happen
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

ClickToPlugin.prototype.clickPlaceholder = function(elementID, usePlugin) {
    if (!usePlugin && this.mediaPlayers[elementID] && this.mediaPlayers[elementID].startTrack !== null) {
        this.loadMediaForElement(elementID, null);
    } else {
        this.loadPluginForElement(elementID);
    }
};

// Sometimes an <object> has a media element as fallback content
ClickToPlugin.prototype.directKill = function(elementID) {
    var mediaElements = this.blockedElements[elementID].getElementsByTagName("video");
    var audioElements = this.blockedElements[elementID].getElementsByTagName("audio");
    var mediaType = null;
    if(mediaElements.length === 0) {
        if(audioElements.length === 0) return false;
        else mediaType = "audio";
    } else mediaType = "video";
    if(mediaType === "audio") mediaElements = audioElements;

    var sources = new Array();
    
    if(!mediaElements[0].hasAttribute("src")) { // look for <source> tags
        var sourceElements = mediaElements[0].getElementsByTagName("source");
        for(var i = 0; i < sourceElements.length; i++) {
            if(mediaElements[0].canPlayType(sourceElements[i].getAttribute("type"))) {
                sources.push({"url": sourceElements[i].getAttribute("src"), "format": sourceElements[i].getAttribute("type").split(";")[0]});
            }
        }
    } else sources.push({"url": mediaElements[0].getAttribute("src"), "format": mediaElements[0].getAttribute("type").split(";")[0]});
    if(sources.length === 0) return false;
    
    return {
        "instance": this.instance,
        "elementID": elementID,
        "location": window.location.href,
        "playlist": [{"mediaType": mediaType, "posterURL": mediaElements[0].getAttribute("poster"), "sources": sources}]
    };
};

new ClickToPlugin();
