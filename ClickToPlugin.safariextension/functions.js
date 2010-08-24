function getInfo(element, url) {
    // gathers attributes of the element that might be needed later on
    // Done by a single function so that we only loop once through the <param> children
    var info = new Object();
    var tmpAnchor = document.createElement("a");
    switch (element.tag) {
        case "embed":
            if(element.hasAttribute("qtsrc")) {
                tmpAnchor.href = element.getAttribute("qtsrc");
                info.src = tmpAnchor.href;
            }
            if(element.hasAttribute("href")) {
                tmpAnchor.href = element.getAttribute("href");
                info.href = tmpAnchor.href;
            }
            if(element.hasAttribute("target")) {
                info.target = element.getAttribute("target");
            }
            if(element.hasAttribute("previewimage")) {
                tmpAnchor.href = element.getAttribute("previewimage");
                info.image = tmpAnchor.href;
            }
            break;
        case "object":
            var paramElements = element.getElementsByTagName("param");
            for (i = 0; i < paramElements.length; i++) {
                if(!paramElements[i].hasAttribute("value")) continue;
                var paramName = paramElements[i].getAttribute("name").toLowerCase(); // name attribute is mandatory!
                switch(paramName) {
                    case "source": // Silverlight true source
                        tmpAnchor.href = paramElements[i].getAttribute("value");
                        info.src = tmpAnchor.href;
                        break;
                    case "qtsrc": // QuickTime true source
                        tmpAnchor.href = paramElements[i].getAttribute("value");
                        info.src = tmpAnchor.href;
                        break;
                    case "href": // QuickTime
                        tmpAnchor.href = paramElements[i].getAttribute("value");
                        info.href = tmpAnchor.href;
                        break;
                    case "target": // QuickTime
                        info.target = paramElements[i].getAttribute("value");
                        break;
                    case "previewimage": // DivX
                        tmpAnchor.href = paramElements[i].getAttribute("value");
                        info.image = tmpAnchor.href;
                        break;
                }
            }
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

function getParamsOf(element) {
    switch(element.plugin) {
        case "Flash":
            switch (element.tag) {
                case "embed":
                    return (element.getAttribute("flashvars") ? element.getAttribute("flashvars") : ""); // fixing Safari's buggy JS support
                    break
                case "object":
                    var paramElements = element.getElementsByTagName("param");
                    for (i = paramElements.length - 1; i >= 0; i--) {
                        if(paramElements[i].getAttribute("name").toLowerCase() == "flashvars") {
                            return paramElements[i].getAttribute("value");
                        }
                    }
                    return "";
                    break;
            }
            break;
        case "Silverlight":
            if(element.tag != "object") return "";
            var paramElements = element.getElementsByTagName("param");
            for (i = 0; i < paramElements.length; i++) {
                if(paramElements[i].getAttribute("name").toLowerCase() == "initparams") {
                    return paramElements[i].getAttribute("value").replace(/\s+/g,"");
                }
            }
            return "";
            break;
        default: return "";
    }
}

function getTypeOf(element) {
    switch (element.tag) {
        case "embed":
            return element.type;
            break;
        case "object":
            if(element.type) {
                return element.type;
            } else {
                var paramElements = element.getElementsByTagName("param");
                for (i = 0; i < paramElements.length; i++) {
                    if(paramElements[i].getAttribute("name").toLowerCase() == "type") {
                        return paramElements[i].getAttribute("value");
                    }
                }
                var embedChildren = element.getElementsByTagName("embed");
                if(embedChildren.length == 0) return "";
                return embedChildren[0].type;
            }
            break;
        case "applet":
            return "application/x-java-applet";
            break;
    }
}

// Debugging functions
document.HTMLToString = function(element){
    if(!element || !element.tagName) return "";
    var outerElement = this.createElement("div");
    outerElement.appendChild(element.cloneNode(true));
    return outerElement.innerHTML;
};

/*document.stringToHTML = function(code){
    var outerElement = this.createElement("div");
    outerElement.innerHTML = code;
    return outerElement.firstChild;
};*/
