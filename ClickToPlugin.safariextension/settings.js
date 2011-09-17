"use strict";
var container = document.getElementById("container");
var main = document.getElementById("main");
var nav = document.getElementById("nav");
var tabs = nav.children;
var sections = document.getElementsByTagName("section");
var menus = document.getElementsByTagName("menu");

var clearShortcutButtons = document.getElementsByClassName("shortcut_clear");
var pluginInputs = document.getElementsByClassName("plugin");

// Bind tabs to sections
var currentTab = 0;

container.addEventListener("webkitTransitionEnd", function(event) {
	event.target.className = "";
	event.target.style.WebkitTransitionProperty = "none";
	event.target.style.height = "intrinsic";
}, false);

function switchToTab(i) {
	var oldHeight = main.offsetHeight + 20;
	container.style.height = oldHeight + "px";
	tabs[currentTab].className = "";
	tabs[i].className = "selected";
	container.className = "hidden";
	sections[currentTab].className = "";
	sections[i].className = "selected";
	currentTab = i;
	var newHeight = main.offsetHeight + 20;
	var heightDelta = newHeight - oldHeight;
	if(heightDelta < 0) heightDelta = -heightDelta;
	if(heightDelta === 0) {
		container.className = "";
		container.style.height = "intrinsic";
	} else {
		container.style.WebkitTransitionProperty = "height";
		container.style.WebkitTransitionDuration = (.001*heightDelta) + "s";
		container.style.height = newHeight + "px";
	}
	changeSetting("currentTab", i);
}

nav.addEventListener("click", function(event) {
	if(event.target.nodeName !== "SPAN") return;
	for(var i = 0; i < tabs.length; i++) {
		if(event.target === tabs[i].firstChild) {
			if(currentTab !== i) switchToTab(i);
			break;
		}
	}
}, false);

// Textareas
function resizeTextArea(textarea) {
	var height = textarea.value.split("\n").length*16;
	if(height > 176) height = 176;
	if(height < 48) height = 48;
	textarea.style.minHeight = height + "px";
}
function handleTextAreaInput(event) {
	event.target.value = event.target.value.replace(/[\t ]+/g, "\n");
	changeSetting(event.target.id, parseTextList(event.target.value));
	resizeTextArea(event.target);
}
function parseTextList(text) {
	var s = text.replace(/\n+/g, "\n").replace(/^\n/, "").replace(/\n$/, "");
	if(!s) return [];
	else return s.split("\n");
}
function handleKeyPressEvent(event) {
	if(event.target.nodeName !== "TEXTAREA") return;
	if(event.keyCode === 32) {
		event.preventDefault();
		var position = event.target.selectionStart;
		event.target.value = event.target.value.substr(0, position) + "\n" + event.target.value.substr(position);
		event.target.selectionEnd = position + 1;
		var e = document.createEvent("HTMLEvents");
		e.initEvent("input", true, true);
		event.target.dispatchEvent(e);
	}
}
main.addEventListener("keypress", handleKeyPressEvent, false);
main.addEventListener("input", function(event) {
	if(event.target.nodeName === "TEXTAREA" && event.target.id !== "additionalScripts") handleTextAreaInput(event);
}, false);
document.getElementById("additionalScripts").addEventListener("blur", handleTextAreaInput, false);

// Killer reset
var defaultKillers = "killers/YouTube.js\nkillers/Vimeo.js\nkillers/Dailymotion.js\nkillers/Facebook.js\nkillers/Break.js\nkillers/Blip.js\nkillers/Metacafe.js\nkillers/TED.js\nkillers/Tumblr.js\nkillers/Flash.js\nkillers/Silverlight.js\nkillers/Generic.js";
document.getElementById("reset_killers").addEventListener("click", function() {
	var textarea = document.getElementById("additionalScripts");
	textarea.value = defaultKillers;
	changeSetting("additionalScripts", parseTextList(defaultKillers));
	resizeTextArea(textarea);
}, false);

// Bind change event
function changeSetting(setting, value) {
	safari.self.tab.dispatchMessage("changeSetting", {"setting": setting, "value": value});
}

