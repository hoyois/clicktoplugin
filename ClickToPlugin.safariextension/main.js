if(location.href !== "about:blank") { // rdar://9238075


function time(event) {
	return new Date().getTime() + " " + (E === event);
}
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
	case "mediaData":
		prepMedia(event.message);
		break;
	case "load":
		loadPlugin(event.message.elementID);
		break;
	case "plugin":
		_[event.message.elementID].plugin = event.message.plugin;
		displayBadge(event.message.elementID, event.message.plugin);
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

/*  IMPORTANT NOTE
There are several sources of duplicate beforeload events:

1. One type of duplicate event only concerns image types and kinda makes sense (see globalfunctions.js).
In this case the 2nd beforeload is fired some time after the first has been handled.

SOLUTION
None. We have to leave the allowedToLoad property on indefinitely.

2. The second, more common cause of duplicate beforeload is the following.
The first handler starts, until it comes to .offsetWidth or, in case parentNode is an <object>,
.parentNode.anything. This (under certain tbd conditions)
calls updateWidget(), which causes the handler to pause and a new beforeload event
to be fired AND handled, before the current handler can be resumed resumed.

SOLUTION
This is easy: we can set a property on event.target before evaluating these statements and remove it after.

3. If 2 doesn't happen, all objects/embeds fire a second consecutive events if plugins are disabled.

SOLUTION
Again, impossible to detect.
*/

var i = 0;
var E;

function handleBeforeLoadEvent2(event) {
	if(i === undefined) i = 0;
	if(!(event.target instanceof HTMLObjectElement || event.target instanceof HTMLEmbedElement)) return;
	i++;
	console.log(i + " before parentNode");
	//event.target.parentNode.parentNode;
	console.log(i + " after parentNode");
}

function handleBeforeLoadEvent(event) {
	if(!(event.target instanceof HTMLObjectElement || event.target instanceof HTMLEmbedElement)) return;
	
	if(event.target.ignoreBeforeLoad) return; // duplicate event of type #2
	
	if(event.target.isInStack) { // duplicate event of type #3 (or external script messing with the extension...)
		// We don't check parentNode.className because that can dispatch a new beforeload...
		event.preventDefault();
		return;
	}
	
	i++;
	console.log(event);
	console.log( i + ": beforeload with length " + _.length +  "" + time(event))
	//event.target.parentNode.parentNode;
	console.log(i)
	//if(E === undefined) E = event;
	
	if(event.target.allowedToLoad) {
		// delete event.target.allowedToLoad; // can't because of consecutive duplicate
		console.log("allowedToLoad");
		return;
	}
	
	console.log(i+"before data at " + time(event));
	// Gather element data
	var data = {};
	var anchor = document.createElement("a"); // URL resolver
	
	// cf. HTMLObjectElement::hasValidClassId
	data.isObject = event.target instanceof HTMLObjectElement;
	if(data.isObject && event.target.getAttribute("classid") && event.target.getAttribute("classid").slice(0,5) !== "java:") return;
	
	// Source and type
	if(event.url) anchor.href = event.url;
	data.src = anchor.href;
	data.type = event.target.type;
	
	// Dimensions of element
	/* FIXME?: Is it possible to get eventual height/width within display:none iframes?
	Thoughts: We'd need the CSS 2.1 'computed value' of height and width.
	This would be possible using getMatchedCSSRules (returns matching rules in cascading order)
	if 1) it actually worked and 2) didn't have cross-origin restriction.
	Even then, values like 'auto' would be a problem...
	The only other solution I can think of involves mutation events and lots of messages...
	The problem disappears if placeholders are not used, but that's not currently possible. */
	event.target.ignoreBeforeLoad = true;
	data.width = event.target.offsetWidth; // causes beforeload dispatch in some cases (bug #44575)
	delete event.target.ignoreBeforeLoad;
	data.height = event.target.offsetHeight;
	
	data.location = location.href;
	data.params = getParams(event.target); // parameters passed to the plugin
	
	// WebKit still uses the type param as last resort (!HTML5)
	if(!data.type && data.params.type) data.type = data.params.type;
	
	// Silverlight and QuickTime sources
	if(data.params.source) {anchor.href = data.params.source; data.source = anchor.href;}
	if(data.params.qtsrc !== undefined) {anchor.href = data.params.qtsrc; data.qtsrc = anchor.href;}
	
	// Additional data for killers
	data.title = document.title;
	anchor.href = "";
	data.baseURL = anchor.href;
	
	// Address of element
	data.documentID = documentID;
	data.elementID = _.length++;
	
	data.pluginsDisabled = navigator.plugins.length === 0; // because plugins are always enabled in the global page
	
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
	
	// Initialize settings and global shortcuts
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
	
	// Don't create placeholders for the temporary Flash objects created by swfObject
	if(event.target.outerHTML === "<object type=\"application/x-shockwave-flash\"></object>") return;
	
	// Media fallbacks
	if(data.isObject && settings.useFallbackMedia) {
		var mediaElement = mediaFallback(event.target);
		if(mediaElement && event.target.parentNode) {
			event.target.parentNode.replaceChild(mediaElement, event.target);
			return;
		}
	}
	
	/* NOTES on placeholders
	1. Why don't we use the blocked element itself as placeholder? This would actually
	work very elegantly: set display to -webkit(-inline)-box with box-pack/align:center,
	store the label in a dataset attribute, and use content CSS property to set the label
	(currently only possible in a ::before). This actually works fine on divs.
	Problems are, the ::before pseudoelts are not rendered on objects and embeds, and,
	the deal-breaker, the context menu is not shown on these elements. When the latter is fixed
	and WebKit fully adopts the CSS3 content property, this will be possible.
	2. Why don't we leave the element where it is and put the placeholder after it? This causes
	problems with some initialization scripts that mess with the element's neighborhood. For
	example, in some cases the placeholder element ends up being removed from the document.
	Placing the element in the stack is much safer.
	(A problem of a different kind that could be worked around is that YouTube replacements
	with no Flash only work because the element is removed from the document right away.)
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
	// position: static -> relative (for source selector positioning)
	if(style.getPropertyValue("position") === "static") placeholder.style.setProperty("position", "relative", "important");
	else properties.push("position");
	// vertical-align: baseline -> bottom (= the original baseline: the actual baseline of the placeholder is set by the label; which btw is incorrect since placeholder has overflow:hidden)
	if(style.getPropertyValue("vertical-align") === "baseline") placeholder.style.setProperty("vertical-align", "bottom", "important");
	else properties.push("vertical-align");
	
	applyCSS(placeholder, style, properties);
	
	if(event.target.parentNode === null) { // Should never happen, if I understand Javascript no-multithreading correctly
		console.log("No parentNode!");
		//return;
	}
	
	// Replace and stack
	event.target.parentNode.replaceChild(placeholder, event.target);
	event.target.isInStack = true;
	if(!response.isNative) {
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
			stack.firstChild.firstChild.appendChild(event.target);
		} catch(e) {
			stack.innerHTML = "<div class=\"CTPnodisplay\"><div class=\"CTPnodisplay\"></div></div>";
			stack.firstChild.firstChild.appendChild(event.target);
		}
		console.log(i+"Placed in stack: " + event.target.parentNode.className + " " + time(event));
	}
	
	// Fill the main array
	var elementID = data.elementID;
	console.log(i+"Filling arrays with ID:" + elementID + " and length: " + _.length + " at " + time(event));
	_[elementID] = {
		"element": response.isNative ? event.target.cloneNode(true) : event.target,
		"placeholder": placeholder,
		"width": data.width,
		"height": data.height,
		"src": response.src
	};
	
	// Event listeners
	registerLocalShortcuts(elementID);
	placeholder.addEventListener("click", function(event) {
		clickPlaceholder(elementID);
		event.preventDefault();
		event.stopPropagation();
	}, false);
	placeholder.addEventListener("contextmenu", function(event) {
		var contextInfo = {
			"documentID": documentID,
			"elementID": elementID,
			"src": _[elementID].src,
			"plugin": _[elementID].plugin
		};
		if(hasMedia(elementID)) {
			_[elementID].player.setContextInfo(event, contextInfo);
			event.stopPropagation();
		} else {
			safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
			event.stopPropagation();
		}
	}, false);
	
	// Fill the placeholder
	placeholder.innerHTML = "<div class=\"CTPplaceholderContainer\"><div class=\"CTPlogoContainer CTPnodisplay\"><div class=\"CTPlogo\"></div><div class=\"CTPlogo CTPinset\"></div></div></div>";
	placeholder.firstChild.style.opacity = settings.opacity + " !important";
	
	// Display the badge
	if(response.plugin) {
		_[elementID].plugin = response.plugin;
		displayBadge(elementID, response.plugin);
	} else if(response.isNative) {
		displayBadge(elementID, "?");
	} //else { // No plugin but waiting to be killed
		//displayBadge(elementID, "…");
	//}
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
		delete _[elementID].element.isInStack;
		delete _[elementID];
	}
}

function restorePlugin(elementID) {
	delete _[elementID].element.isInStack;
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

function hasMedia(elementID) {
	return _[elementID].player && _[elementID].player.startTrack !== undefined && _[elementID].player.currentSource !== undefined;
}

function prepMedia(mediaData) {
	var elementID = mediaData.elementID;
	if(_[elementID].player === undefined) _[elementID].player = new MediaPlayer();
	
	_[elementID].player.handleMediaData(mediaData);
	if(mediaData.loadAfter) return;

	// Check if we should load video at once
	if(mediaData.autoload) {
		loadMedia(elementID, mediaData.autoplay);
		return;
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
	
	var selector = new SourceSelector(_[elementID].plugin,
		function(event) {loadPlugin(elementID);},
		media.defaultSource === undefined ? undefined : function(event) {viewInQuickTimePlayer(elementID, media.defaultSource);},
		function(event, source) {
			_[elementID].player.currentSource = source;
			loadMedia(elementID);
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

function loadMedia(elementID, autoplay) {
	var source = _[elementID].player.currentSource;
	
	var contextInfo = {
		"documentID": documentID,
		"elementID": elementID,
		"plugin": _[elementID].plugin
	};
	
	// Initialize player
	_[elementID].player.init(_[elementID].width, _[elementID].height, getComputedStyle(_[elementID].placeholder, null), contextInfo);
	
	// Insert media player and load first track
	_[elementID].placeholder.parentNode.replaceChild(_[elementID].player.containerElement, _[elementID].placeholder);
	_[elementID].player.initializeShadowDOM(); // this can only be done after insertion
	_[elementID].player.loadTrack(0, !autoplay);
	if(autoplay === undefined || autoplay) _[elementID].player.containerElement.focus();
	// delete _[elementID].placeholder; // Is this really worth it? not doing that would simplify checks elsewhere.
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
	alert("Plug-in: " + (_[elementID].plugin ? _[elementID].plugin : "?") + " (" + _[elementID].width + "x" + _[elementID].height + ")\nLocation: " + location.href + "\nSource: " + _[elementID].src + "\n\nEmbed code:\n" + new XMLSerializer().serializeToString(_[elementID].element));
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
	if(hasMedia(elementID)) {
		switch(settings.defaultPlayer) {
		case "html5": 
			loadMedia(elementID);
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
