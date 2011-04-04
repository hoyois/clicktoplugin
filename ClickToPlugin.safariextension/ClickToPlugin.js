/*************************
ClickToPlugin global scope
*************************/

var blockedElements = new Array(); // array containing the blocked HTML elements
var blockedData = new Array(); // array containing info on the blocked element (plugin, dimension, source, ...)
var placeholderElements = new Array(); // array containing the corresponding placeholder elements
var mediaPlayers = new Array(); // array containing the HTML5 media players

var settings;
var instance;
var numberOfBlockedElements = 0;
var stack;
/*
The stack is a <div> appended as a child of <body> in which the blocked elements are stored unmodified.
This allows scripts that need to set custom JS properties to those elements (or otherwise modify them) to work.
The stack itself has display:none so that plugins are not instantiated.
Scripts that try to interact with the plugin will still fail, of course. No way around that.
*/

safari.self.addEventListener("message", respondToMessage, false);
document.addEventListener("beforeload", handleBeforeLoadEvent, true);

document.addEventListener("contextmenu", function(event) {
    safari.self.tab.setContextMenuEventUserInfo(event, {"instance": instance, "location": window.location.href, "blocked": this.getElementsByClassName("CTFplaceholder").length, "invisible": this.getElementsByClassName("CTFinvisible").length});
}, false);

function clearAll(elementID) {
    delete blockedElements[elementID];
    delete blockedData[elementID];
    delete placeholderElements[elementID];
    delete mediaPlayers[elementID];
}

function respondToMessage(event) {
    switch(event.name) {
        case "mediaData":
            if(event.message.instance !== instance) return; // ignore message from other instances
            if(event.message.plugin) blockedData[event.message.elementID].plugin = event.message.plugin;
            prepMedia(event.message);
            break;
        case "loadContent":
            if(event.message.instance !== instance) return; // ignore message from other instances
            switch(event.message.command) {
                case "plugin":
                    loadPlugin(event.message.elementID);
                    break;
                case "changeLabel":
                    blockedData[event.message.elementID].plugin = event.message.plugin;
                    if(placeholderElements[event.message.elementID] && !mediaPlayers[event.message.elementID]) displayBadge(event.message.plugin, event.message.elementID);
                    break;
                case "remove":
                    hidePlugin(event.message.elementID);
                    break;
                case "reload":
                    restorePlugin(event.message.elementID);
                    break;
                case "download":
                    downloadMedia(event.message.elementID, event.message.source);
                    break;
                case "viewInQTP":
                    viewInQuickTimePlayer(event.message.elementID, event.message.source);
                    break;
                case "loadAll":
                    loadAll();
                    break;
                case "loadInvisible":
                    loadInvisible();
                    break;
                case "info":
                    getPluginInfo(event.message.elementID);
                    break;
            }
            break;
        case "loadAll":
            if(event.message) loadAll();
            else hideAll();
            break;
        case "loadSource":
            loadSource(event.message);
            break;
        case "loadLocation":
            if(window.location.href.indexOf(event.message) !== -1) loadAll();
            break;
        case "hideSource":
            hideSource(event.message);
            break;
        case "hideLocation":
            if(window.location.href.indexOf(event.message) !== -1) hideAll();
            break;
    }
}

