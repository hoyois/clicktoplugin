if(location.href !== "about:blank") { // rdar://9238075
// TODO: check if this is still an issue in 5.1

/*************************
ClickToPlugin global scope
*************************/

var blockedElements = []; // array containing the blocked HTML elements
var blockedData = []; // array containing info on the blocked element (plugin, dimensions, source, ...)
var placeholderElements = []; // array containing the corresponding placeholder elements
var mediaPlayers = []; // array containing the HTML5 media players

var settings;
var documentID;
var numberOfBlockedElements = 0;
var stack;
/* The stack is a <div> appended as a child of <body> in which the blocked elements are stored unmodified.
This allows scripts that need to set custom JS properties to those elements (or otherwise modify them) to work.
The stack itself has display:none so that plugins are not instantiated.
Scripts that try to interact with the plugin will still fail, of course. No way around that. */

safari.self.addEventListener("message", respondToMessage, false);
document.addEventListener("beforeload", handleBeforeLoadEvent, true);

document.addEventListener("contextmenu", function(event) {
	safari.self.tab.setContextMenuEventUserInfo(event, {"documentID": documentID, "location": location.href, "blocked": this.getElementsByClassName("CTFplaceholder").length, "invisible": this.getElementsByClassName("CTFinvisible").length});
}, false);

if(window === top) {
	function toggleSettings() {
		var iframe = document.getElementById("CTFsettingsPane");
		if(iframe === null) {
			if(location.href === safari.extension.baseURI + "settings.html") return;
			if(document.body.nodeName === "FRAMESET") {
				// for HTML4 frameset documents, need to open settings in a new tab
				safari.self.tab.dispatchMessage("openSettings", "");
				return;
			}
			iframe = document.createElement("iframe");
			iframe.id = "CTFsettingsPane";
			iframe.className = "CTFhidden";
			iframe.src = safari.extension.baseURI + "settings.html";
			iframe.addEventListener("load", function(e) {e.target.className = "";}, false);
			document.body.appendChild(iframe);
		} else {
			document.body.removeChild(iframe);
			focus();
		}
	}
}

function respondToMessage(event) {
	// ignore messages for other documents
	if(event.message.documentID !== undefined && event.message.documentID !== documentID) return;
	switch(event.name) {
	case "mediaData":
		prepMedia(event.message);
		break;
	case "load":
		loadPlugin(event.message.elementID);
		break;
	case "plugin":
		if(blockedElements[event.message.elementID]) handleBlockedPlugin(event.message.elementID, event.message.plugin);
		break;
	case "hide":
		hidePlugin(event.message.elementID);
		break;
	case "restore":
		restorePlugin(event.message.elementID);
		break;
	case "download":
		downloadMedia(event.message.elementID, event.message.source, false);
		break;
	case "downloadDM":
		downloadMedia(event.message.elementID, event.message.source, true);
		break;
	case "viewInQTP":
		viewInQuickTimePlayer(event.message.elementID, event.message.source);
		break;
	case "showInfo":
		getPluginInfo(event.message.elementID);
		break;
	case "loadAll":
		loadAll();
		break;
	case "hideAll":
		hideAll();
		break;
	case "loadSource":
		loadSource(event.message);
		break;
	case "hideSource":
		hideSource(event.message);
		break;
	case "loadLocation":
		if(location.href.indexOf(event.message) !== -1) loadAll();
		break;
	case "hideLocation":
		if(location.href.indexOf(event.message) !== -1) hideAll();
		break;
	case "loadInvisible":
		loadInvisible();
		break;
	case "toggleSettings":
		if(window === top) toggleSettings();
		break;
	}
}

function handleBeforeLoadEvent(event) {	
	if(!(event.target instanceof HTMLObjectElement || event.target instanceof HTMLEmbedElement)) return;
	if(event.target.allowedToLoad) return;
	
	// cf. HTMLObjectElement::hasValidClassId
	if(event.target.getAttribute("classid") && event.target.getAttribute("classid").slice(0,5) !== "java:") return;
	
	var data = getData(event);
	
	var response = safari.self.tab.canLoad(event, data);
	if(response === true) return; // allow plugin
	if(response === false) { // hide plugin
		event.preventDefault();
		event.stopImmediatePropagation();
		removeHTMLNode(event.target);
		return;
	}
	
	// Load the user settings
	if(settings === undefined) settings = safari.self.tab.canLoad(event, "getSettings");
	
	// Deal with sIFR Flash
	if(event.target.classList.contains("sIFR-flash")) {
		if(settings.sIFRPolicy === "autoload") return;
		if(settings.sIFRPolicy === "textonly") {
			setTimeout(function() {disableSIFR(event.target);}, 0);
			event.preventDefault();
			event.stopImmediatePropagation();
			return;
		}
	}
	
	// At this point we know we have to block 'element' from loading
	var elementID = numberOfBlockedElements++;
	
	// Give an address to this document to receive messages
	if(documentID === undefined) {
		documentID = safari.self.tab.canLoad(event, "getDocumentID");
		registerGlobalShortcuts();
	}
	
	if(settings.debug) {
		var e = event.target, positionX = 0, positionY = 0;
		do {
			positionX += e.offsetLeft; positionY += e.offsetTop;
		} while(e = e.offsetParent);
		if(!confirm("ClickToPlugin is about to block element " + documentID + "." + elementID + ":\n" + "\nType: " + (response.plugin ? response.plugin : "?") + "\nLocation: " + location.href + "\nSource: " + response.src + "\nPosition: (" + positionX + "," + positionY + ")\nSize: " + data.width + "x" + data.height)) return;
	}
	
	event.preventDefault(); // prevents resource from loading
	event.stopImmediatePropagation(); // compatibility with other extensions
	
	if(!event.url && !event.target.id) return;
	
	// Create the placeholder element
	var placeholderElement = document.createElement("div");
	if(settings.showTooltip) placeholderElement.title = response.src; // tooltip
	placeholderElement.className = "CTFnoimage CTFplaceholder";
	placeholderElement.style.width = data.width + "px !important";
	placeholderElement.style.height = data.height + "px !important";
	if(response.isInvisible) placeholderElement.classList.add("CTFinvisible");
	
	// Copy CSS box & positioning properties that have an effect on page layout
	// Note: 'display' is set to 'inline-block', which is ALWAYS the effective value for "replaced" elements
	var style = getComputedStyle(event.target, null);
	var position = style.getPropertyValue("position");
	if(position === "static") placeholderElement.style.setProperty("position", "relative", "important");
	else placeholderElement.style.setProperty("position", position, "important");
	applyCSS(placeholderElement, style, ["top", "right", "bottom", "left", "z-index", "clear", "float", "margin-top", "margin-right", "margin-bottom", "margin-left", "-webkit-margin-before-collapse", "-webkit-margin-after-collapse"]);
	
	// Replace the element by the placeholder
	if(event.target.parentNode && event.target.parentNode.className !== "CTFnodisplay") {
		event.target.parentNode.replaceChild(placeholderElement, event.target);
	} else return; // fired beforeload twice (WebKit bug)
	
	// Put the element in the stack
	if(stack === undefined) {
		stack = document.createElement("div");
		stack.id = "CTFstack";
		stack.className = "CTFnodisplay";
		stack.style.display = "none !important";
		stack.innerHTML = "<div class=\"CTFnodisplay\"><div class=\"CTFnodisplay\"></div></div>";
		document.body.appendChild(stack);
	}
	try {
		stack.firstChild.firstChild.appendChild(event.target);
	} catch(err) { // some script has modified the stack structure. No big deal, we just reset it
		stack.innerHTML = "<div class=\"CTFnodisplay\"><div class=\"CTFnodisplay\"></div></div>";
		stack.firstChild.firstChild.appendChild(event.target);
	}
	
	// Complete and cleanup data
	data.src = response.src;
	delete data.type;
	delete data.location;
	delete data.source;
	delete data.qtsrc;
	
	// Fill the main arrays
	blockedElements[elementID] = event.target;
	blockedData[elementID] = data;
	placeholderElements[elementID] = placeholderElement;
	
	// Check MIME type if plugin is undefined
	if(!response.plugin) safari.self.tab.dispatchMessage("checkMIMEType", {"documentID": documentID, "elementID": elementID, "url": data.src});
	
	// Event listeners
	registerLocalShortcuts(elementID);
	
	placeholderElement.addEventListener("click", function(event) {
		clickPlaceholder(elementID);
		event.stopPropagation();
	}, false);
	placeholderElement.addEventListener("contextmenu", function(event) {
		var contextInfo = {
			"documentID": documentID,
			"elementID": elementID,
			"src": blockedData[elementID].src,
			"plugin": blockedData[elementID].plugin // it can change in time
		};
		if(mediaPlayers[elementID] && mediaPlayers[elementID].startTrack !== undefined && mediaPlayers[elementID].currentSource !== undefined) {
			mediaPlayers[elementID].setContextInfo(event, contextInfo);
			event.stopPropagation();
		} else {
			safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
			event.stopPropagation();
		}
	}, false);
	
	// Fill the placeholder
	placeholderElement.innerHTML = "<div class=\"CTFplaceholderContainer\"><div class=\"CTFlogoContainer CTFnodisplay\"><div class=\"CTFlogo\"></div><div class=\"CTFlogo CTFinset\"></div></div></div>";
	placeholderElement.firstChild.style.opacity = settings.opacity + " !important";
	
	if(response.plugin) handleBlockedPlugin(elementID, response.plugin);
	else displayBadge(elementID, "?");
}

function handleBlockedPlugin(elementID, plugin) {
	blockedData[elementID].plugin = plugin;
	
	// Display the badge
	displayBadge(elementID, plugin);
	
	// Look for HTML5 replacements
	var elementData;
	if(settings.useFallbackMedia && blockedElements[elementID].nodeName.toLowerCase() === "object") elementData = directKill(blockedElements[elementID]);
	if(!elementData && settings.additionalScripts.length > 0) { // send to the killers
		// Need to pass the base URL to the killers so that they can resolve URLs, eg. for XHRs.
		// According to rfc1808, the base URL is given by the <base> tag if present,
		// else by the 'Content-Base' HTTP header if present, else by the current URL.
		// Fortunately the magical anchor trick takes care of all this for us!
		var anchor = document.createElement("a");
		anchor.href = "./";
		elementData = {
			"plugin": plugin,
			"src": blockedData[elementID].src,
			"location": location.href,
			"title": document.title,
			"baseURL": anchor.href,
			"params": blockedData[elementID].params
		};
	}
	if(elementData) {
		elementData.documentID = documentID;
		elementData.elementID = elementID;
		safari.self.tab.dispatchMessage("killPlugin", elementData);
	}
	delete blockedData[elementID].params;
}

function clearAll(elementID) {
	delete blockedElements[elementID];
	delete blockedData[elementID];
	delete placeholderElements[elementID];
	delete mediaPlayers[elementID];
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
		if(placeholderElements[i] && placeholderElements[i].classList.contains("CTFinvisible")) {
			loadPlugin(i);
		}
	}
}

