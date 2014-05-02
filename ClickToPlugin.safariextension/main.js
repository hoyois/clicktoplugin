"use strict";

// In iframes with src="javascript:...", safari is undefined
var href = window.location.href;
if(window.safari === undefined) {
	var w = window.parent;
	while(w.safari === undefined && w !== window.top) w = w.parent;
	window.safari = w.safari;
	href = w.location.href;
}

var _ = []; // main array

var settings;
var documentID;
var stack;
/* The stack is a <div> appended as a child of <body> in which the blocked elements are stored unmodified.
This allows scripts that need to set custom JS properties to those elements (or otherwise modify them) to work.
The stack itself has display:none so that plugins are not instantiated. */

// Listeners
safari.self.addEventListener("message", respondToMessage, false);
document.addEventListener("beforeload", handleBeforeLoadEvent, true);
document.addEventListener("contextmenu", function(event) {
	safari.self.tab.setContextMenuEventUserInfo(event, {
		"documentID": documentID,
		"location": href,
		"blocked": this.getElementsByClassName("CTPplaceholder").length,
		"invisible": this.getElementsByClassName("CTPinvisible").length
	});
}, false);

function respondToMessage(event) {
	// Ignore messages for other documents
	if(event.message.documentID !== undefined && event.message.documentID !== documentID) return;
	// Ignore messages for elements that have been cleared
	if(event.message.elementID !== undefined && _[event.message.elementID] === undefined) return;
	
	switch(event.name) {
	case "mediaData":
		handleMediaData(event.message.elementID, event.message.data);
		break;
	case "load":
		loadPlugin(event.message.elementID);
		break;
	case "plugin":
		_[event.message.elementID].plugin = event.message.plugin;
		if(!_[event.message.elementID].player) displayBadge(event.message.elementID, event.message.plugin);
		break;
	case "hide":
		hidePlugin(event.message.elementID);
		break;
	case "restore":
		restorePlugin(event.message.elementID);
		break;
	case "download":
		_[event.message.elementID].player.download(event.message.source);
		break;
	case "openInQTP":
		_[event.message.elementID].player.openInQTP(event.message.source);
		break;
	case "airplay":
		_[event.message.elementID].player.airplay(event.message.source);
		break;
	case "viewOnSite":
		_[event.message.elementID].player.viewOnSite();
		break;
	case "showInfo":
		showInfo(event.message.elementID);
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
		if(href.indexOf(event.message) !== -1) loadAll();
		break;
	case "hideLocation":
		if(href.indexOf(event.message) !== -1) hideAll();
		break;
	case "loadInvisible":
		loadInvisible();
		break;
	case "showSettings":
		if(window === top) {
			if(document.body.nodeName === "FRAMESET") {
				// for HTML4 frameset documents, need to open settings in a new tab
				safari.self.tab.dispatchMessage("openSettings", "");
				return;
			}
			var iframe = document.createElement("iframe");
			iframe.id = "CTPsettingsPane";
			iframe.className = "CTPhidden";
			iframe.src = safari.extension.baseURI + "settings.html";
			var handleLoadEvent = function(event) {
				event.target.removeEventListener("load", handleLoadEvent, false);
				event.target.className = "";
			};
			iframe.addEventListener("load", handleLoadEvent, false);
			document.body.appendChild(iframe);
		}
		break;
	case "hideSettings":
		if(window === top) {
			document.body.removeChild(document.getElementById("CTPsettingsPane"));
			focus();
		}
		break;
	}
}

/* NOTE on duplicate beforeload events
There are 3 different types (all bugs, see #44575)
#1 within 1st handler: when accessing styles of ancestor <object> in handler
#2 after 1st handler: only observed with plugins disabled and !#1
#3 after 1st handler if allowed: caused by misdeclared image types (should not happen in real life)
*/