function handleBeforeLoadEvent(event) {
    const element = event.target;
    
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
    data.url = event.url;
    data.width = element.offsetWidth;
    data.height = element.offsetHeight;
    data.location = window.location.href;
    data.className = element.className;
    
    var responseData = safari.self.tab.canLoad(event, data);
    if(responseData === true) return; // whitelisted
    if(responseData === false) { // hide plugin
        event.preventDefault();
        event.stopImmediatePropagation();
        removeHTMLNode(element);
        return;
    }
    
    // Load the user settings
    if(settings === undefined) settings = safari.self.tab.canLoad(event, "getSettings");
    
    // Deal with sIFR Flash
    if (element.className === "sIFR-flash") {
        if(settings.sIFRPolicy === "autoload") return;
        if(settings.sIFRPolicy === "textonly") {
            setTimeout(function() {disableSIFR(element);}, 0);
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
    }
    
    // At this point we know we have to block 'element' from loading
    var elementID = numberOfBlockedElements++;
    
    // Give an address to this CTP instance to receive messages
    if(instance === undefined) {
        instance = safari.self.tab.canLoad(event, "getInstance");
        registerGlobalShortcuts();
    }
    
    // BEGIN DEBUG
    if(settings.debug) {
        var e = element, positionX = 0, positionY = 0;
        do {
            positionX += e.offsetLeft; positionY += e.offsetTop;
        } while(e = e.offsetParent);
        if(!confirm("ClickToPlugin is about to block element " + instance + "." + elementID + ":\n" + "\nType: " + (responseData.plugin ? responseData.plugin : "?") + "\nLocation: " + window.location.href + "\nSource: " + data.src + "\nPosition: (" + positionX + "," + positionY + ")\nSize: " + data.width + "x" + data.height)) return;
    }
    // END DEBUG
    
    event.preventDefault(); // prevents 'element' from loading
    event.stopImmediatePropagation(); // compatibility with other extensions
    
    if(!event.url && !element.id) return;
    data.plugin = responseData.plugin;
    
    // Create the placeholder element
    var placeholderElement = document.createElement("div");
    if(settings.showTooltip) placeholderElement.title = data.src; // tooltip
    placeholderElement.className = "CTFnoimage CTFplaceholder";
    placeholderElement.style.width = data.width + "px !important";
    placeholderElement.style.height = data.height + "px !important";
    if(responseData.isInvisible) placeholderElement.className += " CTFinvisible"; // .classList supported in WK nightlies
    
    // Copy CSS box & positioning properties that have an effect on page layout
    // Note: 'display' is set to 'inline-block', which is ALWAYS the effective value for plugin-loading elements
    var style = getComputedStyle(element, null);
    var position = style.getPropertyValue("position");
    if(position === "static") placeholderElement.style.setProperty("position", "relative", "important");
    else placeholderElement.style.setProperty("position", position, "important");
    applyCSS(placeholderElement, style, ["top", "right", "bottom", "left", "z-index", "clear", "float", "margin-top", "margin-right", "margin-bottom", "margin-left", "-webkit-margin-top-collapse", "-webkit-margin-right-collapse", "-webkit-margin-bottom-collapse", "-webkit-margin-left-collapse"]);
    
    // Fill the main arrays
    blockedElements[elementID] = element;
    blockedData[elementID] = data;
    placeholderElements[elementID] = placeholderElement;
    
    // Register shortcuts
    registerLocalShortcuts(elementID);
    
    placeholderElement.addEventListener("click", function(event) {
        clickPlaceholder(elementID);
        event.stopPropagation();
    }, false);
    placeholderElement.addEventListener("contextmenu", function(event) {
        var contextInfo = {
            "instance": instance,
            "elementID": elementID,
            "src": data.src,
            "plugin": blockedData[elementID].plugin // it can change in time
        };
        if (mediaPlayers[elementID] && mediaPlayers[elementID].startTrack !== undefined && mediaPlayers[elementID].currentSource !== undefined) {
            mediaPlayers[elementID].setContextInfo(event, contextInfo);
            event.stopPropagation();
        } else {
            safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
            event.stopPropagation();
        }
    }, false);
    
    // Replace the element by the placeholder
    if(element.parentNode && element.parentNode.className !== "CTFnodisplay") {
        element.parentNode.replaceChild(placeholderElement, element);
    } else { // fired beforeload twice (NOTE: as of Safari 5.0.3, this test does not work too early in the handler! HUGE webkit bug here)
        return;
    }
    
    // Place the blocked element in the stack
    if(stack ===  undefined) {
        stack = document.createElement("div");
        stack.id = "CTFstack";
        stack.className = "CTFnodisplay";
        stack.style.display = "none !important";
        stack.innerHTML = "<div class=\"CTFnodisplay\"><div class=\"CTFnodisplay\"></div></div>";
        document.body.appendChild(stack);
    }
    try {
        stack.firstChild.firstChild.appendChild(element);
    } catch(err) { // some script has modified the stack structure. No big deal, we just reset it
        stack.innerHTML = "<div class=\"CTFnodisplay\"><div class=\"CTFnodisplay\"></div></div>";
        stack.firstChild.firstChild.appendChild(element);
    }
    
    // Build the placeholder
    placeholderElement.innerHTML = "<div class=\"CTFplaceholderContainer\"><div class=\"CTFlogoContainer CTFnodisplay\"><div class=\"CTFlogo\"></div><div class=\"CTFlogo CTFinset\"></div></div></div>";
    placeholderElement.firstChild.style.opacity = settings.opacity + " !important";
    
    // Display the badge
    displayBadge(data.plugin ? data.plugin : "?", elementID);
    
    if(!data.plugin) safari.self.tab.dispatchMessage("checkMIMEType", {"instance": instance, "elementID": elementID, "url": event.url});

    // Look for video replacements
    if(settings.enabledKillers.length > 0) {
        var elementData = false;
        if(settings.useFallbackMedia) elementData = directKill(elementID);
        if(!elementData) { // send to the killers
            // Need to pass the base URL to the killers so that they can resolve URLs, eg. for AJAX requests.
            // According to RFC1808, the base URL is given by the <base> tag if present,
            // else by the 'Content-Base' HTTP header if present, else by the current URL.
            // Fortunately the magical anchor trick takes care of all this for us!!
            var tmpAnchor = document.createElement("a");
            tmpAnchor.href = "./";
            elementData = {
                "instance": instance,
                "elementID": elementID,
                "plugin": data.plugin ? data.plugin : "Flash",
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
}

function loadPlugin(elementID) {
    blockedElements[elementID].allowedToLoad = true;
    if(placeholderElements[elementID].parentNode) {
        placeholderElements[elementID].parentNode.replaceChild(blockedElements[elementID], placeholderElements[elementID]);
        clearAll(elementID);
    }
}

function restorePlugin(elementID) {
    blockedElements[elementID].allowedToLoad = true;
    mediaPlayers[elementID].containerElement.parentNode.replaceChild(blockedElements[elementID], mediaPlayers[elementID].containerElement);
    clearAll(elementID);
}

function loadAll() {
    for(var i = 0; i < numberOfBlockedElements; i++) {
        if(placeholderElements[i]) {
            loadPlugin(i);
        }
    }
}

function hideAll() {
    for(var i = 0; i < numberOfBlockedElements; i++) {
        if(placeholderElements[i]) {
            hidePlugin(i);
        }
    }
}

function loadSource(string) {
    for(var i = 0; i < numberOfBlockedElements; i++) {
        if(placeholderElements[i] && blockedData[i].src.indexOf(string) !== -1) {
            loadPlugin(i);
        }
    }
}

function hideSource(string) {
    for(var i = 0; i < numberOfBlockedElements; i++) {
        if(placeholderElements[i] && blockedData[i].src.indexOf(string) !== -1) {
            hidePlugin(i);
        }
    }
}

function loadInvisible() {
    for(var i = 0; i < numberOfBlockedElements; i++) {
        if(placeholderElements[i] && /\bCTFinvisible\b/.test(placeholderElements[i].className)) {
            loadPlugin(i);
        }
    }
}

function prepMedia(mediaData) {
    var elementID = mediaData.elementID;
    if(!blockedElements[elementID]) return; // User has loaded plugin already

    if(!mediaPlayers[elementID]) {
        mediaPlayers[elementID] = new mediaPlayer(mediaData.elementID);
    }
    
    mediaPlayers[elementID].handleMediaData(mediaData);
    if(mediaData.loadAfter) return;

    // Check if we should load video at once
    if(mediaData.autoload) {
        loadMedia(elementID, mediaData.autoplay);
        return;
    }
    if(settings.showPoster && mediaData.playlist[0].posterURL) {
        // show poster as background image
        placeholderElements[elementID].firstChild.style.opacity = "1 !important";
        placeholderElements[elementID].firstChild.style.backgroundImage = "url('" + mediaData.playlist[0].posterURL + "') !important";
        placeholderElements[elementID].className = placeholderElements[elementID].className.substr(11); // remove 'noimage' class
    }
    if(mediaData.playlist[0].title && settings.showMediaTooltip) placeholderElements[elementID].title = mediaData.playlist[0].title; // set tooltip
    else placeholderElements[elementID].removeAttribute("title");
    
    if(settings.showSourceSelector) {
        var hasSourceSelector = initializeSourceSelector(elementID, mediaData.playlist[0].sources, mediaData.playlist[0].defaultSource);
    }
    
    if(mediaData.badgeLabel) displayBadge(mediaData.badgeLabel, elementID);
    else if(hasSourceSelector) displayBadge(blockedData[elementID].plugin + "*", elementID);
}

function initializeSourceSelector(elementID, sources, defaultSource) {
    if(sources.length === 0) return false;
    
    var selector = new sourceSelector(blockedData[elementID].plugin,
        function(event) {loadPlugin(elementID);},
        defaultSource === undefined ? undefined : function(event) {viewInQuickTimePlayer(elementID, defaultSource);},
        function(event, source) {loadMedia(elementID, true, source);},
        function(event, source) {
            var contextInfo = {
                "instance": instance,
                "elementID": elementID,
                "src": blockedData[elementID].src,
                "plugin": blockedData[elementID].plugin
            };
            mediaPlayers[elementID].setContextInfo(event, contextInfo, source);
        }
    );
    
    selector.buildSourceList(sources);
    selector.setCurrentSource(settings.defaultPlayer === "html5" ? defaultSource : settings.defaultPlayer);
    
    placeholderElements[elementID].appendChild(selector.containerElement);
    return selector.unhide(blockedData[elementID].width, blockedData[elementID].height);
}

function loadMedia(elementID, autoplay, source) {
    if(source === undefined) source = mediaPlayers[elementID].currentSource;
    
    var contextInfo = {
        "instance": instance,
        "elementID": elementID,
        "plugin": blockedData[elementID].plugin
    };
    
    // Initialize player
    mediaPlayers[elementID].createMediaElement(blockedData[elementID].width, blockedData[elementID].height, getComputedStyle(placeholderElements[elementID], null), contextInfo);
    
    // Replace placeholder and load first track
    placeholderElements[elementID].parentNode.replaceChild(mediaPlayers[elementID].containerElement, placeholderElements[elementID]);
    mediaPlayers[elementID].initializeShadowDOM(); // this can only be done after insertion
    mediaPlayers[elementID].containerElement.focus();
    mediaPlayers[elementID].loadTrack(0, autoplay, source);
    delete placeholderElements[elementID];
}

function downloadMedia(elementID, source) {
    var track = mediaPlayers[elementID].currentTrack;
    if(track === undefined) track = 0;
    if(source === undefined) {
        source = mediaPlayers[elementID].currentSource;
        if(source === undefined) return;
    }
    downloadURL(mediaPlayers[elementID].playlist[track].sources[source].url);
}

function viewInQuickTimePlayer(elementID, source) {
    var track = mediaPlayers[elementID].currentTrack;
    var element;
    if(track === undefined) {
        track = 0;
        element = placeholderElements[elementID];
    } else {
        element = mediaPlayers[elementID].containerElement;
    }
    if(source === undefined) {
        source = mediaPlayers[elementID].currentSource;
        if(source === undefined) return;
    }
    var mediaURL = mediaPlayers[elementID].playlist[track].sources[source].url;
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
}

function hidePlugin(elementID) {
    removeHTMLNode(placeholderElements[elementID]);
    clearAll(elementID);
}

function getPluginInfo(elementID) {
    alert("Plugin: " + blockedData[elementID].plugin + " (" + blockedData[elementID].width + "x" + blockedData[elementID].height + ")\nLocation: " + window.location.href + "\nSource: " + blockedData[elementID].src + "\n\nEmbed code:\n" + HTMLToString(blockedElements[elementID]));
}

function displayBadge(badgeLabel, elementID) {
    if(!badgeLabel) return;
    // Hide the logo before changing the label
    placeholderElements[elementID].firstChild.firstChild.className = "CTFlogoContainer CTFhidden";
    // Set the new label
    placeholderElements[elementID].firstChild.firstChild.childNodes[0].textContent = badgeLabel;
    placeholderElements[elementID].firstChild.firstChild.childNodes[1].textContent = badgeLabel;
    
    // Prepare for logo unhiding
    placeholderElements[elementID].firstChild.firstChild.childNodes[1].className = "CTFlogo CTFtmp";
    
    unhideLogo(elementID, 0);
}

// NOTE: this function should never be called directly (use displayBadge instead)
function unhideLogo(elementID, i) {
    var logoContainer = placeholderElements[elementID].firstChild.firstChild;
    var w0 = placeholderElements[elementID].offsetWidth;
    var h0 = placeholderElements[elementID].offsetHeight;
    var w1 = logoContainer.childNodes[0].offsetWidth;
    var h1 = logoContainer.childNodes[0].offsetHeight;
    var w2 = logoContainer.childNodes[1].offsetWidth;
    var h2 = logoContainer.childNodes[1].offsetHeight;
    
    if(w2 === 0 || h2 === 0 || w1 === 0 || h1 === 0 || w0 === 0 || h0 === 0) {
        if(i > 5) return;
        setTimeout(function() {unhideLogo(elementID, ++i);}, 100); // there's no hurry here
        return;
    }
    
    if(logoContainer.childNodes[1].className !== "CTFlogo CTFtmp") return;
    
    logoContainer.childNodes[1].className = "CTFlogo CTFinset";
    if (w1 <= w0 - 4 && h1 <= h0 - 4) logoContainer.className = "CTFlogoContainer";
    else if (w2 <= w0 - 4 && h2 <= h0 - 4) logoContainer.className = "CTFlogoContainer CTFmini";
    else logoContainer.className = "CTFlogoContainer CTFnodisplay";
}

function clickPlaceholder(elementID) {
    if (mediaPlayers[elementID] && mediaPlayers[elementID].startTrack !== undefined && mediaPlayers[elementID].currentSource !== undefined) {
        switch(settings.defaultPlayer) {
            case "html5": 
                loadMedia(elementID, true);
                break;
            case "qtp":
                viewInQuickTimePlayer(elementID);
                break;
            case "plugin":
                loadPlugin(elementID);
                break;
            /*case "download":
                downloadMedia(elementID);
                break;*/
        }
    } else loadPlugin(elementID);
}

function registerGlobalShortcuts() {
    if(settings.loadAllShortcut) {
        document.addEventListener(settings.loadAllShortcut.type, function(event) {
            if(testShortcut(event, settings.loadAllShortcut)) safari.self.tab.dispatchMessage("loadAll", true);
        }, false);
    }
    if(settings.hideAllShortcut) {
        document.addEventListener(settings.hideAllShortcut.type, function(event) {
            if(testShortcut(event, settings.hideAllShortcut)) safari.self.tab.dispatchMessage("loadAll", false);
        }, false);
    }
}

function registerLocalShortcuts(elementID) {
    if(settings.hidePluginShortcut) {
        placeholderElements[elementID].addEventListener(settings.hidePluginShortcut.type, function(event) {
            if(testShortcut(event, settings.hidePluginShortcut)) {
                hidePlugin(elementID);
                event.stopImmediatePropagation();
            }
        }, false);
    }
}

// Sometimes an <object> has a media element as fallback content
function directKill(elementID) {
    var mediaElements = blockedElements[elementID].getElementsByTagName("video");
    var audioElements = blockedElements[elementID].getElementsByTagName("audio");
    var mediaType;
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
                sources.push({"url": sourceElements[i].getAttribute("src"), "format": sourceElements[i].getAttribute("type").split(";")[0], "mediaType": mediaType});
            }
        }
    } else sources.push({"url": mediaElements[0].getAttribute("src"), "format": mediaElements[0].getAttribute("type").split(";")[0], "mediaType": mediaType});
    
    return {
        "instance": instance,
        "elementID": elementID,
        "location": window.location.href,
        "playlist": [{"posterURL": mediaElements[0].getAttribute("poster"), "sources": sources, "title": mediaElements[0].title}]
    };
}