function prepMedia(mediaData) {
	var elementID = mediaData.elementID;
	if(!blockedElements[elementID]) return; // User has loaded plugin already

	if(!mediaPlayers[elementID]) {
		mediaPlayers[elementID] = new mediaPlayer();
	}
	
	mediaPlayers[elementID].handleMediaData(mediaData);
	if(mediaData.loadAfter) return;

	// Check if we should load video at once
	if(mediaData.autoload) {
		loadMedia(elementID, mediaData.autoplay ? 3 : 0);
		return;
	}
	if(settings.showPoster && mediaData.playlist[0].poster) {
		// show poster as background image
		placeholderElements[elementID].firstChild.style.opacity = "1 !important";
		placeholderElements[elementID].firstChild.style.backgroundImage = "url('" + mediaData.playlist[0].poster + "') !important";
		placeholderElements[elementID].classList.remove("CTFnoimage"); // remove 'noimage' class
	}
	if(mediaData.playlist[0].title && settings.showMediaTooltip) placeholderElements[elementID].title = mediaData.playlist[0].title; // set tooltip
	else placeholderElements[elementID].removeAttribute("title");
	
	if(settings.showSourceSelector) {
		var hasSourceSelector = initializeSourceSelector(elementID, mediaData.playlist[0]);
	}
	
	if(mediaData.badgeLabel) displayBadge(elementID, mediaData.badgeLabel);
	else if(hasSourceSelector) displayBadge(elementID, blockedData[elementID].plugin + "*");
}

