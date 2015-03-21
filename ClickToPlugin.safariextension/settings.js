"use strict";
var container = document.getElementById("container");
var main = document.getElementById("main");
var nav = document.getElementById("nav");
var tabs = nav.children;
var sections = document.getElementsByTagName("section");
var menus = document.getElementsByTagName("menu");

var shortcutInputs = document.getElementsByClassName("shortcut");
var clearShortcutButtons = document.getElementsByClassName("shortcut_clear");
var pluginInputs = document.getElementsByClassName("plugin");

// Bind tabs to sections
var currentTab;

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
		container.style.WebkitTransitionDuration = (.0008*heightDelta) + "s";
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
		event.target.value = event.target.value.substring(0, position) + "\n" + event.target.value.substring(position);
		event.target.selectionEnd = position + 1;
		var e = document.createEvent("HTMLEvents");
		e.initEvent("input", true, true);
		event.target.dispatchEvent(e);
	}
}
main.addEventListener("keypress", handleKeyPressEvent, false);
main.addEventListener("input", function(event) {
	if(event.target.nodeName !== "TEXTAREA") return;
	handleTextAreaInput(event);
	if(event.target.id === "killers") updatedKillers = true; // we only update killers when settings are closed
	else changeSetting(event.target.id, parseTextList(event.target.value));
}, false);
var updatedKillers = false;

// Killer reset
var defaultKillers = "killers/YouTube.js\nkillers/Dailymotion.js\nkillers/Facebook.js\nkillers/Blip.js\nkillers/Metacafe.js\nkillers/TED.js\nkillers/MTVNetworks.js\nkillers/BBC.js\nkillers/Brightcove.js\nkillers/NYTimes.js\nkillers/Flash.js\nkillers/Silverlight.js\nkillers/Generic.js";
document.getElementById("reset_killers").addEventListener("click", function() {
	var textarea = document.getElementById("killers");
	textarea.value = defaultKillers;
	changeSetting("killers", parseTextList(defaultKillers));
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
		updateWhitelistLabels(event.target.checked);
		break;
	case "invertBlacklists":
		updateBlacklistLabels(event.target.checked);
		break;
	case "defaultPlayer":
		if(event.target.value === "html5") {
			document.getElementById("mediaAutoload").disabled = false;
		} else {
			document.getElementById("mediaAutoload").disabled = true;
			document.getElementById("mediaAutoload").checked = false;
			document.getElementById("showPoster").disabled = false;
			changeSetting("mediaAutoload", false);
		}
		break;
	case "mediaAutoload":
		document.getElementById("showPoster").disabled = event.target.checked;
		break;
	}
	// Settings change
	if(!event.target.classList.contains("setting")) return;
	var value;
	switch(event.target.nodeName) {
	case "SELECT":
		value = parseInt(event.target.value);
		if(isNaN(value)) value = event.target.value;
		break;
	case "INPUT":
		switch(event.target.type) {
		case "checkbox":
			value = event.target.checked;
			break;
		case "text":
		case "password":
			value = event.target.value;
			break;
		case "range":
			value = parseInt(event.target.value)*.01;
			break;
		}
		break;
	}
	changeSetting(event.target.id, value);
}, false);

// Shortcuts input
var keys = {};
var gestures = {};
var shortcutsMenu = document.getElementById("keyboard_shortcuts");

