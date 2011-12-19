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
	setTimeout(function() {document.body.removeChild(embed);}, 5000);
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
	embed.setAttribute("width", "0");
	embed.setAttribute("height", "0");
	// need an external URL for source, since QT plugin doesn't accept safari-extension:// protocol
	// Apple has a small 1px image for this same purpose
	embed.setAttribute("src", "http://images.apple.com/apple-events/includes/qtbutton.mov");
	embed.setAttribute("href", url);
	embed.setAttribute("target", "quicktimeplayer");
	embed.setAttribute("autohref", "autohref");
	document.body.appendChild(embed);
	setTimeout(function() {document.body.removeChild(embed);}, 5000);
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
