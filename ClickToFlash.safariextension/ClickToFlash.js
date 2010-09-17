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
    It sometimes happen, though the reason is still mysterious to me,(*) that several 'beforeload' events
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
    
    Of course, when such a redundant event happens, we should ignore it as early as possible.
    
    (*) It might have something to do with fallback content
    */
    
    document.oncontextmenu = function(event) {
        safari.self.tab.setContextMenuEventUserInfo(event, {"location": window.location.href, "blocked": this.getElementsByClassName("CTFplaceholder").length});
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
            if(event.message.instance != this.instance) return; // ignore message from other instances
            this.prepMedia(event.message);
            break;
        case "loadContent":
            var loadData = event.message.split(","); // [0] instance, [1] elementID, [2] message
            if (loadData[0] != this.instance) return; // ignore message from other instances
            switch(loadData[2]) {
                case "plugin":
                    this.loadPluginForElement(loadData[1]);
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
                    this.showElement(loadData[1]);
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
            if(window.location.href.match(event.message)) this.loadAll();
            break;
        case "updateVolume":
            this.setVolumeTo(event.message);
            break;
        case "updateOpacity":
            this.setOpacityTo(event.message);
            break;
    }
};

ClickToFlash.prototype.handleBeforeLoadEvent = function(event) {
    const element = event.target;
    
    // deal with sIFR script first
    if(element instanceof HTMLScriptElement && element.src.indexOf("sifr.js") != (-1)) {
        var sIFRData = safari.self.tab.canLoad(event, "sIFR");
        if(!sIFRData.canLoad) {
            // BEGIN DEBUG
            if(sIFRData.debug) {
                if(!confirm("ClickToFlash is about to block an sIFR script:\n\n" + element.src)) return;
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
    
    // Check if it is Flash
    switch(isFlash(element, event.url)) {
        case "probably":
            element.label = "Flash";
            break;
        case "maybe":
            element.label = "?";
            break;
        default:
            return;
    }
    
    // At this point we know we're dealing with Evil itself
    
    // Need to store the absolute source of the element
    if(!event.url) element.source = "";
    else {
        var tmpAnchor = document.createElement("a");
        tmpAnchor.href = event.url;
        element.source = tmpAnchor.href;
    }
    
    // Check whitelists and invisible elements settings
    if(safari.self.tab.canLoad(event, {"src": element.source, "location": window.location.href, "width": element.offsetWidth, "height": element.offsetHeight})) return;
    
    // Load the user settings
    if(this.settings == null) {
        this.settings = safari.self.tab.canLoad(event, "getSettings");
    }
    
    // Deal with sIFR Flash
    if (element.className == "sIFR-flash" || element.hasAttribute("sifr")) {
        if (this.settings["sifrReplacement"] == "autoload") return;
    }
    
    // At this point we know we have to block 'element' from loading
    var elementID = this.numberOfBlockedElements++;
    
    // Give an address to this CTF instance to receive messages
    if(this.instance == null) {
        this.instance = safari.self.tab.canLoad(event, "getInstance");
    }

    // BEGIN DEBUG
    if(this.settings["debug"]) {
        var e = element, positionX = 0, positionY = 0;
        do {
            positionX += e.offsetLeft; positionY += e.offsetTop;
        } while(e = e.offsetParent);
        if(!confirm("ClickToFlash is about to block element " + this.instance + "." + elementID + ":\n" + "\nLocation: " + window.location.href + "\nSource: " + element.source + "\nPosition: (" + positionX + "," + positionY + ")\nSize: " + element.offsetWidth + "x" + element.offsetHeight)) return;
    } 
    // END DEBUG
    
    event.preventDefault(); // prevents 'element' from loading
    this.processBlockedElement(element, elementID);
};

ClickToFlash.prototype.loadPluginForElement = function(elementID) {
    this.blockedElements[elementID].allowedToLoad = true;
    if(this.placeholderElements[elementID].parentNode) {
        this.placeholderElements[elementID].parentNode.removeChild(this.placeholderElements[elementID]);
        this.blockedElements[elementID].style.display = "";
        this.blockedElements[elementID].style.display = this.blockedElements[elementID].display; // remove display:none
        this.clearAll(elementID);
    }
};

ClickToFlash.prototype.reloadInPlugin = function(elementID) {
    this.blockedElements[elementID].allowedToLoad = true;
    this.mediaPlayers[elementID].containerElement.parentNode.removeChild(this.mediaPlayers[elementID].containerElement);
    this.blockedElements[elementID].style.display = "";
    this.blockedElements[elementID].style.display = this.blockedElements[elementID].display; // remove display:none
    this.clearAll(elementID);
};

ClickToFlash.prototype.loadAll = function() {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i]) {
            this.loadPluginForElement(i);
        }
    }
};

ClickToFlash.prototype.loadSrc = function(string) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i] && this.blockedElements[i].source.match(string)) {
            this.loadPluginForElement(i);
        }
    }
};

ClickToFlash.prototype.prepMedia = function(mediaData) {
    if(mediaData.playlist.length == 0 || !mediaData.playlist[0].mediaURL) return;
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
        this.showDownloadLink(mediaData.playlist[0].mediaType, mediaData.playlist[0].mediaURL, mediaData.elementID);
        if(this.settings["showPoster"] && mediaData.playlist[0].posterURL) {
            // show poster as background image
            this.placeholderElements[mediaData.elementID].style.opacity = "1";
            this.placeholderElements[mediaData.elementID].style.backgroundImage = "url('" + mediaData.playlist[0].posterURL + "') !important";
            this.placeholderElements[mediaData.elementID].className = "CTFplaceholder"; // remove 'noimage' class
        }
    }
    
    var badgeLabel = mediaData.badgeLabel;
    if(!badgeLabel) badgeLabel = "Video";
    
    this.displayBadge(badgeLabel, mediaData.elementID);
};