function initializeSourceSelector(elementID, media) {
	if(media.sources.length === 0) return false;
	
	var selector = new sourceSelector(blockedData[elementID].plugin,
		function(event) {loadPlugin(elementID);},
		media.defaultSource === undefined ? undefined : function(event) {viewInQuickTimePlayer(elementID, media.defaultSource);},
		function(event, source) {loadMedia(elementID, 2, source);},
		function(event, source) {
			var contextInfo = {
				"documentID": documentID,
				"elementID": elementID,
				"src": blockedData[elementID].src,
				"plugin": blockedData[elementID].plugin
			};
			mediaPlayers[elementID].setContextInfo(event, contextInfo, source);
		}
	);
	
	selector.init(media.sources);
	selector.setCurrentSource(settings.defaultPlayer === "html5" ? media.defaultSource : settings.defaultPlayer);
	
	placeholderElements[elementID].appendChild(selector.containerElement);
	return selector.unhide(blockedData[elementID].width, blockedData[elementID].height);
}

function loadMedia(elementID, init, source) {
	if(source === undefined) source = mediaPlayers[elementID].currentSource;
	
	var contextInfo = {
		"documentID": documentID,
		"elementID": elementID,
		"plugin": blockedData[elementID].plugin
	};
	
	// Initialize player
	mediaPlayers[elementID].createMediaElement(blockedData[elementID].width, blockedData[elementID].height, getComputedStyle(placeholderElements[elementID], null), contextInfo);
	
	// Replace placeholder and load first track
	placeholderElements[elementID].parentNode.replaceChild(mediaPlayers[elementID].containerElement, placeholderElements[elementID]);
	mediaPlayers[elementID].initializeShadowDOM(); // this can only be done after insertion
	mediaPlayers[elementID].loadTrack(0, init, source);
	delete placeholderElements[elementID];
}

