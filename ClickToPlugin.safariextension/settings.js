var container = document.getElementById("container");
var main = document.getElementById("main");
var nav = document.getElementById("nav");
var tabs = nav.children;
var sections = document.getElementsByTagName("section");
var menus = document.getElementsByTagName("menu");

var inputs = document.getElementsByClassName("setting");
var numberInputs = document.getElementsByClassName("number");
var keyboardInputs = document.getElementsByClassName("keyboard");
var mouseInputs = document.getElementsByClassName("mouse");
var textareas = document.getElementsByTagName("textarea");
var clearShortcutButtons = document.getElementsByClassName("shortcut_clear");
var pluginInputs = document.getElementsByClassName("plugin");
var killerInputs = document.getElementsByClassName("killer");

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
    changeSetting("defaultTab", i);
}

function bindTab(i) {
    tabs[i].firstChild.addEventListener("click", function(event) {
        if(currentTab !== i) switchToTab(i);
    }, false);
}
for(var i = 0; i < tabs.length; i++) {
    bindTab(i);
}

// Control lists
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
for(var i = 0; i < textareas.length; i++) {
    textareas[i].addEventListener("keypress", function(event) {
        if(event.keyCode === 32) {
            event.preventDefault();
            var position = event.target.selectionStart;
            event.target.value = event.target.value.substr(0, position) + "\n" + event.target.value.substr(position);
            event.target.selectionEnd = position + 1;
            var e = document.createEvent("HTMLEvents");
            e.initEvent("input", true, true);
            event.target.dispatchEvent(e);
        }
    }, false);
    
    textareas[i].addEventListener("input", handleTextAreaInput, false);
}

// Killer reset
var defaultKillers = "killers/YouTube.js\nkillers/Vimeo.js\nkillers/Dailymotion.js\nkillers/Facebook.js\nkillers/Break.js\nkillers/Blip.js\nkillers/Metacafe.js\nkillers/TED.js\nkillers/Tumblr.js\nkillers/Flash.js\nkillers/Silverlight.js\nkillers/QuickTime.js\nkillers/WindowsMedia.js\nkillers/DivX.js";
document.getElementById("reset_killers").addEventListener("click", function() {
    var textarea = document.getElementById("additionalScripts");
    textarea.value = defaultKillers;
    changeSetting("additionalScripts", parseTextList(defaultKillers));
    resizeTextArea(textarea);
}, false);

// Bind 'change' events
function changeSetting(setting, value) {
    safari.self.tab.dispatchMessage("changeSetting", {"setting": setting, "value": value});
}

for(var i = 0; i < inputs.length; i++) {
    bindChangeEvent(inputs[i]);
}
function bindChangeEvent(input) {
    var parseValue;
    switch(input.nodeName) {
        case "SELECT":
            parseValue = function(value) {if(isNaN(parseInt(value))) return value; else return parseInt(value);}
            break;
        case "INPUT":
            switch(input.type) {
                case "range":
                    parseValue = function(value) {return parseInt(value)*.01}
                    break;
                case "checkbox":
                    parseValue = function(value) {return value === "on";}
                    break;
                case "text":
                    parseValue = function(value) {return value;}
                    break;
            }
            break;
    }
    
    input.addEventListener("change", function(event) {
        changeSetting(event.target.id, parseValue(event.target.value));
    }, false);
}

document.getElementById("invertWhitelists").addEventListener("change", function(event) {
    updateWhitelistLabels(event.target.value === "on");
}, false);
document.getElementById("invertBlacklists").addEventListener("change", function(event) {
    updateBlacklistLabels(event.target.value === "on");
}, false);

function handleNumberInput(event) {
    var value = event.target.value;
    if(/\d+/.test(value)) changeSetting(event.target.id, parseInt(value));
}
for(var i = 0; i < numberInputs.length; i++) {
    numberInputs[i].addEventListener("input", handleNumberInput, false);
}

// Shortcuts input
for(var i = 0; i < keyboardInputs.length; i++) {
    keyboardInputs[i].addEventListener("keydown", handleKeyboardEvent, false);
    clearShortcutButtons[i].addEventListener("click", clearShortcut, false);
}
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

