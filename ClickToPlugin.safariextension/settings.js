
var inputs = document.getElementsByClassName("setting");
var keyboardInputs = document.getElementsByClassName("keyboard");
var mouseInputs = document.getElementsByClassName("mouse");
var clearShortcutButtons = document.getElementsByClassName("shortcut_clear");
var pluginInputs = document.getElementsByClassName("plugin");
var killerInputs = document.getElementsByClassName("killer");

// Localization
document.title = CTP_PREFERENCES;
var strings = document.getElementsByClassName("string");
var options = document.getElementsByTagName("option");
while(strings.length > 0) {
    strings[0].parentNode.replaceChild(document.createTextNode(this[strings[0].title]), strings[0]);
}
for(var i = 0; i < options.length; i++) {
    if(options[i].hasAttribute("title")) {
        options[i].appendChild(document.createTextNode(this[options[i].title]));
        options[i].removeAttribute("title");
    }
}
document.getElementById("killers_toggle").value = TOGGLE_BUTTON;
document.getElementById("killers_all").value = SELECT_ALL_BUTTON;
for(var i = 0; i < clearShortcutButtons.length; i++) {
    clearShortcutButtons[i].value = CLEAR_BUTTON;
}

// Bind tabs to sections
var tabs = document.getElementsByTagName("nav")[0].children[0].children;
var sections = document.getElementsByTagName("section");
var currentSection = 0;
tabs[0].className = "selected";
sections[0].className = "selected";

function bindTab(i) {
    tabs[i].firstChild.addEventListener("click", function() {
        sections[currentSection].className = "";
        tabs[currentSection].className = "";
        sections[i].className = "selected";
        tabs[i].className = "selected";
        currentSection = i;
    }, false);
}
for(var i = 0; i < tabs.length; i++) {
    bindTab(i);
}


// Remove volume slider setting in WebKit nightlies
if(/\+/.test(navigator.appVersion)) {
    document.getElementById("showVolumeSlider").parentNode.parentNode.style.display = "none";
}

// Plugins list
var pluginList = sections[0].getElementsByTagName("menu")[0];
if(navigator.plugins.length === 0) {
    pluginList.innerHTML = "<li><span>" + NO_PLUGINS_NOTICE + "</span></li>";
} else {
    for(var i = 0; i < navigator.plugins.length || i < 2; i++) {
        var li = document.createElement("li");
        var title = "";
        li.innerHTML = "<span class=\"left\">" + (i === 0 ? (ALLOW_THESE_PLUGINS + ":") : i === 1 ? "<input id=\"plugins_reset\" type=\"button\" value=\"" + DESELECT_ALL_BUTTON + "\"/><input id=\"plugins_toggle\" type=\"button\" value=\"" + TOGGLE_BUTTON + "\"/>" : "") + "</span><span class=\"right\">" + (navigator.plugins[i] ? ("<input id=\"plugin" + i + "\" class=\"plugin\" type=\"checkbox\"/><label for=\"plugin" + i + "\"></label>") : "") + "</span>";
        if(navigator.plugins[i]) {
            li.childNodes[1].title = PLUGIN_FILENAME + ": " + navigator.plugins[i].filename + "\n" + PLUGIN_DESCRIPTION + ": " + navigator.plugins[i].description;
            li.childNodes[1].childNodes[1].textContent = navigator.plugins[i].name;
        }
        pluginList.appendChild(li);
    }
    document.getElementById("plugins_toggle").addEventListener("click", function() {
        for(var i = 0; i < pluginInputs.length; i++) {
            pluginInputs[i].checked ^= true;
        }
        changeSetting("allowedPlugins", checked(pluginInputs));
    }, false);
    document.getElementById("plugins_reset").addEventListener("click", function() {
        for(var i = 0; i < pluginInputs.length; i++) {
            pluginInputs[i].checked = false;
        }
        changeSetting("allowedPlugins", checked(pluginInputs));
    }, false);
}