function downloadMedia(elementID, source, useDownloadManager) {
	var track = mediaPlayers[elementID].currentTrack;
	if(track === undefined) track = 0;
	if(source === undefined) {
		source = mediaPlayers[elementID].currentSource;
		if(source === undefined) return;
	}
	var download = downloadURL;
	if(useDownloadManager) download = sendToDownloadManager;
	download(mediaPlayers[elementID].playlist[track].sources[source].url);
}

function viewInQuickTimePlayer(elementID, source) {
	var track = mediaPlayers[elementID].currentTrack;
	if(track === undefined) track = 0;
	else mediaPlayers[elementID].mediaElement.pause();
	if(source === undefined) {
		source = mediaPlayers[elementID].currentSource;
		if(source === undefined) return;
	}
	openInQuickTimePlayer(mediaPlayers[elementID].playlist[track].sources[source].url);
}

function hidePlugin(elementID) {
	removeHTMLNode(placeholderElements[elementID]);
	clearAll(elementID);
}

function getPluginInfo(elementID) {
	alert("Plug-in: " + blockedData[elementID].plugin + " (" + blockedData[elementID].width + "x" + blockedData[elementID].height + ")\nLocation: " + location.href + "\nSource: " + blockedData[elementID].src + "\n\nEmbed code:\n" + new XMLSerializer().serializeToString(blockedElements[elementID]));
}

function displayBadge(elementID, badgeLabel) {
	// Hide the logo before changing the label
	placeholderElements[elementID].firstChild.firstChild.className = "CTFlogoContainer CTFhidden";
	// Set the new label
	placeholderElements[elementID].firstChild.firstChild.firstChild.textContent = badgeLabel;
	placeholderElements[elementID].firstChild.firstChild.lastChild.textContent = badgeLabel;
	
	// Prepare for logo unhiding
	placeholderElements[elementID].firstChild.firstChild.lastChild.className = "CTFlogo CTFtmp";
	
	unhideLogo(elementID);
}

// NOTE: this function should never be called directly (use displayBadge instead)
function unhideLogo(elementID) {
	var logoContainer = placeholderElements[elementID].firstChild.firstChild;
	
	if(logoContainer.firstChild.offsetWidth <= blockedData[elementID].width - 4 && logoContainer.firstChild.offsetHeight <= blockedData[elementID].height - 4) logoContainer.className = "CTFlogoContainer";
	else if(logoContainer.lastChild.offsetWidth <= blockedData[elementID].width - 4 && logoContainer.lastChild.offsetHeight <= blockedData[elementID].height - 4) logoContainer.className = "CTFlogoContainer CTFmini";
	else logoContainer.className = "CTFlogoContainer CTFnodisplay";
	logoContainer.lastChild.className = "CTFlogo CTFinset";
}

function clickPlaceholder(elementID) {
	if(mediaPlayers[elementID] && mediaPlayers[elementID].startTrack !== undefined && mediaPlayers[elementID].currentSource !== undefined) {
		switch(settings.defaultPlayer) {
		case "html5": 
			loadMedia(elementID, 2);
			break;
		case "qtp":
			viewInQuickTimePlayer(elementID);
			break;
		case "plugin":
			loadPlugin(elementID);
			break;
		}
	} else loadPlugin(elementID);
}

function registerGlobalShortcuts() {
	if(settings.loadAllShortcut) {
		document.addEventListener(settings.loadAllShortcut.type, function(event) {
			if(testShortcut(event, settings.loadAllShortcut)) safari.self.tab.dispatchMessage("loadAll", "");
		}, false);
	}
	if(settings.hideAllShortcut) {
		document.addEventListener(settings.hideAllShortcut.type, function(event) {
			if(testShortcut(event, settings.hideAllShortcut)) safari.self.tab.dispatchMessage("hideAll", "");
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

}
