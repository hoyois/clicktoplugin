if(location.href !== "about:blank") { // rdar://9238075

/*************************
ClickToPlugin global scope
*************************/

var _ = []; // main array

// THOUGHTS
// var _ = []; // main array
// properties: element, data, placeholder, currentElement, mediaPlayer
// currentElement being either element, placeholder, or mediaPlayer.containerElement
// the case "element" only happens when Webkit uses fallback content
// loadPlugin=restorePlugin replaces currentElement (ph or mp) by element
// prepMedia replaces currentElement (el or ph) by placeholder
// PROS: elegant
// CONS: cannot use for(var i in placeholders)...

var settings;
var documentID;
//var numberOfBlockedElements = 0; // simply use elementID = _.push({}); I LIKE THAT
var stack; // should stack exists iff docID does, like settings?
// OR use placeInStack function
/* The stack is a <div> appended as a child of <body> in which the blocked elements are stored unmodified.
This allows scripts that need to set custom JS properties to those elements (or otherwise modify them) to work.
The stack itself has display:none so that plugins are not instantiated. */

// Listeners
safari.self.addEventListener("message", respondToMessage, false);
document.addEventListener("beforeload", handleBeforeLoadEvent, true);
document.addEventListener("contextmenu", function(event) {
	safari.self.tab.setContextMenuEventUserInfo(event, {
		"documentID": documentID,
		"location": location.href,
		"blocked": this.getElementsByClassName("CTPplaceholder").length,
		"invisible": this.getElementsByClassName("CTPinvisible").length
	});
}, false);

if(window === top) {
	function showSettings() {
		if(document.body.nodeName === "FRAMESET") {
			// for HTML4 frameset documents, need to open settings in a new tab
			safari.self.tab.dispatchMessage("openSettings", "");
			return;
		}
		iframe = document.createElement("iframe");
		iframe.id = "CTPsettingsPane";
		iframe.className = "CTPhidden";
		iframe.src = safari.extension.baseURI + "settings.html";
		iframe.addEventListener("load", function(event) {event.target.className = "";}, false);
		document.body.appendChild(iframe);
	}
	function hideSettings() {
		document.body.removeChild(document.getElementById("CTPsettingsPane"));
		focus();
	}
}

function respondToMessage(event) {
	// ignore messages for other documents
	if(event.message.documentID !== undefined && event.message.documentID !== documentID) return;
	// ignore messages for elements that have been cleared
	if(event.message.elementID !== undefined && _[event.message.elementID] === undefined) return;
	
	switch(event.name) {
	case "mediaData":console.log(new Date().getTime())
		prepMedia(event.message);
		break;
	case "load":
		loadPlugin(event.message.elementID);
		break;
	case "plugin":
		handleResponse(event.message.elementID, event.message);
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
	case "showSettings":
		if(window === top) showSettings();
		break;
	case "hideSettings":
		if(window === top) hideSettings();
		break;
	}
}

function handleBeforeLoadEvent(event) {	
	if(!(event.target instanceof HTMLObjectElement || event.target instanceof HTMLEmbedElement)) return;
	
	// cf. HTMLObjectElement::hasValidClassId
	if(event.target.getAttribute("classid") && event.target.getAttribute("classid").slice(0,5) !== "java:") return;
	
	/* NOTE on duplicate beforeload events (see #44575 for details)
	Anything placed in a setTimeout will be run after the duplicate has been handled
	but before handling any subsequent event, so it is possible to set a property exclusively for duplicates */
	
	if(event.target.allowedToLoad) {
		setTimeout(function() {delete event.target.allowedToLoad;}, 0); // in case there is a duplicate event
		return;
	}
	
	// Ignore duplicate events
	if(event.target.ignoreBeforeLoad) return;
	event.target.ignoreBeforeLoad = true; // place these two lines after preventDefault to be sure???
	setTimeout(function() {delete event.target.ignoreBeforeLoad;}, 0);
	
	// Gather element data
	var data = {};
	var anchor = document.createElement("a"); // URL resolver
	
	if(event.url) anchor.href = event.url;
	data.src = anchor.href;
	data.type = event.target.type;
	/* FIXME?: Is it possible to get eventual height/width within display:none iframes?
	Thoughts: We'd need the CSS 2.1 'computed value' of height and width.
	This would be possible using getMatchedCSSRules (returns matching rules in cascading order)
	if 1) it actually worked and 2) didn't have cross-origin restriction.
	Even then, values like 'auto' would be a problem... */
	data.width = event.target.offsetWidth;
	data.height = event.target.offsetHeight;
	data.location = location.href;
	data.isObject = event.target instanceof HTMLObjectElement;
	data.params = getParams(event.target); // parameters passed to the plugin
	
	// Safari still uses the type param as last resort (!HTML5)
	if(!data.type && data.params.type) data.type = data.params.type;
	
	// Silverlight and QuickTime sources
	if(data.params.source) {anchor.href = data.params.source; data.source = anchor.href;}
	if(data.params.qtsrc !== undefined) {anchor.href = data.params.qtsrc; data.qtsrc = anchor.href;}
	
	// Additional data for killers
	data.title = document.title;
	anchor.href = "";
	data.baseURL = anchor.href;
	
	data.pluginsDisabled = navigator.plugins.length === 0;
	data.needID = documentID === undefined;
	data.elementID = _.length;
	
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
	
	if(documentID === undefined) {
		documentID = response.documentID;
		settings = response.settings;
		registerGlobalShortcuts();
	}
	
	// Manual override
	if(settings.debug) {
		var e = event.target, positionX = 0, positionY = 0;
		do {positionX += e.offsetLeft; positionY += e.offsetTop;} while(e = e.offsetParent);
		if(!confirm("ClickToPlugin is about to block an element:\n\nType: " + (response.plugin ? response.plugin : "to be determined") + "\nLocation: " + location.href + "\nSource: " + response.src + "\nPosition: (" + positionX + "," + positionY + ")\nSize: " + data.width + "x" + data.height)) return;
	}
	
	// Block resource
	event.preventDefault();
	event.stopImmediatePropagation(); // for compatibility with other extensions
	
	if(!event.url && !event.target.id) return; // ...
	
	/* NOTE on placeholders
	Why don't we use the blocked element itself as placeholder? This would actually
	work very elegantly: set display to -webkit(-inline)-box with box-pack/align:center,
	store the label in a dataset attribute, and use content CSS property to set the label
	(currently only possible in a ::before). This actually works fine on divs.
	Problems are, the ::before pseudoelts are not rendered on objects and embeds, and,
	more importantly, the context menu is not shown on these elements. When the latter is fixed
	and WebKit fully adopts the CSS3 content property, this will be possible.
	(A problem of a different kind that could be worked around is that YouTube replacements
	with Flash uninstalled rely on the element being replaced right away.)
	*/
	
	// Create the placeholder element
	var placeholder = document.createElement("div");
	if(settings.showTooltip) placeholder.title = response.src; // tooltip
	placeholder.className = "CTPnoimage CTPplaceholder";
	placeholder.style.width = data.width + "px !important";
	placeholder.style.height = data.height + "px !important";
	if(response.isInvisible) placeholder.classList.add("CTPinvisible");
	
	// Copy CSS box & positioning properties that have an effect on page layout
	// Note: 'display' is set to 'inline-block', which is always correct for "replaced elements"
	var style = getComputedStyle(event.target, null);
	var properties = ["top", "right", "bottom", "left", "z-index", "clear", "float", "margin-top", "margin-right", "margin-bottom", "margin-left", "-webkit-margin-before-collapse", "-webkit-margin-after-collapse"];
	// position: static becomes relative
	if(style.getPropertyValue("position") === "static") placeholder.style.setProperty("position", "relative", "important");
	else properties.push("position");
	// vertical-align: baseline becomes bottom (which is the baseline of the element, but not of the placeholder)
	if(style.getPropertyValue("vertical-align") === "baseline") placeholder.style.setProperty("vertical-align", "bottom", "important");
	else properties.push("vertical-align");
	
	applyCSS(placeholder, style, properties);
	
	// Fill the main array
	var elementID = data.elementID;
	_[elementID] = ({
		"element": event.target,
		"placeholder": placeholder,
		"width": data.width,
		"height": data.height
		//"params": data.params
	});
	
	// Event listeners
	registerLocalShortcuts(elementID);
	
	placeholder.addEventListener("click", function(event) {
		clickPlaceholder(data.elementID);
		event.stopPropagation();
	}, false);
	placeholder.addEventListener("contextmenu", function(event) {
		var contextInfo = {
			"documentID": documentID,
			"elementID": elementID,
			"src": _[elementID].src,
			"plugin": _[elementID].plugin // it can change in time
		};
		if(_[elementID].player && _[elementID].player.startTrack !== undefined && _[elementID].player.currentSource !== undefined) {
			_[elementID].player.setContextInfo(event, contextInfo);
			event.stopPropagation();
		} else {
			safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
			event.stopPropagation();
		}
	}, false);
	
	//response.plugin = "FLASH";
	//if(response.plugin || response.isNative) {
		replaceAndStack(placeholder, event.target);
	//}
	
	// Fill the placeholder
	//if(response.useFallback) placeholder.innerHTML = event.target.innerHTML;
	//else {
	placeholder.innerHTML = "<div class=\"CTPplaceholderContainer\"><div class=\"CTPlogoContainer CTPnodisplay\"><div class=\"CTPlogo\"></div><div class=\"CTPlogo CTPinset\"></div></div></div>";
	placeholder.firstChild.style.opacity = settings.opacity + " !important";
	//}
	
	if(response.isNative) {
		_[elementID].element = event.target.cloneNode(true);
		data.documentID = documentID;
		data.elementID = elementID;
		safari.self.tab.dispatchMessage("canLoadAsync", data);
		displayBadge(elementID, "?");
	} else handleResponse(elementID, response);
}

function replaceAndStack(replacement, element) {
	if(!hasParent(element)) return;
	element.parentNode.replaceChild(replacement, element);
	
	// Create stack if necessary
	if(stack === undefined || stack.parentNode !== document.body) {
		stack = document.createElement("div");
		stack.id = "CTPstack";
		stack.className = "CTPnodisplay";
		stack.style.display = "none !important";
		stack.innerHTML = "<div class=\"CTPnodisplay\"><div class=\"CTPnodisplay\"></div></div>";
		document.body.appendChild(stack);
	}
	try {
		stack.firstChild.firstChild.appendChild(element);
	} catch(err) {
		stack.innerHTML = "<div class=\"CTPnodisplay\"><div class=\"CTPnodisplay\"></div></div>";
		stack.firstChild.firstChild.appendChild(element);
	}
}

function handleResponse(elementID, response) {console.log(new Date().getTime())
	_[elementID].src = response.src;
	
	if(response.plugin) {
		_[elementID].plugin = response.plugin;
		displayBadge(elementID, response.plugin);
	} /*else { // response.useFallback === true
		_[elementID].useFallback = true;
		//if(hasParent(_[elementID].placeholder)) {
		//	_[elementID].placeholder.parentNode.replaceChild(_[elementID].element, _[elementID].placeholder);
		//}
	}*/
	
	// Look for HTML5 replacements
	/*var elementData = false;
	if(settings.useFallbackMedia && _[elementID].element.nodeName.toLowerCase() === "object") elementData = directKill(_[elementID].element);
	if(!elementData && settings.hasKillers) { // send to the killers
		// Need to pass the base URL to the killers so that they can resolve URLs, eg. for XHRs.
		// According to rfc1808, the base URL is given by the <base> tag if present,
		// else by the 'Content-Base' HTTP header if present, else by the current URL.
		// Fortunately the magical anchor trick takes care of all this for us!
		var anchor = document.createElement("a");
		anchor.href = "./";
		elementData = {
			//"plugin": plugin,
			"src": response.src,
			"type": response.type,
			"location": location.href,
			"title": document.title,
			"baseURL": anchor.href,
			"params": _[elementID].params
		};
	}
	if(elementData) {
		elementData.documentID = documentID;
		elementData.elementID = elementID;
		safari.self.tab.dispatchMessage("killPlugin", elementData);
	}
	delete _[elementID].params;*/
}

function loadPlugin(elementID) {
	if(hasParent(_[elementID].placeholder)) {
		_[elementID].element.allowedToLoad = true;
		_[elementID].placeholder.parentNode.replaceChild(_[elementID].element, _[elementID].placeholder);
		delete _[elementID];
	}
}

function hidePlugin(elementID) {
	if(hasParent(_[elementID].placeholder)) {
		removeHTMLNode(_[elementID].placeholder)
		delete _[elementID];
	}
}

function restorePlugin(elementID) {
	_[elementID].element.allowedToLoad = true;
	_[elementID].player.containerElement.parentNode.replaceChild(_[elementID].element, _[elementID].player.containerElement);
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

function prepMedia(mediaData) {
	var elementID = mediaData.elementID;
	if(_[elementID].player === undefined) _[elementID].player = new mediaPlayer();
	
	_[elementID].player.handleMediaData(mediaData);
	if(mediaData.loadAfter) return;

	// Check if we should load video at once
	if(mediaData.autoload) {
		loadMedia(elementID, false, mediaData.autoplay);
		return;
	}
	
	if(_[elementID].useFallback) {
		delete _[elementID].useFallback;
		_[elementID].placeholder.innerHTML = "<div class=\"CTPplaceholderContainer\"><div class=\"CTPlogoContainer CTPnodisplay\"><div class=\"CTPlogo\"></div><div class=\"CTPlogo CTPinset\"></div></div></div>";
	}
	
	if(mediaData.playlist[0].poster) {
		// show poster as background image
		_[elementID].placeholder.firstChild.style.opacity = "1 !important";
		_[elementID].placeholder.firstChild.style.backgroundImage = "url('" + mediaData.playlist[0].poster + "') !important";
		_[elementID].placeholder.classList.remove("CTPnoimage"); // remove 'noimage' class
	}
	if(mediaData.playlist[0].title) _[elementID].placeholder.title = mediaData.playlist[0].title; // set tooltip
	else _[elementID].placeholder.removeAttribute("title");
	
	if(settings.showSourceSelector) {
		var hasSourceSelector = initializeSourceSelector(elementID, mediaData.playlist[0]);
	}
	
	if(mediaData.badgeLabel) displayBadge(elementID, mediaData.badgeLabel);
	else if(hasSourceSelector) displayBadge(elementID, _[elementID].plugin + "*");
}

function initializeSourceSelector(elementID, media) {
	if(media.sources.length === 0) return false;
	
	var selector = new sourceSelector(_[elementID].plugin,
		function(event) {loadPlugin(elementID);},
		media.defaultSource === undefined ? undefined : function(event) {viewInQuickTimePlayer(elementID, media.defaultSource);},
		function(event, source) {
			_[elementID].player.currentSource = source;
			loadMedia(elementID, true);
		},
		function(event, source) {
			var contextInfo = {
				"documentID": documentID,
				"elementID": elementID,
				"src": _[elementID].src,
				"plugin": _[elementID].plugin
			};
			_[elementID].player.setContextInfo(event, contextInfo, source);
		}
	);
	
	selector.init(media.sources);
	selector.setCurrentSource(settings.defaultPlayer === "html5" ? media.defaultSource : settings.defaultPlayer);
	
	_[elementID].placeholder.appendChild(selector.containerElement);
	return selector.unhide(_[elementID].width, _[elementID].height);
}

function loadMedia(elementID, focus, autoplay) {
	var source = _[elementID].player.currentSource;
	
	var contextInfo = {
		"documentID": documentID,
		"elementID": elementID,
		"plugin": _[elementID].plugin
	};
	
	// Initialize player
	_[elementID].player.init(_[elementID].width, _[elementID].height, getComputedStyle(_[elementID].placeholder, null), contextInfo);
	
	// Insert media player and load first track
	if(false) {
		replaceAndStack(_[elementID].player.containerElement, _[elementID].element);
	} else {
		_[elementID].placeholder.parentNode.replaceChild(_[elementID].player.containerElement, _[elementID].placeholder);
	}
	_[elementID].player.initializeShadowDOM(); // this can only be done after insertion
	_[elementID].player.loadTrack(0, !autoplay);
	if(focus) _[elementID].player.containerElement.focus();
	delete _[elementID].placeholder; // Is this really worth it? not doing that would simplify checks elsewhere.
}

function downloadMedia(elementID, source, useDownloadManager) {
	var track = _[elementID].player.currentTrack;
	if(track === undefined) track = 0;
	if(source === undefined) {
		source = _[elementID].player.currentSource;
		if(source === undefined) return;
	}
	var download = downloadURL;
	if(useDownloadManager) download = sendToDownloadManager;
	download(_[elementID].player.playlist[track].sources[source].url);
}

function viewInQuickTimePlayer(elementID, source) {
	var track = _[elementID].player.currentTrack;
	if(track === undefined) track = 0;
	else _[elementID].player.mediaElement.pause();
	if(source === undefined) {
		source = _[elementID].player.currentSource;
		if(source === undefined) return;
	}
	openInQuickTimePlayer(_[elementID].player.playlist[track].sources[source].url);
}

function getPluginInfo(elementID) {
	alert("Plug-in: " + _[elementID].plugin ? _[elementID].plugin : "to be determined (" + _[elementID].width + "x" + _[elementID].height + ")\nLocation: " + location.href + "\nSource: " + _[elementID].src + "\n\nEmbed code:\n" + new XMLSerializer().serializeToString(_[elementID].element));
}

function displayBadge(elementID, badgeLabel) {
	var logoContainer = _[elementID].placeholder.firstChild.firstChild;
	
	// Hide the badge
	logoContainer.className = "CTPlogoContainer CTPhidden";
	logoContainer.lastChild.className = "CTPlogo CTPtmp";
	// Set the new label
	logoContainer.firstChild.textContent = badgeLabel;
	logoContainer.lastChild.textContent = badgeLabel;
	
	// Unhide
	if(logoContainer.firstChild.offsetWidth <= _[elementID].width - 4 && logoContainer.firstChild.offsetHeight <= _[elementID].height - 4) logoContainer.className = "CTPlogoContainer";
	else if(logoContainer.lastChild.offsetWidth <= _[elementID].width - 4 && logoContainer.lastChild.offsetHeight <= _[elementID].height - 4) logoContainer.className = "CTPlogoContainer CTPmini";
	else logoContainer.className = "CTPlogoContainer CTPnodisplay";
	logoContainer.lastChild.className = "CTPlogo CTPinset";
}

function clickPlaceholder(elementID) {
	if(_[elementID].player && _[elementID].player.startTrack !== undefined && _[elementID].player.currentSource !== undefined) {
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
		_[elementID].placeholder.addEventListener(settings.hidePluginShortcut.type, function(event) {
			if(testShortcut(event, settings.hidePluginShortcut)) {
				hidePlugin(elementID);
				event.stopImmediatePropagation();
			}
		}, false);
	}
}

}
