/****************************
ClickToPlugin class definition
*****************************/

function ClickToPlugin() {
    
    this.blockedElements = new Array();// array containing the blocked  HTML elements
    this.placeholderElements = new Array();// array containing the corresponding placeholder elements
    this.mediaPlayers = new Array();// array containing the HTML5 media players
    
    /*
    Each item in blockedElement will acquire 4 additional properties:
    -> tag: 'embed', 'object', or 'applet'
    -> plugin: the name of the plugin that would handle the element
    -> info: an object gathering relevent attributes of the element
    -> display: the inline value of the CSS 'display' property
    */
    
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
    this.handleDOMContentEventTrampoline = function(event) {
        _this.handleDOMContentEvent(event);
    };

    safari.self.addEventListener("message", this.respondToMessageTrampoline, false);
    document.addEventListener("beforeload", this.handleBeforeLoadEventTrampoline, true);
    // HTML applet elements fire no beforeload event
    // bug filed: https://bugs.webkit.org/show_bug.cgi?id=44023
    // Unsatisfactory workaround (Java will run anyway):
    document.addEventListener("DOMContentLoaded", this.handleDOMContentEventTrampoline, false);
    document.addEventListener("DOMNodeInserted", this.handleDOMContentEventTrampoline, false);
    
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
                    alert(document.HTMLToString(this.blockedElements[loadData[1]]));
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

/* IMPORTANT NOTE on embedded content and plugins
According to the W3C HTML5 spec, to activate a plugin,
-> an 'embed' element must have either the 'src' or the 'type' attribute with nonempty value,
-> an 'object' element must have either the 'data' or the 'type' attribute with nonempty value,
   otherwise fallback content is used, if any.
For <embed> elements, Safari follows this rule. Moreover, if the 'type' attribute is set
in an <embed> element, Safari completely ignores the 'src' attribute when looking for a plugin.

For <object> elements, however, Safari has its own completely incoherent rules.
First, it will NEVER use an <embed> element as fallback content to an <object> element
(in particular, such an <embed> element will never fire a beforeload event).
It's much worse than that, though. The 'src' and 'type' values of the <embed> tag
OVERWRITE the 'data' and 'type' values of the <object> tag. Moreover, Safari can also get
the source and the type from <param> elements named 'src' and 'type'.
Here's how it proceeds for <object> elements in general:

1. If there is a <param> child named 'type', set 'computed type' to its value.
If there is a <param> child named 'src', set 'computed source' to its value.
If both <param> children exist, set X to true, otherwise, X is false.

2. If the <object> element has the 'type' attribute, set 'computed type' to its value.
If the <object> element has the 'data' attribute, set 'computed source' to its value.

3. If there is an <embed> child with the attribute 'type', set 'computed type' to its value.
If there is an <embed> child with the attribute 'src', set 'computed source' to its value.

4. If 'computed type' is set, look for a plugin according to the computed type, and go to 6.

5. If 'computed source' is set, look for a plugin according to the computed source, and go to 7.

6. If no plugin is found: if X is true, go to 5, otherwise, go to 8.

7. If no plugin is found, go to 8.

8. Use fallback content (provided, of course, that it isn't an <embed> element)

The computed source is what Safari sends to the plugin, when one is found.

Good luck making sense of that. Other facts of interest are:
-> Safari ignores the 'classid' attribute.
-> With the exception discussed above, a beforeload event is fired on every
unignored <object> or <embed> element, regardless of it having a type or a source
(the same is true for other elements that fire beforeload events).
*/

// event.type is DOMContentLoaded or DOMNodeInserted (-> block <applet> tags)
ClickToPlugin.prototype.handleDOMContentEvent = function(event) {
    if(event.target.nodeType != 1 && event.target.nodeType != 9) return; // the node is not an HTML Element nor the document
    const applets = event.target.getElementsByTagName("applet");
    if(applets.length == 0) return;

    // Convert NodeList to Array
    var appletElements = new Array();
    for(var i = 0; i < applets.length; i++) {
        appletElements.push(applets[i]);
    }
    
    var tmpAnchor = document.createElement("a");
    for(var i = 0; i < appletElements.length; i++) {
        if(appletElements[i].allowedToLoad) continue;
        appletElements[i].tag = "applet";
        appletElements[i].info = new Object();
        
        // Get source of applet
        if(appletElements[i].code) {
            tmpAnchor.href = appletElements[i].code;
            appletElements[i].info.src = tmpAnchor.href;
        } else if(appletElements[i].hasAttribute("archive")) {
            tmpAnchor.href = appletElements[i].getAttribute("archive");
            appletElements[i].info.src = tmpAnchor.href;
        } else {
            appletElements[i].info.src = "";
        }

        var pluginName = safari.self.tab.canLoad(event, {"src": appletElements[i].info.src, "type": "application/x-java-applet", "location": window.location.href, "width": appletElements[i].offsetWidth, "height": appletElements[i].offsetHeight});
        if(!pluginName) continue; // whitelisted
        
        appletElements[i].plugin = "Java";
        
        if(this.settings == null) {
            this.settings = safari.self.tab.canLoad(event, "getSettings");
        }
        if(this.instance == null) {
            this.instance = safari.self.tab.canLoad(event, "getInstance");
        }
        var elementID = this.numberOfBlockedElements++;
        // BEGIN DEBUG
        if(this.settings["debug"]) {
            if(!confirm("ClickToPlugin is about to block embedded content " + this.instance + "." + elementID + ":\n\n" + document.HTMLToString(element))) return;
        }
        // END DEBUG
        
        this.processBlockedElement(appletElements[i], elementID);
    }
};

ClickToPlugin.prototype.handleBeforeLoadEvent = function(event) {
    const element = event.target;
    
    // deal with sIFR script first
    if(element instanceof HTMLScriptElement && element.src.indexOf("sifr.js") != (-1)) {
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
    
    element.info = getInfo(element, event.url);
    
    var pluginName = safari.self.tab.canLoad(event, {"src": element.info.src, "type": getTypeOf(element), "classid": element.getAttribute("classid"), "location": window.location.href, "width": element.offsetWidth, "height": element.offsetHeight, "launchInQTP": (element.info.autohref && element.info.target == "quicktimeplayer" ? element.info.href : null)});
    if(!pluginName) return; // whitelisted
    
    // Load the user settings
    if(this.settings == null) {
        this.settings = safari.self.tab.canLoad(event, "getSettings");
    }
    
    // if useh264... nah, not worth it & breaks whitelisting
    
    // Deal with sIFR Flash
    if (element.className == "sIFR-flash" || element.hasAttribute("sifr")) {
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
    var elementID = this.numberOfBlockedElements++;
    element.plugin = pluginName;
    
    // Give an address to this CTP instance to receive messages
    if(this.instance == null) {
        this.instance = safari.self.tab.canLoad(event, "getInstance");
    }
    
    // BEGIN DEBUG
    if(this.settings["debug"]) {
        if(!confirm("ClickToPlugin is about to block embedded content " + this.instance + "." + elementID + ":\n\n" + document.HTMLToString(element))) return;
    }
    // END DEBUG
    
    event.preventDefault(); // prevents 'element' from loading
    this.processBlockedElement(element, elementID);
};

ClickToPlugin.prototype.loadPluginForElement = function(elementID) {
    this.blockedElements[elementID].allowedToLoad = true;
    if(this.placeholderElements[elementID].parentNode) {
        this.placeholderElements[elementID].parentNode.removeChild(this.placeholderElements[elementID]);
        this.blockedElements[elementID].style.display = "";
        this.blockedElements[elementID].style.display = this.blockedElements[elementID].display; // remove display:none
        this.clearAll(elementID);
    }
};

ClickToPlugin.prototype.reloadInPlugin = function(elementID) {
    this.blockedElements[elementID].allowedToLoad = true;
    this.mediaPlayers[elementID].containerElement.parentNode.removeChild(this.mediaPlayers[elementID].containerElement);
    this.blockedElements[elementID].style.display = "";
    this.blockedElements[elementID].style.display = this.blockedElements[elementID].display; // remove display:none
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
        if(this.placeholderElements[i] && this.blockedElements[i].info.src.match(string)) {
            this.loadPluginForElement(i);
        }
    }
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

ClickToPlugin.prototype.showDownloadLink = function(mediaType, url, elementID) {
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

ClickToPlugin.prototype.loadMediaForElement = function(elementID) {
    var placeholderElement = this.placeholderElements[elementID];
    
    var contextInfo = {
        "instance": this.instance,
        "elementID": elementID,
        "plugin": this.blockedElements[elementID].plugin
    };

    // Initialize player
    var w = parseInt(placeholderElement.style.width.replace("px",""));
    var h = parseInt(placeholderElement.style.height.replace("px",""));
    this.mediaPlayers[elementID].initialize(this.settings["H264behavior"], w, h, this.settings["volume"], contextInfo);
    // mediaElement.allowedToLoad = true; // not used

    // Replace placeholder and load first track
    placeholderElement.parentNode.replaceChild(this.mediaPlayers[elementID].containerElement, placeholderElement);
    this.mediaPlayers[elementID].loadTrack(0);
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
    var element = this.blockedElements[elementID];
    element.parentNode.removeChild(this.placeholderElements[elementID]);
    while(element.parentNode.childNodes.length == 1) {
        element = element.parentNode;
    }
    element.parentNode.removeChild(element);
    this.clearAll(elementID);
};

// I really don't like the next two methods, but can't come up with something better
// They are certainly NOT theoretically sound (due to asynchronicity)
// The worst that can happen though is the badge overflowing the placeholder, or staying hidden.
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
    } else return;
    
    var _this = this;
    
    // Insert the placeholder just after the element
    if(element.parentNode) {
        element.parentNode.insertBefore(placeholderElement, element.nextSibling);
        element.parentNode.addEventListener("DOMNodeRemoved", function(event) {if(event.target == element && placeholderElement.parentNode) {placeholderElement.parentNode.removeChild(placeholderElement); _this.clearAll(elementID);}}, false);
    } else return;

    placeholderElement.onclick = function(event){_this.clickPlaceholder(elementID);};
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
            var elementData = {
                "instance": this.instance,
                "elementID": elementID,
                "plugin": element.plugin,
                "src": element.info.src,
                "href": element.info.href,
                "image": element.info.image,
                "params": getParamsOf(element),
                "location": window.location.href
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
        "badgeLabel": mediaType == "audio" ? "Audio" : "Video"
    };
    this.prepMedia(mediaData);
    return true;
};

new ClickToPlugin();