function handleBeforeLoadEvent(event) {
	if(event.target instanceof HTMLObjectElement) {
		// cf. HTMLObjectElement::hasValidClassId
		if(event.target.getAttribute("classid") && !/^java:/.test(event.target.getAttribute("classid"))) return;
	} else if(!(event.target instanceof HTMLEmbedElement)) return;
	
	if(event.target.ignoreBeforeLoad) return; // duplicate #1
	
	if(event.target.isInStack) { // duplicate #2 or external script modifying the stack
		event.preventDefault();
		return;
	}
	
	// NOTE: allowedToLoad property should be deleted, but we can't because of duplicates #2 and #3
	// This is an unfixable vulnerability
	if(event.target.allowedToLoad) return;
	
	// Gather element data
	var data = {};
	var anchor = document.createElement("a"); // URL resolver
	
	// Plugin data
	if(event.url) anchor.href = event.url;
	data.src = anchor.href;
	data.type = event.target.type;
	data.location = href;
	data.isObject = event.target instanceof HTMLObjectElement;
	data.params = getParams(event.target); // parameters passed to the plugin
	
	// WebKit still uses the type param as last resort (!HTML5)
	if(!data.type && data.params.type) data.type = data.params.type;
	
	// Silverlight and QuickTime sources
	if(data.params.source) {anchor.href = data.params.source; data.source = anchor.href;}
	if(data.params.qtsrc !== undefined) {anchor.href = data.params.qtsrc; data.qtsrc = anchor.href;}
	
	// Dimensions of element
	event.target.ignoreBeforeLoad = true;
	data.width = event.target.offsetWidth; // can cause beforeload dispatch (bug #44575)
	delete event.target.ignoreBeforeLoad;
	data.height = event.target.offsetHeight;
	
	// Additional data for killers
	data.title = document.title;
	anchor.href = "";
	data.baseURL = anchor.href;
	
	// Address of element
	data.documentID = documentID;
	data.elementID = _.length++;
	
	var response = safari.self.tab.canLoad(event, data);
	
	// Immediate actions
	if(response === true) return; // allow plugin
	if(response === false) { // hide plugin
		event.preventDefault();
		event.stopImmediatePropagation();
		if(event.target.parentNode) removeHTMLNode(event.target);
		return;
	}
	if(response === "disableSIFR") {
		event.preventDefault();
		event.stopImmediatePropagation();
		setTimeout(function() {disableSIFR(event.target);}, 0);
		return;
	}
	
	// Initialize settings
	if(documentID === undefined) {
		documentID = response.documentID;
		settings = response.settings;
	}
	
	// Manual override
	if(settings.debug) {
		var e = event.target, positionX = 0, positionY = 0;
		do {positionX += e.offsetLeft; positionY += e.offsetTop;} while(e = e.offsetParent);
		if(!confirm("Should ClickToPlugin block this element?\n\nPlug-in: " + (response.plugin ? response.plugin : "None") + "\nLocation: " + href + "\nSource: " + response.src + "\nPosition: (" + positionX + "," + positionY + ")\nSize: " + data.width + "×" + data.height)) return;
	}
	
	// Block resource
	event.preventDefault();
	event.stopImmediatePropagation(); // make beforeload invisible to other extensions
	
	// Don't create placeholders for the temporary Flash objects created by swfObject
	if(event.target.outerHTML === "<object type=\"application/x-shockwave-flash\"></object>") return;
	// Maybe the element has been removed from the document by a previous beforeload handler
	if(!event.target.parentNode) return;
	
	// Media fallbacks
	if(data.isObject && settings.useFallbackMedia && response.plugin && hasMediaFallback(event.target)) return;
	
	// Create the placeholder element
	var placeholder = document.createElement("div");
	if(settings.showTooltip) placeholder.title = response.src; // tooltip
	placeholder.className = "CTPnoimage CTPplaceholder";
	if(response.isInvisible) placeholder.classList.add("CTPinvisible");
	
	// Copy CSS box & positioning properties that have an effect on page layout
	event.target.classList.add("CTPnodisplay"); // to get the actual computed values (cf. CSSOM spec)
	copyBoxCSS(event.target, placeholder, data.width, data.height);
	
	// Replace and stack
	event.target.parentNode.replaceChild(placeholder, event.target);
	event.target.isInStack = true;
	if(!response.isNative) {
		// Create stack if necessary
		if(stack === undefined || stack.parentNode !== document.body) {
			stack = document.createElement("div");
			stack.id = "CTPstack";
			stack.style.setProperty("display", "none", "important"); // in case the extension is disabled
			stack.innerHTML = "<div><div></div></div>";
			document.body.appendChild(stack);
		}
		try {
			stack.firstChild.firstChild.appendChild(event.target);
		} catch(e) {
			stack.innerHTML = "<div><div></div></div>";
			stack.firstChild.firstChild.appendChild(event.target);
		}
		event.target.classList.remove("CTPnodisplay");
	}
	
	// Fill the main array
	_[data.elementID] = {
		"element": response.isNative ? event.target.cloneNode(true) : event.target,
		"placeholder": placeholder,
		"src": response.src,
		"plugin": response.isNative ? "?" : response.plugin
	};
	
	// Event listeners (not in this scope to prevent unwanted closure)
	registerShortcuts(data.elementID);
	addListeners(data.elementID);
	if("MutationObserver" in window) addObserver(data.elementID);
	
	// Fill the placeholder
	placeholder.innerHTML = "<div class=\"CTPplaceholderContainer\"><div class=\"CTPlogoContainer CTPnodisplay\"><div class=\"CTPlogo\"></div><div class=\"CTPlogo CTPinset\"></div></div></div>";
	placeholder.firstChild.style.setProperty("opacity", settings.opacity, "important");
	
	// Display the badge
	if(_[data.elementID].plugin) displayBadge(data.elementID, _[data.elementID].plugin, true);
}