main.addEventListener("change", function(event) {
	// Settings dependencies
	switch(event.target.id) {
	case "invertWhitelists":
		updateWhitelistLabels(event.target.value === "on");
		break;
	case "invertBlacklists":
		updateBlacklistLabels(event.target.value === "on");
		break;
	case "showSourceSelector":
		document.getElementById("showPluginSourceItem").disabled = event.target.value !== "on";
		document.getElementById("showQTPSourceItem").disabled = event.target.value !== "on";
		document.getElementById("showSiteSourceItem").disabled = event.target.value !== "on";
		break;
	case "defaultPlayer":
		if(event.target.value === "html5") {
			document.getElementById("mediaAutoload").disabled = false;
		} else {
			document.getElementById("mediaAutoload").disabled = true;
			document.getElementById("mediaAutoload").checked = false;
			changeSetting("mediaAutoload", false);
		}
		break;
	}
	// Settings change
	if(!event.target.classList.contains("setting")) return;
	var parseValue;
	switch(event.target.nodeName) {
	case "SELECT":
		parseValue = function(value) {if(isNaN(parseInt(value))) return value; else return parseInt(value);}
		break;
	case "INPUT":
		switch(event.target.type) {
		case "range":
			parseValue = function(value) {return parseInt(value)*.01}
			break;
		case "checkbox":
			parseValue = function(value) {return value === "on";}
			break;
		}
		break;
	}
	changeSetting(event.target.id, parseValue(event.target.value));
}, false);

