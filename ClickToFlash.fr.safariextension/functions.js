function getParamsOf(element) {
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
    }
}

function matchList(list, string) {
    for(var i = 0; i < list.length; i++) {
        var s = list[i];
        // if s is enclosed in parenthesis, interpret as regexp
        if (s[0] == "(" && s[s.length - 1] == ")") {
            try{
                s = new RegExp(s);
            } catch (err) { // invalid regexp, just ignore
                continue;
            }
        }
        if(string.match(s)) {
            return true;
        }
    }
    return false;
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