ClickToFlash.prototype.showDownloadLink = function(mediaType, url, elementID) {
    var downloadLinkDiv = document.createElement("div");
    downloadLinkDiv.className = "CTFplaceholderDownloadLink";
    downloadLinkDiv.innerHTML = "<a href=\"" + url + "\">" + (mediaType == "audio" ? localize("AUDIO_LINK") : localize("VIDEO_LINK")) + "</a>";
    
    downloadLinkDiv.onmouseover = function() {
        this.style.opacity = "1";
    };
    
    downloadLinkDiv.onmouseout = function() {
        this.style.opacity = "0";
    };
    
    downloadLinkDiv.style.opacity = "0";
    this.placeholderElements[elementID].appendChild(downloadLinkDiv);
};

ClickToFlash.prototype.loadMediaForElement = function(elementID) {
    var contextInfo = {
        "instance": this.instance,
        "elementID": elementID
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

ClickToFlash.prototype.setVolumeTo = function(volume) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.mediaPlayers[i] && this.mediaPlayers[i].mediaElement) this.mediaPlayers[i].mediaElement.volume = volume;
    }
};

ClickToFlash.prototype.setOpacityTo = function(opacity) {
    for(var i = 0; i < this.numberOfBlockedElements; i++) {
        if(this.placeholderElements[i] && this.placeholderElements[i].className == "CTFplaceholder CTFnoimage") this.placeholderElements[i].style.opacity = opacity;
    }
};

ClickToFlash.prototype.removeElement = function(elementID) {
    var element = this.blockedElements[elementID];
    element.parentNode.removeChild(this.placeholderElements[elementID]);
    while(element.parentNode.childNodes.length == 1) {
        element = element.parentNode;
    }
    element.parentNode.removeChild(element);
    this.clearAll(elementID);
};

ClickToFlash.prototype.showElement = function(elementID) {
    alert("Location: " + window.location.href + "\nSource: " + this.blockedElements[elementID].source + "\n\n" + document.HTMLToString(this.blockedElements[elementID]));
};

// I really don't like the next two methods, but can't come up with something better
// They are certainly NOT theoretically sound (due to asynchronicity)
// The worst that can happen though is the badge overflowing the placeholder, or staying hidden.
ClickToFlash.prototype.displayBadge = function(badgeLabel, elementID) {
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

ClickToFlash.prototype.clickPlaceholder = function(elementID) {
    if (this.mediaPlayers[elementID] && this.mediaPlayers[elementID].startTrack != null) {
        this.loadMediaForElement(elementID);
    } else {
        this.loadPluginForElement(elementID);
    }
};

ClickToFlash.prototype.processBlockedElement = function(element, elementID) {
    
    // An element already blocked may fire a beforeload event again if its CSS display:none is removed.
    // In this case, the placeholder must not be duplicated.
    // Until Webkit comes up with a replacement to DOMAttrModified, there's no event we can use to check this, so we have to loop...
    // We'll assume that no script removes the "style" attribute to improve performance
    if(element.hasAttribute("style")) {
        for(var i = 0; i < elementID; i++) {
            if(element == this.blockedElements[i] && this.placeholderElements[i] && this.placeholderElements[i].parentNode) { 
                element.style.display = "none !important";
                return;
            }
        }
    }
    
    // Create the placeholder element
    var placeholderElement = document.createElement("div");
    placeholderElement.style.width = element.offsetWidth + "px";
    placeholderElement.style.height = element.offsetHeight + "px";
    placeholderElement.style.opacity = this.settings["opacity"];
    
    placeholderElement.className = "CTFplaceholder CTFnoimage";
    
    // Hide the original element
    if (element.style.display != "none") {
        element.display = element.style.display;
        element.style.display = "none !important";
    } else return; // happens for duplicate beforeload events
    
    var _this = this;
    
    // Insert the placeholder just after the element
    if(element.parentNode) {
        element.parentNode.insertBefore(placeholderElement, element.nextSibling);
        element.parentNode.addEventListener("DOMNodeRemoved", function(event) {if(event.target == element && placeholderElement.parentNode) {placeholderElement.parentNode.removeChild(placeholderElement); _this.clearAll(elementID);}}, false);
    } else return;

    placeholderElement.onclick = function(event){_this.clickPlaceholder(elementID); event.stopPropagation();};
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
    
    // Build the placeholder
    placeholderElement.innerHTML = "<div class=\"CTFplaceholderContainer\"><div class=\"CTFlogoVerticalPosition\"><div class=\"CTFlogoHorizontalPosition\"><div class=\"CTFlogoContainer CTFnodisplay\"><div class=\"CTFlogo\"></div><div class=\"CTFlogo CTFinset\"></div></div></div></div></div>";
    
    // Fill the main arrays
    this.blockedElements[elementID] = element;
    this.placeholderElements[elementID] = placeholderElement;
    // Display the badge
    this.displayBadge(element.label, elementID);
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
                "src": element.source,
                "location": window.location.href,
                "baseURL": tmpAnchor.href,
                "params": getParamsOf(element)
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
    
    var mediaData = {
        "elementID": elementID,
        "playlist": [{"mediaType": mediaType, "posterURL": mediaElements[0].getAttribute("poster"), "mediaURL": mediaURL}],
        "badgeLabel": mediaType == "audio" ? "Audio" : "Video"
    };
    this.prepMedia(mediaData);
    return true;
};

new ClickToFlash();