shortcutsMenu.addEventListener("keydown", function(event) {
	if(event.target.classList.contains("shortcut")) handleKeyboardEvent(event);
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

function handleKeyboardEvent(event) {
	event.preventDefault();
	event.stopPropagation();
	if(event.keyIdentifier === "Shift" || event.keyIdentifier === "Control" || event.keyIdentifier === "Alt" || event.keyIdentifier === "Meta") return;
	keys[event.target.id] = {"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "keyIdentifier": event.keyIdentifier};
	displayShortcut(event.target.id);
	changeSetting("keys", keys);
}
function handleClickEvent(event) {
	event.preventDefault();
	gestures[event.target.previousSibling.id] = {"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "button": event.button};
	displayShortcut(event.target.previousSibling.id);
	changeSetting("gestures", gestures);
}
function handleWheelEvent(event) {
	event.preventDefault();
	gestures[event.target.previousSibling.id] = {"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "direction": simplifyWheelDelta(event.wheelDeltaX, event.wheelDeltaY)};
	displayShortcut(event.target.previousSibling.id);
	changeSetting("gestures", gestures);
}
function clearShortcut(event) {
	var input = event.target.previousSibling.previousSibling;
	var id = input.id;
	input.value = "";
	if(keys[id]) {
		keys[id] = false;
		changeSetting("keys", keys);
	}
	if(gestures[id]) {
		gestures[id] = false;
		changeSetting("gestures", gestures);
	}
}

// Shortcut display
function parseKeyID(keyID) {
	if(/^U\+/.test(keyID)) {
		var code = parseInt(keyID.substring(2), 16);
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
		return "[F" + keyID.substring(1) + "]";
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
function shortcutAsString(shortcut) {
	if(!shortcut) return "";
	var prefix = (shortcut.shiftKey ? "\u21e7" : "") + (shortcut.ctrlKey ? "\u2303" : "") + (shortcut.altKey ? "\u2325" : "") + (shortcut.metaKey ? "\u2318" : "");
	if(shortcut.type === "keydown") return prefix + parseKeyID(shortcut.keyIdentifier);
	if(shortcut.type === "click") return prefix + "[click" + shortcut.button + "]";
	if(shortcut.type === "dblclick") return prefix + "[dblclick" + shortcut.button + "]";
	if(shortcut.type === "mousewheel") return prefix + "[wheel" + shortcut.direction + "]";
}
function displayShortcut(id) {
	var s = "";
	if(keys[id]) {
		s += shortcutAsString(keys[id]);
		if(gestures[id]) s += ", ";
	}
	if(gestures[id]) s += shortcutAsString(gestures[id]);
	document.getElementById(id).value = s;
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
function buildPluginMenu(plugins) {
	var pluginMenu = document.getElementById("plug-ins");
	pluginMenu.addEventListener("change", function() {
		changeSetting("allowedPlugins", checkedPlugins());
	}, false);
	var span = pluginMenu.children[0].children[0];
	if(plugins.length === 0) {
		span.textContent = NO_PLUGINS_NOTICE;
		return;
	}
	span.textContent = ALLOW_THESE_PLUGINS;
	plugins.sort(function(p, q) {
		p = p.name.toLowerCase();
		q = q.name.toLowerCase();
		if(p < q) return -1;
		if(p > q) return 1;
		return 0;
	});
	for(var i = 0; i < plugins.length; i++) {
		if(!plugins[i].filename) continue; // internal WebKit plugin
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
		if(pluginInputs[i].checked) array.push(pluginInputs[i].id.substring(7));
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
	main.style.maxHeight = (document.body.offsetHeight - 80) + "px";

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
	var settings = event.message.settings;
	var plugins = event.message.plugins;
	
	// Localize
	localize(PREFERENCES_STRINGS, settings.language);
	delete settings.language;
	localizeSettings();
	updateWhitelistLabels(settings.invertWhitelists);
	updateBlacklistLabels(settings.invertBlacklists);
	
	// Plugins
	buildPluginMenu(plugins);
	if(plugins.length > 0 && settings.allowedPlugins.length > 0) {
		for(var i = 0; i < settings.allowedPlugins.length; i++) {
			var input = document.getElementById("plugin/" + settings.allowedPlugins[i]);
			if(input) input.checked = true;
			else settings.allowedPlugins.splice(i--, 1);
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
	
	// Shortcuts
	keys = settings.keys;
	delete settings.keys;
	gestures = settings.gestures;
	delete settings.gestures;
	for(var i = 0; i < shortcutInputs.length; i++) displayShortcut(shortcutInputs[i].id);
	
	// Other settings
	for(var id in settings) {
		var input = document.getElementById(id);
		if(!input) {
			changeSetting(id, undefined);
			continue;
		}
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
			case "password":
				if(settings[id]) input.value = settings[id];
				break;
			case "checkbox":
				if(settings[id]) input.checked = true;
				break;
			}
			break;
		}
	}
	
	// Dependencies
	if(settings.defaultPlayer !== "html5") document.getElementById("mediaAutoload").disabled = true;
	else if(settings.mediaAutoload) document.getElementById("showPoster").disabled = true;
	
	// Intercept Cmd+W & pref-pane shortcut to close the pref pane
	if(window !== top) {
		document.addEventListener("keydown", function(event) {
			if((event.keyIdentifier === "U+0057" && event.metaKey === true && event.altKey === false && event.ctrlKey === false && event.shiftKey === false) || (keys.prefPane && event.keyIdentifier === keys.prefPane.keyIdentifier && event.metaKey === keys.prefPane.metaKey && event.altKey === keys.prefPane.altKey && event.ctrlKey === keys.prefPane.ctrlKey && event.shiftKey === keys.prefPane.shiftKey)) {
				event.preventDefault();
				safari.self.tab.dispatchMessage("hideSettings", "");
			}
		}, false);
	}
	
	var handleClose = function() {
		if(updatedKillers) changeSetting("killers", parseTextList(document.getElementById("killers").value));
	}
	window.addEventListener("beforeunload", handleClose, true); // when tab is closed
	window.addEventListener("pagehide", handleClose, true); // when iframe is removed
	
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