// Killers list
document.getElementById("killers_toggle").addEventListener("click", function() {
    for(var i = 0; i < killerInputs.length; i++) {
        killerInputs[i].checked ^= true;
    }
    changeSetting("enabledKillers", checked(killerInputs));
}, false);
document.getElementById("killers_all").addEventListener("click", function() {
    for(var i = 0; i < killerInputs.length; i++) {
        killerInputs[i].checked = true;
    }
    changeSetting("enabledKillers", checked(killerInputs));
}, false);


// Control lists
var auxDiv = document.createElement("div");
auxDiv.id = "aux";
document.body.appendChild(auxDiv);

function resizeTextArea(textarea) {
    auxDiv.textContent = textarea.value;
    auxDiv.innerHTML = auxDiv.innerHTML.replace(/\n/g, "<br/>");
    var height = textarea.value.split("\n").length*16 + 15;
    var width = auxDiv.offsetWidth + 16;
    if(height > 175) height = 175;
    if(height < 47) height = 47;
    if(width > document.body.firstChild.offsetWidth - 350) width = document.body.firstChild.offsetWidth - 350;
    if(width < 300) width = 300
    textarea.style.minHeight = height + "px";
    textarea.style.minWidth = width + "px";
}

var textareas = document.getElementsByTagName("textarea");
function handleTextAreaInput(event) {
    event.target.value = event.target.value.replace(/[\t ]+/g, "\n");
    resizeTextArea(event.target);
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
    textareas[i].addEventListener("focus", handleTextAreaInput, false);
    //textareas[i].addEventListener("change", function(event) {auxDiv.innerHTML = "";}, false);
}


// Bind 'change' events
function changeSetting(setting, value) {
    safari.self.tab.dispatchMessage("changeSetting", {"setting": setting, "value": value});
}

for(var i = 0; i < inputs.length; i++) {
    bindChangeEvent(inputs[i]);
}

function bindChangeEvent(input) {
    var parseValue;
    var eventType = "change";
    switch(input.nodeName) {
        case "TEXTAREA":
            parseValue = function(value) {
                var s = value.replace(/\n+/g, "\n").replace(/^\n/, "").replace(/\n$/, "");
                if(!s) return [];
                else return s.split("\n");
            }
            break;
        case "SELECT":
            parseValue = function(value) {if(isNaN(parseInt(value))) return value; else return parseInt(value);}
            break;
        case "INPUT":
            switch(input.type) {
                case "range":
                    parseValue = function(value) {return parseInt(value)*.01}
                    break;
                case "number":
                    parseValue = function(value) {return isNaN(parseInt(value)) ? 8 : parseInt(value);};
                    eventType = "blur";
                    break;
                case "checkbox":
                    parseValue = function(value) {return value === "on";}
                    break;
            }
            break;
    }
    
    input.addEventListener(eventType, function(event) {
        changeSetting(event.target.id, parseValue(event.target.value));
    }, false);
}
for(var i = 0; i < pluginInputs.length; i++) {
    pluginInputs[i].addEventListener("change", function(event) {
        changeSetting("allowedPlugins", checked(pluginInputs));
    }, false);
}
for(var i = 0; i < killerInputs.length; i++) {
    killerInputs[i].addEventListener("change", function(event) {
        changeSetting("enabledKillers", checked(killerInputs));
    }, false);
}

