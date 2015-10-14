"use strict";
function removeHTMLNode(node) {
	while(node.parentNode.parentNode && node.parentNode.childNodes.length === 1) node = node.parentNode;
	node.parentNode.removeChild(node);
}

function disableSIFR(element) {
	var sIFRElement = element.parentNode;
	if(!sIFRElement) return;
	var regex = /\bsIFR-(?:hasFlash|active)\b/g;
	document.documentElement.className = document.documentElement.className.replace(regex, "");
	document.body.className = document.body.className.replace(regex, "");
	var sIFRAlternate = sIFRElement.getElementsByClassName("sIFR-alternate")[0];
	if(sIFRAlternate) sIFRElement.innerHTML = sIFRAlternate.innerHTML;
	sIFRElement.classList.remove("sIFR-replaced");
}

function applyCSS(element, style, properties) {
	for(var x in properties) {
		element.style.setProperty(properties[x], style.getPropertyValue(properties[x]), "important");
	}
}

function copyBoxCSS(element, target, offsetWidth, offsetHeight) {
	var style = getComputedStyle(element, null);
	var properties = ["top", "right", "bottom", "left", "z-index", "clear", "float", "vertical-align", "margin-top", "margin-right", "margin-bottom", "margin-left", "-webkit-margin-before-collapse", "-webkit-margin-after-collapse"];
	// Position: static -> relative
	if(style.getPropertyValue("position") === "static") target.style.setProperty("position", "relative", "important");
	else properties.push("position");
	// Dimensions: absolute -> use offset; % -> ignore padding+border
	if(/%$|^auto$/.test(style.getPropertyValue("width"))) properties.push("width");
	else if(offsetWidth !== undefined) target.style.setProperty("width", offsetWidth + "px", "important");
	if(/%$|^auto$/.test(style.getPropertyValue("height"))) properties.push("height");
	else if(offsetHeight !== undefined) target.style.setProperty("height", offsetHeight + "px", "important");
	["min-width", "max-width", "min-height", "max-height"].forEach(function(property) {
		if(/%$/.test(style.getPropertyValue(property))) properties.push(property);
	});
	// Apply CSS
	applyCSS(target, style, properties);
}

function addBackgroundBlur(element) {
	if(!window.CSS || !window.CSS.supports("-webkit-backdrop-filter", "none")) return;
	var backgroundContainer = document.createElement("div");
	backgroundContainer.className = "CTPbackgroundContainer";
	var background = document.createElement("div");
	background.className = "CTPbackground";
	var backgroundTint = document.createElement("div");
	backgroundTint.className = "CTPbackgroundTint";
	backgroundContainer.appendChild(background);
	backgroundContainer.appendChild(backgroundTint);
	element.appendChild(backgroundContainer);
}

function placeInStack(node) {
	if(stack === undefined) {
		stack = document.createElement("div");
		stack.id = "CTPstack";
		stack.style.setProperty("display", "none", "important"); // in case the extension is disabled
		stack.innerHTML = "<div><div></div></div>";
		document.body.appendChild(stack);
	}
	try {
		stack.firstChild.firstChild.appendChild(node);
	} catch(e) {
		stack.innerHTML = "<div><div></div></div>";
		stack.firstChild.firstChild.appendChild(node);
	}
}

function injectScript(script) {
	var element = document.createElement("script");
	element.text = script;
	document.body.appendChild(element);
}

function downloadURL(url) {
	// NOTE: This function should not work according to DOM Events 3
	// Another (nasty) way would be QuickTime plugin with autohref="true" and target=""
	var downloadLink = document.createElement("a");
	downloadLink.href = url;
	var event = document.createEvent("MouseEvents");
	event.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, true, false, false, 0, null);
	downloadLink.dispatchEvent(event);
}

function sendToDownloadManager(url) {
	var embed = document.createElement("embed");
	embed.allowedToLoad = true;
	embed.className = "CTPpluginLauncher";
	embed.setAttribute("type", "application/zip");
	embed.setAttribute("width", "0");
	embed.setAttribute("height", "0");
	embed.setAttribute("src", url);
	document.body.appendChild(embed);
	setTimeout(function() {document.body.removeChild(embed);}, 10000);
}

function openInQuickTimePlayer(url) {
	// Relative URLs need to be resolved for QTP
	var anchor = document.createElement("a");
	anchor.href = url;
	url = anchor.href;
	var embed = document.createElement("embed");
	embed.allowedToLoad = true;
	embed.className = "CTPpluginLauncher";
	embed.setAttribute("type", "video/quicktime");
	// Need an external URL for source, since QT plugin doesn't accept safari-extension:// protocol
	// This is the same file used by Apple on trailers.apple.com
	embed.setAttribute("src", "http://hoyois.github.io/qtbutton.mov");
	embed.setAttribute("href", url);
	embed.setAttribute("target", "quicktimeplayer");
	embed.setAttribute("autohref", "autohref");
	document.body.appendChild(embed);
	setTimeout(function() {document.body.removeChild(embed);}, 10000);
}

// Shortcuts
function simplifyWheelDelta(x, y) {
	if(x > y && y > -x) return "left";
	if(x > y) return "down";
	if(-x > y) return "right";
	return "up";
}

function testShortcut(event, shortcut) {
	if(event.type === "mousewheel") {
		if(simplifyWheelDelta(event.wheelDeltaX, event.wheelDeltaY) !== shortcut.direction) return false;
		for(var x in shortcut) {
			if(x !== "direction" && event[x] !== shortcut[x]) return false;
		}
	} else {
		for(var x in shortcut) {
			if(event[x] !== shortcut[x]) return false;
		}
	}
	event.preventDefault();
	event.stopPropagation();
	return true;
}

// Look for usable media fallback content
function hasMediaFallback(element) {
	var mediaElements = element.getElementsByTagName("video");
	if(mediaElements.length === 0) {
		mediaElements = element.getElementsByTagName("audio");
		if(mediaElements.length === 0) return false;
	}
	if(mediaElements[0].src) return true;
	var sourceElements = mediaElements[0].getElementsByTagName("source");
	for(var i = 0; i < sourceElements.length; i++) {
		if(mediaElements[0].canPlayType(sourceElements[i].type)) return true;
	}
	return false;
}

function getParams(element) {
	var params = {};
	// all attributes are passed to the plugin
	// FIXME?: only no-NS attributes should be considered
	for(var i = 0; i < element.attributes.length; i++) {
		params[element.attributes[i].name.toLowerCase()] = element.attributes[i].value;
	}
	// for objects, add (and overwrite with) param children
	if(element.nodeName.toLowerCase() === "object") {
		var paramElements = element.getElementsByTagName("param");
		for(var i = 0; i < paramElements.length; i++) {
			params[paramElements[i].name.toLowerCase()] = paramElements[i].value;
		}
	}
	return params;
}