// Shortcuts input
var shortcutsMenu = document.getElementById("keyboard_shortcuts")
shortcutsMenu.addEventListener("keydown", function(event) {
	if(event.target.classList.contains("keyboard")) handleKeyboardEvent(event);
}, false);
shortcutsMenu.addEventListener("click", function(event) {
	if(event.target.classList.contains("shortcut_clear")) clearShortcut(event);
	else if(event.target.classList.contains("mouse")) handleClickEvent(event);
}, false);
shortcutsMenu.addEventListener("dblclick", function(event) {
	if(event.target.classList.contains("mouse")) handleClickEvent(event);
}, false);
shortcutsMenu.addEventListener("mousewheel", function(event) {
	if(event.target.classList.contains("mouse")) handleWheelEvent(event);
}, false);
function clearShortcut(event) {
	var textField = event.target.previousSibling.previousSibling;
	textField.value = "";
	changeSetting(textField.id, false);
	if(textField.id === "settingsShortcut") {
		document.getElementById("settingsContext").disabled = true;
		document.getElementById("settingsContext").checked = true;
		changeSetting("settingsContext", true);
	}
}
function handleKeyboardEvent(event) {
	event.preventDefault();
	event.stopPropagation();
	if(event.keyIdentifier === "Shift" || event.keyIdentifier === "Control" || event.keyIdentifier === "Alt" || event.keyIdentifier === "Meta") return;
	registerShortcut({"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "keyIdentifier": event.keyIdentifier}, event.target);
}
function handleClickEvent(event) {
	event.preventDefault();
	registerShortcut({"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "button": event.button}, event.target.previousSibling);
}
function handleWheelEvent(event) {
	event.preventDefault();
	registerShortcut({"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "direction": simplifyWheelDelta(event.wheelDeltaX, event.wheelDeltaY)}, event.target.previousSibling);
}
function registerShortcut(shortcut, input) {
	input.value = showShortcut(shortcut);
	changeSetting(input.id, shortcut);
	if(input.id === "settingsShortcut") document.getElementById("settingsContext").disabled = false;
}

// Shortcut display
function parseKeyID(keyID) {
	if(/^U\+/.test(keyID)) {
		var code = parseInt(keyID.substr(2), 16);
		switch(code) {
		case 8: return "\u232b";
		case 9: return "\u21e5";
		case 27: return "\u238b";
		case 32: return "[space]";
		case 127: return "\u2326";
		default: return String.fromCharCode(code);
		}
	}
	if(keyID.charAt(0) === "F") {
		return "[F" + keyID.substr(1) + "]";
	}
	switch(keyID) {
	case "Enter": return "\u2305";
	case "Left": return "\u2190";
	case "Up": return "\u2191";
	case "Right": return "\u2192";
	case "Down": return "\u2193";
	case "Home": return "\u2196";
	case "End": return "\u2198";
	case "PageUp": return "\u21de";
	case "PageDown": return "\u21df";
	case "CapsLock": return "\u21ea";
	case "Clear": return "\u2327";
	}
}
function simplifyWheelDelta(x, y) {
	if(x > y && y > -x) return "left";
	if(x > y) return "down";
	if(-x > y) return "right";
	return "up";
}
function showShortcut(shortcut) {
	if(!shortcut) return "";
	var prefix = (shortcut.shiftKey ? "\u21e7" : "") + (shortcut.ctrlKey ? "\u2303" : "") + (shortcut.altKey ? "\u2325" : "") + (shortcut.metaKey ? "\u2318" : "");
	if(shortcut.type === "keydown") return prefix + parseKeyID(shortcut.keyIdentifier);
	if(shortcut.type === "click") return prefix + "[click" + shortcut.button + "]";
	if(shortcut.type === "dblclick") return prefix + "[dblclick" + shortcut.button + "]";
	if(shortcut.type === "mousewheel") return prefix + "[wheel" + shortcut.direction + "]";
}

// Localization
function localizeSettings() {
	document.title = PREFERENCES_TITLE;
	var strings = document.getElementsByClassName("string");
	var options = document.getElementsByTagName("option");
	while(strings.length > 0) {
		strings[0].parentNode.replaceChild(document.createTextNode(window[strings[0].title]), strings[0]);
	}
	for(var i = 0; i < options.length; i++) {
		if(options[i].hasAttribute("title")) {
			options[i].appendChild(document.createTextNode(window[options[i].title]));
			options[i].removeAttribute("title");
		}
	}
	for(var i = 0; i < clearShortcutButtons.length; i++) {
		clearShortcutButtons[i].value = CLEAR_BUTTON;
	}
	document.getElementById("reset_killers").value = DEFAULT_KILLERS_BUTTON;
}
function updateWhitelistLabels(invert) {
	document.querySelector("[for=\"locationsWhitelist\"]").textContent = (invert ? BLOCK_LOCATIONS : ALLOW_LOCATIONS);
	document.querySelector("[for=\"sourcesWhitelist\"]").textContent = (invert ? BLOCK_SOURCES : ALLOW_SOURCES);
}
function updateBlacklistLabels(invert) {
	document.querySelector("[for=\"locationsBlacklist\"]").textContent = (invert ? SHOW_LOCATIONS : HIDE_LOCATIONS);
	document.querySelector("[for=\"sourcesBlacklist\"]").textContent = (invert ? SHOW_SOURCES : HIDE_SOURCES);
}

// List of plugins
function buildPluginMenu() {
	var pluginMenu = document.getElementById("plug-ins");
	pluginMenu.addEventListener("change", function() {
		changeSetting("allowedPlugins", checkedPlugins());
	}, false);
	var span = pluginMenu.children[0].children[0];
	if(navigator.plugins.length === 0) {
		span.textContent = NO_PLUGINS_NOTICE;
		return;
	}
	span.textContent = ALLOW_THESE_PLUGINS;
	var plugins = Array.prototype.slice.call(navigator.plugins, 0).sort(function(p, q) {
		p = p.name.toLowerCase();
		q = q.name.toLowerCase();
		if(p < q) return -1;
		if(p > q) return 1;
		return 0;
	});
	for(var i = 0; i < plugins.length; i++) {
		var li = document.createElement("li");
		var span = document.createElement("span");
		span.className = "checkbox sub";
		span.title = PLUGIN_FILENAME(plugins[i].filename) + "\n" + PLUGIN_DESCRIPTION(plugins[i].description);
		span.innerHTML = "<input class=\"plugin\" type=\"checkbox\"><label></label>";
		span.firstChild.id = "plugin/" + plugins[i].filename;
		span.lastChild.htmlFor = "plugin/" + plugins[i].filename;
		span.lastChild.textContent = plugins[i].name;
		li.appendChild(span);
		pluginMenu.appendChild(li);
	}
}
function checkedPlugins() {
	var array = [];
	for(var i = 0; i < pluginInputs.length; i++) {
		if(pluginInputs[i].checked) array.push(pluginInputs[i].id.substr(7));
	}
	return array;
}

// Adjust layout
function adjustLayout() {
	var minWidth = 20;
	for(var i = 0; i < tabs.length; i++) {
		minWidth += tabs[i].offsetWidth;
	}
	nav.style.minWidth = minWidth + "px";
	main.style.maxHeight = (.85*document.body.offsetHeight - 20) + "px";

	var stylesheet = document.getElementsByTagName("style")[0].sheet;
	for(var i = 0; i < PREFERENCES_LAYOUT.length; i++) {
		stylesheet.insertRule(PREFERENCES_LAYOUT[i], 0);
	}
	for(var i = 0; i < menus.length; i++) {
		var usedWidth = 20;
		if(menus[i].className === "two_column") usedWidth += 21 + menus[i].children[0].children[0].offsetWidth;
		stylesheet.insertRule("#" + menus[i].id + " .checkbox{max-width:" + (nav.offsetWidth - usedWidth) + "px;}", 0);
	}
}

// Load settings
function loadSettings(event) {
	if(event.name !== "CTPsettings") return;
	var settings = event.message;
	
	// Localize
	localize(PREFERENCES_STRINGS, settings.language);
	delete settings.language;
	localizeSettings();
	updateWhitelistLabels(settings.invertWhitelists);
	updateBlacklistLabels(settings.invertBlacklists);
	
	// Plugins
	buildPluginMenu();
	if(navigator.plugins.length > 0) {
		for(var i = 0; i < settings.allowedPlugins.length; i++) {
			var input = document.getElementById("plugin/" + settings.allowedPlugins[i]);
			if(input) input.checked = true;
			else {settings.allowedPlugins.splice(i, 1); --i;}
		}
		changeSetting("allowedPlugins", settings.allowedPlugins);
	}
	delete settings.allowedPlugins;
	
	// Adjust Layout
	adjustLayout();
	
	// Set current tab
	tabs[settings.currentTab].className = "selected";
	sections[settings.currentTab].className = "selected";
	currentTab = settings.currentTab;
	delete settings.currentTab;
	
	// Other settings
	for(var id in settings) {
		var input = document.getElementById(id);
		if(!input) continue; // to be removed
		switch(input.nodeName) {
		case "TEXTAREA":
			input.value = settings[id].join("\n");
			resizeTextArea(input);
			break;
		case "SELECT":
			var options = input.getElementsByTagName("option");
			for(var i = 0; i < options.length; i++) {
				options[i].selected = options[i].value === settings[id] + "";
			}
			break;
		case "INPUT":
			switch(input.type) {
			case "range":
				input.value = settings[id]*100;
				break;
			case "text":
				input.value = showShortcut(settings[id]);
				break;
			case "checkbox":
				if(settings[id]) input.checked = true;
				break;
			}
			break;
		}
	}
	
	// Dependencies
	if(!settings.showSourceSelector) {
		document.getElementById("showPluginSourceItem").disabled = true;
		document.getElementById("showQTPSourceItem").disabled = true;
		document.getElementById("showSiteSourceItem").disabled = true;
	}
	if(settings.defaultPlayer !== "html5") document.getElementById("mediaAutoload").disabled = true;
	if(!settings.settingsShortcut) document.getElementById("settingsContext").disabled = true;
	
	// Intercept Cmd+W & pref-pane shortcut to close the pref pane
	if(window !== top) {
		document.addEventListener("keydown", function(event) {
			if((event.keyIdentifier === "U+0057" && event.metaKey === true && event.altKey === false && event.ctrlKey === false && event.shiftKey === false) || (settings.settingsShortcut && event.keyIdentifier === settings.settingsShortcut.keyIdentifier && event.metaKey === settings.settingsShortcut.metaKey && event.altKey === settings.settingsShortcut.altKey && event.ctrlKey === settings.settingsShortcut.ctrlKey && event.shiftKey === settings.settingsShortcut.shiftKey)) {
				event.preventDefault();
				safari.self.tab.dispatchMessage("hideSettings", "");
			}
		}, false);
	}
	
	focus();
	
	// Show settings pane
	container.className = "";
}

container.addEventListener("click", function(event) {event.stopPropagation();}, false);
document.body.addEventListener("click", function(event) {
	safari.self.tab.dispatchMessage("hideSettings", "");
}, false);

safari.self.addEventListener("message", loadSettings, false);
safari.self.tab.dispatchMessage("getSettings", "");
