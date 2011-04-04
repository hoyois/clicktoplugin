function downloadURL(url) {
    var downloadLink = document.createElement("a");
    downloadLink.href = url;
    
    var event = document.createEvent("MouseEvents");
    event.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, true, false, false, 0, null);
    
    downloadLink.dispatchEvent(event);
}

function disableSIFR(element) {
    var sIFRElement = element.parentNode;
    if(!sIFRElement) return;
    var regex = /\bsIFR-(?:hasFlash|active)\b/g;
    document.documentElement.className = document.documentElement.className.replace(regex, "");
    document.body.className = document.body.className.replace(regex, "");
    var sIFRAlternate = sIFRElement.getElementsByClassName("sIFR-alternate")[0];
    if(sIFRAlternate) sIFRElement.innerHTML = sIFRAlternate.innerHTML;
    sIFRElement.className = sIFRElement.className.replace(/\bsIFR-replaced\b/, "");
}

function applyCSS(element, style, properties) {
    for(var x in properties) {
        element.style.setProperty(properties[x], style.getPropertyValue(properties[x]), "important");
    }
}

function simplifyWheelDelta(x, y) {
    if(x > y && y > -x) return "left";
    if(x > y) return "down";
    if(-x > y) return "right";
    return "up";
}

function testShortcut(event, shortcut) {
    for(var x in shortcut) {
        if(x === "direction") {
            if(simplifyWheelDelta(event.wheelDeltaX, event.wheelDeltaY) !== shortcut.direction) return false;
            else continue;
        }
        if(event[x] !== shortcut[x]) return false;
    }
    event.preventDefault();
    event.stopPropagation(); // immediate?
    return true;
}

function removeHTMLNode(node) {
    while(node.parentNode.childNodes.length === 1) {
        node = node.parentNode;
    }
    node.parentNode.removeChild(node);
}

function getAttributes(element, url) {
    // Gathers essential attributes of the element that are needed to decide blocking.
    // Done by a single function so that we only loop once through the <param> children.
    // NOTE: the source used by Safari to choose a plugin is always 'url'; the value info.src
    // returned by this function is the source that is relevant for whitelisting
    var info = new Object();
    info.type = element.type;
    var tmpAnchor = document.createElement("a");
    switch (element.nodeName) {
        case "EMBED":
            if(element.hasAttribute("qtsrc")) {
                tmpAnchor.href = element.getAttribute("qtsrc");
                info.src = tmpAnchor.href;
            }
            if(element.hasAttribute("autohref")) {
                info.autohref = /^true$/i.test(element.getAttribute("autohref"));
            }
            if(element.hasAttribute("href")) {
                tmpAnchor.href = element.getAttribute("href");
                info.href = tmpAnchor.href;
            }
            if(element.hasAttribute("target")) {
                info.target = element.getAttribute("target");
            }
            break;
        case "OBJECT":
            info.classid = element.getAttribute("classid");
            var paramElements = element.getElementsByTagName("param");
            for (var i = 0; i < paramElements.length; i++) {
                if(!paramElements[i].hasAttribute("value")) continue;
                /* NOTE 1
                The 'name' attribute of a <param> element is mandatory.
                However, Safari will load an <object> element even if it has <param> children with no 'name',
                so we have to account for this possibilty, otherwise CTP could easily be circumvented!
                For these reasons we use try/catch statements.
                */
                try{
                    var paramName = paramElements[i].getAttribute("name").toLowerCase();
                    switch(paramName) {
                        case "type": // to be fixed in WebKit?
                            if(!info.type) info.type = paramElements[i].getAttribute("value");
                            break;
                        case "source": // Silverlight true source
                            tmpAnchor.href = paramElements[i].getAttribute("value");
                            info.src = tmpAnchor.href;
                            break;
                        case "qtsrc": // QuickTime true source
                            tmpAnchor.href = paramElements[i].getAttribute("value");
                            info.src = tmpAnchor.href;
                            break;
                        case "autohref": // QuickTime redirection
                            info.autohref = /^true$/i.test(paramElements[i].getAttribute("value"));
                            break;
                        case "href": // QuickTime redirection
                            tmpAnchor.href = paramElements[i].getAttribute("value");
                            info.href = tmpAnchor.href;
                            break;
                        case "target": // QuickTime redirection
                            info.target = paramElements[i].getAttribute("value");
                            break;
                    }
                } catch(err) {}
            }
            // The following is not needed anymore in the latest Webkit:
            // enclosed embeds are FINALLY treated as fallback!
            var embedChild = element.getElementsByTagName("embed")[0];
            if(embedChild && embedChild.type) info.type = embedChild.type;
            break;
    }
    if(!info.src) {
        if(!url) info.src = "";
        else {
            tmpAnchor.href = url;
            info.src = tmpAnchor.href;
        }
    }
    return info;
}

function getParams(element, plugin) {
    switch(plugin) {
        case "Flash": // need flashvars
            switch (element.nodeName) {
                case "EMBED":
                    return (element.hasAttribute("flashvars") ? element.getAttribute("flashvars") : ""); // fixing Safari's buggy JS
                    break
                case "OBJECT":
                    var paramElements = element.getElementsByTagName("param");
                    for (var i = paramElements.length - 1; i >= 0; i--) {
                        try{ // see NOTE 1
                            if(paramElements[i].getAttribute("name").toLowerCase() === "flashvars") {
                                return paramElements[i].getAttribute("value");
                            }
                        } catch(err) {}
                    }
                    return "";
                    break;
            }
            break;
        case "Silverlight": // need initparams
            if(element.nodeName !== "OBJECT") return "";
            var paramElements = element.getElementsByTagName("param");
            for (var i = 0; i < paramElements.length; i++) {
                try { // see NOTE 1
                    if(paramElements[i].getAttribute("name").toLowerCase() === "initparams") {
                        return paramElements[i].getAttribute("value").replace(/\s+/g,"");
                    }
                } catch(err) {}
            }
            return "";
            break;
        case "DivX": // need previewimage
            switch(element.nodeName) {
                case "EMBED":
                    return element.getAttribute("previewimage");
                    break
                case "OBJECT":
                    var paramElements = element.getElementsByTagName("param");
                    for (var i = 0; i < paramElements.length; i++) {
                        try{ // see NOTE 1
                            if(paramElements[i].getAttribute("name").toLowerCase() === "previewimage") {
                                return paramElements[i].getAttribute("value");
                            }
                        } catch(err) {}
                    }
                    return "";
                    break;
            }
        default: return "";
    }
}

// Debugging functions
function HTMLToString(element) {
    return (new XMLSerializer()).serializeToString(element);
};

