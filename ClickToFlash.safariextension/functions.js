if(window.location.href !== "about:blank") {

function downloadURL(url) {
    var downloadLink = document.createElement("a");
    downloadLink.href = url;
    
    var event = document.createEvent("MouseEvents");
    event.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, true, false, false, 0, null);
    downloadLink.dispatchEvent(event);
}

function sendToDownloadManager(url) {
    var DMObject = document.createElement("embed");
    DMObject.allowedToLoad = true;
    DMObject.className = "CTFpluginLauncher";
    DMObject.setAttribute("type", "application/octet-stream");
    DMObject.setAttribute("width", "0");
    DMObject.setAttribute("height", "0");
    DMObject.setAttribute("src", url);
    document.body.appendChild(DMObject);
    setTimeout(function() {document.body.removeChild(DMObject);}, 1000);
}

function openInQuickTimePlayer(url) {
    // Relative URLs need to be resolved for QTP
    var tmpAnchor = document.createElement("a");
    tmpAnchor.href = url;
    url = tmpAnchor.href;
    var QTObject = document.createElement("embed");
    QTObject.allowedToLoad = true;
    QTObject.className = "CTFpluginLauncher";
    QTObject.setAttribute("type", "video/quicktime");
    QTObject.setAttribute("width", "0");
    QTObject.setAttribute("height", "0");
    // need an external URL for source, since QT plugin doesn't accept safari-extension:// protocol
    // Apple has a small 1px image for this exact purpose
    QTObject.setAttribute("src", "http://images.apple.com/apple-events/includes/qtbutton.mov");
    QTObject.setAttribute("href", url);
    QTObject.setAttribute("target", "quicktimeplayer");
    QTObject.setAttribute("autohref", "true");
    QTObject.setAttribute("controller", "false");
    document.body.appendChild(QTObject);
    setTimeout(function() {document.body.removeChild(QTObject);}, 1000);
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

function getType(element) {
    switch(element.nodeName.toLowerCase()) {
        case "embed":
            return element.type;
            break;
        case "object":
            if(element.type) return element.type;
            var paramElements = element.getElementsByTagName("param");
            for (var i = 0; i < paramElements.length; i++) {
                try {
                    if(paramElements[i].getAttribute("name").toLowerCase() === "type") {
                        return paramElements[i].getAttribute("value");
                    }
                } catch(err) {}
            }
            break;
    }
}

function getParams(element) {
        switch (element.nodeName.toLowerCase()) {
            case "embed":
                return (element.hasAttribute("flashvars") ? element.getAttribute("flashvars") : ""); // fixing Safari's buggy JS
                break
            case "object":
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
}

// Debugging functions
function HTMLToString(element) {
    return (new XMLSerializer()).serializeToString(element);
};

}