// Shortcuts input
for(var i = 0; i < keyboardInputs.length; i++) {
    keyboardInputs[i].addEventListener("keydown", handleKeyboardEvent, false);
    clearShortcutButtons[i].addEventListener("click", function(event) {
        var textField = event.target.previousSibling.previousSibling;
        textField.value = "";
        changeSetting(textField.id, null);
    }, false);
}
function handleKeyboardEvent(event) {
    event.preventDefault();
    if(event.keyIdentifier === "Shift" || event.keyIdentifier === "Control" || event.keyIdentifier === "Alt" || event.keyIdentifier === "Meta") return;
    registerShortcut({"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "keyIdentifier": event.keyIdentifier}, event.target);
}



for(var i = 0; i < mouseInputs.length; i++) {
    mouseInputs[i].addEventListener("click", handleClickEvent, false);
    mouseInputs[i].addEventListener("dblclick", handleClickEvent, false);
    mouseInputs[i].addEventListener("mousewheel", handleWheelEvent, false);
    /*mouseInputs[i].addEventListener("contextmenu", function(event) {
        event.preventDefault();
        var e = document.createEvent("MouseEvents");
        e.initMouseEvent("click", false, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        _this.mediaElement.dispatchEvent(e);
    }, false);*/
}
function handleClickEvent(event) {
    event.preventDefault();
    registerShortcut({"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "button": event.button}, event.target.previousSibling);
}
function handleWheelEvent(event) { // only works for "click"-wheels
    event.preventDefault();
    registerShortcut({"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "direction": simplifyWheelDelta(event.wheelDeltaX, event.wheelDeltaY)}, event.target.previousSibling);
}
function registerShortcut(shortcut, input) {
    input.value = showShortcut(shortcut)
    changeSetting(input.id, shortcut);
}

function simplifyWheelDelta(x, y) {
    if(x > y && y > -x) return "left";
    if(x > y) return "down";
    if(-x > y) return "right";
    return "up";
}

function checked(inputList) {
    var array = new Array();
    for(var i = 0; i < inputList.length; i++) {
        if(inputList[i].checked) array.push(i);
    }
    return array;
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
        document.getElementById("showPoster").disabled = false;
        document.getElementById("showMediaTooltip").disabled = false;
    }
}, false);
document.getElementById("mediaAutoload").addEventListener("change", function(event) {
    document.getElementById("preload").disabled = event.target.value === "";
    document.getElementById("showPoster").disabled = event.target.value === "on";
    document.getElementById("showMediaTooltip").disabled = event.target.value === "on";
}, false);

// Shortcut display
function parseKeyID(keyID) {
    if(/^U\+/.test(keyID)) {
        var code = parseInt(keyID.substr(2), 16);
        switch(code) {
            case 8: return "\u232b";
            case 9: return "\u21e5";
            case 27: return "\u238b";
            case 32: return "\u2423";
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

function showShortcut(shortcut) {
    if(!shortcut) return "";
    var prefix = (shortcut.shiftKey ? "\u21e7" : "") + (shortcut.ctrlKey ? "\u2303" : "") + (shortcut.altKey ? "\u2325" : "") + (shortcut.metaKey ? "\u2318" : "");
    if(shortcut.type === "keydown") return prefix + parseKeyID(shortcut.keyIdentifier);
    if(shortcut.type === "click") return prefix + "[click" + shortcut.button + "]";
    if(shortcut.type === "dblclick") return prefix + "[dblclick" + shortcut.button + "]";
    if(shortcut.type === "mousewheel") return prefix + "[wheel" + shortcut.direction + "]";
}

// Load settings
function loadSettings(event) {
    if(event.name !== "settings") return;
    var settings = event.message;
    for(var i = 0; i < settings.allowedPlugins.length; i++) {
        document.getElementById("plugin" + settings.allowedPlugins[i]).checked = true;
    }
    for(var i = 0; i < settings.enabledKillers.length; i++) {
        document.getElementById("killer" + settings.enabledKillers[i]).checked = true;
    }
    delete settings.allowedPlugins;
    delete settings.enabledKillers;
    for(var id in settings) {
        var input = document.getElementById(id);
        if(!input) continue; // to be removed
        switch(input.nodeName) {
            case "TEXTAREA":
                var rows = settings[id].length;
                if(rows < 2) rows = 2;
                input.rows = rows;
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
                        input.value = showShortcut(settings[id]);
                        break;
                    case "checkbox":
                        if(settings[id]) input.checked = true;
                        break;
                }
                break;
        }
    }
    if(!settings.showSourceSelector) {
        document.getElementById("showPluginSourceItem").disabled = true;
        document.getElementById("showQTPSourceItem").disabled = true;
    }
    if(settings.defaultPlayer !== "html5") document.getElementById("mediaAutoload").disabled = true;
    if(settings.mediaAutoload) {
        document.getElementById("showPoster").disabled = true;
        document.getElementById("showMediaTooltip").disabled = true;
    } else document.getElementById("preload").disabled = true;
}

safari.self.addEventListener("message", loadSettings, false);

safari.self.tab.dispatchMessage("getSettings", "");

