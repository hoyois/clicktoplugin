function localize(STRING) {
    var event = document.createEvent("HTMLEvents");
    event.initEvent("beforeload", false, true);
    return safari.self.tab.canLoad(event, STRING);
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
                for (var i = 0; i < paramElements.length; i++) {
                    try {
                        if(paramElements[i].getAttribute("name").toLowerCase() == "type") {
                            return paramElements[i].getAttribute("value");
                        }
                    } catch(err) {}
                }
                var embedChildren = element.getElementsByTagName("embed");
                if(embedChildren.length == 0) return "";
                return embedChildren[0].type;
            }
            break;
    }
}

function getParamsOf(element) {
    switch (element.tag) {
        case "embed":
            return (element.getAttribute("flashvars") ? element.getAttribute("flashvars") : ""); // fixing Safari's buggy JS support
            break
        case "object":
            var paramElements = element.getElementsByTagName("param");
            for (var i = paramElements.length - 1; i >= 0; i--) {
                try {
                    if(paramElements[i].getAttribute("name").toLowerCase() == "flashvars") {
                        return paramElements[i].getAttribute("value");
                    }
                } catch(err) {}
            }
            return "";
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