for(var i = 0; i < mouseInputs.length; i++) {
    mouseInputs[i].addEventListener("click", handleClickEvent, false);
    mouseInputs[i].addEventListener("dblclick", handleClickEvent, false);
    mouseInputs[i].addEventListener("mousewheel", handleWheelEvent, false);
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

// Bind settings dependencies
document.getElementById("showSourceSelector").addEventListener("change", function(event) {
    document.getElementById("showPluginSourceItem").disabled = event.target.value !== "on";
    document.getElementById("showQTPSourceItem").disabled = event.target.value !== "on";
}, false);
document.getElementById("defaultPlayer").addEventListener("change", function(event) {
    if(this.value === "html5") {
        document.getElementById("mediaAutoload").disabled = false;
        var e = document.createEvent("HTMLEvents");
        e.initEvent("change", false, false);
        document.getElementById("mediaAutoload").dispatchEvent(e);
    } else {
        document.getElementById("mediaAutoload").disabled = true;
        document.getElementById("mediaAutoload").checked = false;
        changeSetting("mediaAutoload", false);
        document.getElementById("showPoster").disabled = false;
        document.getElementById("showMediaTooltip").disabled = false;
    }
}, false);
document.getElementById("mediaAutoload").addEventListener("change", function(event) {
    document.getElementById("showPoster").disabled = event.target.value === "on";
    document.getElementById("showMediaTooltip").disabled = event.target.value === "on";
}, false);
document.getElementById("downloadContext").addEventListener("change", function(event) {
    document.getElementById("useDownloadManager").disabled = event.target.value !== "on";
}, false);

// Localization
function localizeSettings() {
    document.title = PREFERENCES_TITLE;
    var strings = document.getElementsByClassName("string");
    var splitstrings = document.getElementsByClassName("splitstring");
    var options = document.getElementsByTagName("option");
    while(strings.length > 0) {
        strings[0].parentNode.replaceChild(document.createTextNode(this[strings[0].title]), strings[0]);
    }
    while(splitstrings.length > 0) {
        var s = splitstrings[0];
        s.parentNode.insertBefore(document.createTextNode(this[s.title][0]), s);
        for(var i = 1; i < this[s.title].length; i++) {
            s.parentNode.insertBefore(s.childNodes[i-1], s);
            s.parentNode.insertBefore(document.createTextNode(this[s.title][i]), s);
        }
        s.parentNode.removeChild(s);
    }
    for(var i = 0; i < options.length; i++) {
        if(options[i].hasAttribute("title")) {
            options[i].appendChild(document.createTextNode(this[options[i].title]));
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
        span.title = PLUGIN_FILENAME + ": " + plugins[i].filename + "\n" + PLUGIN_DESCRIPTION + ": " + plugins[i].description;
        span.innerHTML = "<input class=\"plugin\" type=\"checkbox\"><label></label></span>";
        span.childNodes[0].id = "plugin/" + plugins[i].filename;
        span.childNodes[0].addEventListener("change", function(event) {
            changeSetting("allowedPlugins", checkedPlugins());
        }, false);
        span.childNodes[1].htmlFor = "plugin/" + plugins[i].filename;
        span.childNodes[1].textContent = plugins[i].name;
        li.appendChild(span);
        pluginMenu.appendChild(li);
    }
}
function checkedPlugins() {
    var array = new Array();
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
    if(event.name !== "settings") return;
    var settings = event.message;
    
    // Localize
    localize(PREFERENCES_STRINGS, settings.language);
    delete settings.language;
    localizeSettings();
    updateWhitelistLabels(settings.invertWhitelists);
    updateBlacklistLabels(settings.invertBlacklists);
    
    // Set current tab
    tabs[settings.defaultTab].className = "selected";
    sections[settings.defaultTab].className = "selected";
    currentTab = settings.defaultTab;
    delete settings.defaultTab;
    
    // Plugins
    buildPluginMenu();
    for(var i = 0; i < settings.allowedPlugins.length; i++) {
        var input = document.getElementById("plugin/" + settings.allowedPlugins[i]);
        if(input) input.checked = true;
        else {settings.allowedPlugins.splice(i, 1); --i;}
    }
    changeSetting("allowedPlugins", settings.allowedPlugins);
    delete settings.allowedPlugins;
    
    // Adjust Layout
    adjustLayout();
    
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
                    case "number":
                        input.value = settings[id];
                        break;
                    case "text":
                        if(input.className === "keyboard") input.value = showShortcut(settings[id]);
                        else input.value = settings[id];
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
    }
    if(settings.defaultPlayer !== "html5") document.getElementById("mediaAutoload").disabled = true;
    if(settings.mediaAutoload) {
        document.getElementById("showPoster").disabled = true;
        document.getElementById("showMediaTooltip").disabled = true;
    }
    if(!settings.settingsShortcut) document.getElementById("settingsContext").disabled = true;
    
    // Intercept Cmd+W & pref-pane shortcut to close the pref pane
    if(window !== window.top) {
        document.addEventListener("keydown", function(event) {
            if((event.keyIdentifier === "U+0057" && event.metaKey === true && event.altKey === false && event.ctrlKey === false && event.shiftKey === false) || (settings.settingsShortcut && event.keyIdentifier === settings.settingsShortcut.keyIdentifier && event.metaKey === settings.settingsShortcut.metaKey && event.altKey === settings.settingsShortcut.altKey && event.ctrlKey === settings.settingsShortcut.ctrlKey && event.shiftKey === settings.settingsShortcut.shiftKey)) {
                event.preventDefault();
                safari.self.tab.dispatchMessage("hideSettings", "");
            }
        }, false);
    }
    
    window.focus();
    
    // Show settings pane
    container.className = "";
}

container.addEventListener("click", function(event) {event.stopPropagation();}, false);
document.body.addEventListener("click", function(event) {
    safari.self.tab.dispatchMessage("hideSettings", "");
}, false);

safari.self.addEventListener("message", loadSettings, false);
safari.self.tab.dispatchMessage("getSettings", "");
