function getSrcOf(element) {
    var tmpAnchor = document.createElement("a");
    switch (element.tag) {
        case "embed":
            if(element.hasAttribute("previewimage")) {
                tmpAnchor.href = element.getAttribute("previewimage");
                element.image = tmpAnchor.href;
            }
            if(element.src) tmpAnchor.href = element.src;
			if(element.hasAttribute("qtsrc")) tmpAnchor.href = element.getAttribute("qtsrc");
			element.presource = tmpAnchor.href;
            if(element.hasAttribute("target")) element.otherInfo.target = element.getAttribute("target");
			if(element.hasAttribute("href")) {
				tmpAnchor.href = element.getAttribute("href");
			} else {
				delete element.presource;
				if(!element.src) return "";
			}
            return tmpAnchor.href;
            break;
        case "object":
            // NOTE: For silverlight objects element.data is used for something else than the source
            // and a param named 'source' is used for the source. So we look for that before
            // using element.data
            var paramElements = element.getElementsByTagName("param");
            var srcParam = null; var qtsrcParam = null;
            for (i = 0; i < paramElements.length; i++) {
				if(!paramElements[i].hasAttribute("value")) continue;
                var paramName = paramElements[i].getAttribute("name").toLowerCase(); // name attribute is mandatory!
                // this is a bit shaky...
                // maybe should check first for mimetype and then let getSrcOf depend on type
                // eg source for silverlight; src for flash, qt, realplayer; filename for wm...
                // this would require 2 successive canLoads? or just use the type attribute??
                // it seems to always be specified for SL, but not QT (uses classid instead)
                // damn... maybe better to pass the whole HTMLToString(element) to the global page after all?
                if(paramName == "previewimage") {
                    var tmpAnchor2 = document.createElement("a");
                    tmpAnchor2.href = paramElements[i].getAttribute("value");
                    element.image = tmpAnchor2.href;
                } else if(paramName == "src") {
                    srcParam = i;
                    if(!element.presource) {
                        var tmpAnchor2 = document.createElement("a");
                        tmpAnchor2.href = paramElements[i].getAttribute("value");
                        element.presource = tmpAnchor2.href;
                    }
                    //element.otherInfo.src = paramElements[i].getAttribute("value");
                } else if (paramName == "qtsrc") {
                    qtsrcParam = i;
                    var tmpAnchor2 = document.createElement("a");
                    tmpAnchor2.href = paramElements[i].getAttribute("value");
                    element.presource = tmpAnchor2.href;
                    //element.otherInfo.qtsrc = paramElements[i].getAttribute("value");
				} else if (paramName == "target") element.otherInfo.target = paramElements[i].getAttribute("value");
                else if(paramName == "movie" || paramName == "source" || paramName == "href" || paramName == "filename") { //|| paramName == "url") { // for oleobject, not supported on Safari (what about the Win version?)
                	tmpAnchor.href = paramElements[i].getAttribute("value");
                }
            }
            if(tmpAnchor.href) return tmpAnchor.href;
            if(qtsrcParam != null) {
                element.presource = null;
                tmpAnchor.href = paramElements[qtsrcParam].getAttribute("value");
                return tmpAnchor.href;
            } else if(srcParam != null) {
                element.presource = null;
                tmpAnchor.href = paramElements[srcParam].getAttribute("value");
                return tmpAnchor.href;
            }
            if(element.data) {
                tmpAnchor.href = element.data;
                return tmpAnchor.href;
            } else {
                var embedElements = element.getElementsByTagName("embed");
                if(embedElements.length == 0) return "";
                embedElements[0].tag = "embed";
                return getSrcOf(embedElements[0]);
            }
            return "";
            break;
        case "applet":
            if(element.code) {
				tmpAnchor.href = element.code;
			} else if(element.hasAttribute("archive")) {
				tmpAnchor.href = element.getAttribute("archive");
			} else return "";
            return tmpAnchor.href;
            break;
    }
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