function loadPlugin(elementID) {
	if(_[elementID].placeholder.parentNode) {
		delete _[elementID].element.isInStack;
		_[elementID].element.allowedToLoad = true;
		_[elementID].placeholder.parentNode.replaceChild(_[elementID].element, _[elementID].placeholder);
		delete _[elementID];
	}
}

function hidePlugin(elementID) {
	if(_[elementID].placeholder.parentNode) {
		removeHTMLNode(_[elementID].placeholder);
		delete _[elementID];
	}
}

function restorePlugin(elementID) {
	delete _[elementID].element.isInStack;
	_[elementID].element.allowedToLoad = true;
	_[elementID].player.container.parentNode.replaceChild(_[elementID].element, _[elementID].player.container);
	_[elementID].player.destroy();
	delete _[elementID];
}

function loadAll() {	
	for(var i in _) loadPlugin(i);
}

function hideAll() {
	for(var i in _) hidePlugin(i);
}

function loadSource(string) {
	for(var i in _) {
		if(_[i].src.indexOf(string) !== -1) loadPlugin(i);
	}
}

function hideSource(string) {
	for(var i in _) {
		if(_[i].src.indexOf(string) !== -1) hidePlugin(i);
	}
}

function loadInvisible() {
	for(var i in _) {
		if(_[i].placeholder.classList.contains("CTPinvisible")) loadPlugin(i);
	}
}

function handleMediaData(elementID, mediaData) {
	if(_[elementID].player === undefined) _[elementID].player = new MediaPlayer({
		"documentID": documentID,
		"elementID": elementID,
		"src": _[elementID].src,
		"plugin": _[elementID].plugin
	});
	
	// Pass media data to the player
	_[elementID].player.handleMediaData(mediaData);
	if(mediaData.loadAfter) return;
	
	if(mediaData.autoload) loadMedia(elementID, mediaData.autoplay);
	else initMedia(elementID, mediaData.playlist[0]);
}

function initMedia(elementID, media) {
	// Set poster & tooltip
	if(settings.showPoster && media.poster) {
		_[elementID].placeholder.firstChild.style.setProperty("opacity", "1", "important");
		_[elementID].placeholder.firstChild.style.setProperty("background-image", "url('" + media.poster + "')", "important");
		_[elementID].placeholder.classList.remove("CTPnoimage");
	}
	if(media.title) _[elementID].placeholder.title = media.title;
	else _[elementID].placeholder.removeAttribute("title");
	
	if(media.sources.length === 0) return;
	
	_[elementID].player.sourceSelector.attachTo(_[elementID].placeholder);
	_[elementID].player.sourceSelector.update();
	
	// Update badge
	var label;
	if(media.defaultSource !== undefined) {
		if(settings.defaultPlayer === "html5") label = "HTML5";
		else if(settings.defaultPlayer === "qtp") label = QT_PLAYER;
		else if(settings.defaultPlayer === "airplay") label = "AirPlay";
	}
	if(label) displayBadge(elementID, label);
	else displayBadge(elementID, (_[elementID].plugin ? _[elementID].plugin : MISSING_PLUGIN) + "*");
}

function loadMedia(elementID, focus) {
	// Initialize player
	_[elementID].placeholder.classList.add("CTPnodisplay");
	_[elementID].player.init(getComputedStyle(_[elementID].placeholder, null));
	
	// Load player
	_[elementID].placeholder.parentNode.replaceChild(_[elementID].player.container, _[elementID].placeholder);
	_[elementID].player.loadFirstTrack();
	
	if(focus) _[elementID].player.container.focus();
	_[elementID].placeholder = {};
}

function displayBadge(elementID, label, async) {
	var logoContainer = _[elementID].placeholder.firstChild.firstChild;
	
	// Hide the badge
	logoContainer.className = "CTPlogoContainer CTPhidden";
	logoContainer.lastChild.className = "CTPlogo CTPtmp";
	// Set the new label
	logoContainer.firstChild.textContent = label;
	logoContainer.lastChild.textContent = label;
	// Store dimensions of new label
	var w1 = logoContainer.firstChild.offsetWidth;
	var h1 = logoContainer.firstChild.offsetHeight;
	var w2 = logoContainer.lastChild.offsetWidth;
	var h2 = logoContainer.lastChild.offsetHeight;
	
	var unhide = function() {
		var width = _[elementID].placeholder.offsetWidth;
		var height = _[elementID].placeholder.offsetHeight;
		if(w1 <= width - 4 && h1 <= height - 4) logoContainer.className = "CTPlogoContainer";
		else if(w2 <= width - 4 && h2 <= height - 4) logoContainer.className = "CTPlogoContainer CTPmini";
		else logoContainer.className = "CTPlogoContainer CTPnodisplay";
		logoContainer.lastChild.className = "CTPlogo CTPinset";
	};
	
	// Unhide label
	if(async) setTimeout(unhide, 0);
	else unhide();
}

function clickPlaceholder(elementID) {
	if(_[elementID].player && _[elementID].player.currentSource !== undefined) {
		switch(settings.defaultPlayer) {
		case "html5": 
			loadMedia(elementID, true);
			break;
		case "qtp":
			_[elementID].player.openInQTP();
			break;
		case "airplay":
			_[elementID].player.airplay();
			break;
		case "plugin":
			loadPlugin(elementID);
			break;
		}
	} else loadPlugin(elementID);
}

function showInfo(elementID) {
	alert("Plug-in: " + (_[elementID].plugin ? _[elementID].plugin : "None") + " (" + _[elementID].placeholder.offsetWidth + "×" + _[elementID].placeholder.offsetHeight + ")\nLocation: " + href + "\nSource: " + _[elementID].src + "\n\nHTML:\n" + new XMLSerializer().serializeToString(_[elementID].element));
}

function registerShortcuts(elementID) {
	if(settings.gestures.hidePlugin) {
		_[elementID].placeholder.addEventListener(settings.gestures.hidePlugin.type, function(event) {
			if(testShortcut(event, settings.gestures.hidePlugin)) {
				hidePlugin(elementID);
				event.stopImmediatePropagation();
			}
		}, false);
	}
}

function addListeners(elementID) {
	_[elementID].placeholder.addEventListener("click", function(event) {
		clickPlaceholder(elementID);
		event.preventDefault();
		event.stopPropagation();
	}, false);
	_[elementID].placeholder.addEventListener("contextmenu", function(event) {
		if(_[elementID].player) {
			_[elementID].player.setContextInfo(event);
		} else {
			safari.self.tab.setContextMenuEventUserInfo(event, {
				"documentID": documentID,
				"elementID": elementID,
				"src": _[elementID].src,
				"plugin": _[elementID].plugin
			});
		}
		event.stopPropagation();
	}, false);
}

function addObserver(elementID) {
	_[elementID].observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if(_[elementID].player && _[elementID].player.container) copyBoxCSS(mutation.target, _[elementID].player.container);
			else copyBoxCSS(mutation.target, _[elementID].placeholder);
		});
	});
	_[elementID].observer.observe(_[elementID].element, {"attributes": true, "attributeFilter": ["style"]});
}
