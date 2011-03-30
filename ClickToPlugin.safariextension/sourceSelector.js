const OFFSET_LEFT = 10;
const OFFSET_TOP = 10;

function sourceSelector(plugin, loadPlugin, viewInQTP, handleClickEvent, handleContextMenuEvent) {
    this.containerElement = document.createElement("div");
    this.containerElement.className = "CTFsourceSelector CTFhidden";
    this.containerElement.innerHTML = "<ul class=\"CTFsourceList\"></ul>";
    
    this.containerElement.style.WebkitTransitionProperty = "none !important";
    var _this = this;
    setTimeout(function() {_this.containerElement.style.WebkitTransitionProperty = "opacity !important";}, 0);
    
    this.sources = null;
    this.plugin = plugin;
    
    this.currentSource;
    
    this.handleClickEvent = handleClickEvent;
    this.handleContextMenuEvent = handleContextMenuEvent;
    this.loadPlugin = loadPlugin;
    this.viewInQTP = viewInQTP;
}

sourceSelector.prototype.setCurrentSource = function(source) {
    if(source === undefined) source = "plugin";
    if(this.currentSource !== undefined) {
        if(this.currentSource === "plugin") this.pluginSourceItem.removeAttribute("class");
        else if(this.currentSource === "qtp") this.QTPSourceItem.removeAttribute("class");
        else this.containerElement.firstChild.childNodes[this.currentSource].removeAttribute("class");
    }
    if(source === "plugin") {
        if(this.pluginSourceItem) this.pluginSourceItem.className = "CTFcurrentSource";
    } else if(source === "qtp") {
        if(this.QTPSourceItem) this.QTPSourceItem.className = "CTFcurrentSource";
    } else this.containerElement.firstChild.childNodes[source].className = "CTFcurrentSource";
    this.currentSource = source;
};

sourceSelector.prototype.buildSourceList = function(sources) {
    this.containerElement.firstChild.innerHTML = "";
    this.sources = sources;
    for(var i = 0; i < sources.length; i++) {
        this.appendSource(i);
    }
    var _this = this;
    // Plugin source item
    if(settings.showPluginSourceItem) {
        this.pluginSourceItem = document.createElement("li");
        this.pluginSourceItem.innerHTML = this.plugin;
        this.pluginSourceItem.addEventListener("click", function(event) {
            _this.loadPlugin(event);
            event.stopPropagation();
        }, false);
        this.pluginSourceItem.addEventListener("contextmenu", function(event) {
            _this.handleContextMenuEvent(event);
            event.stopPropagation();
        }, false);
        this.containerElement.firstChild.appendChild(this.pluginSourceItem);
    }
    // QuickTime Player source item
    if(settings.showQTPSourceItem) {
        if(this.viewInQTP === undefined) return;
        this.QTPSourceItem = document.createElement("li");
        this.QTPSourceItem.innerHTML = "QuickTime&nbsp;Player";
        this.QTPSourceItem.addEventListener("click", function(event) {
            _this.viewInQTP(event);
            event.stopPropagation();
        }, false);
        this.QTPSourceItem.addEventListener("contextmenu", function(event) {
            _this.handleContextMenuEvent(event);
            event.stopPropagation();
        }, false);
        this.containerElement.firstChild.appendChild(this.QTPSourceItem);
    }
};

sourceSelector.prototype.appendSource = function(source) {
    var sourceItem = document.createElement("li");
    sourceItem.innerHTML = "<a href=\"" + this.sources[source].url + "\">" + (this.sources[source].format ? this.sources[source].format : "HTML5") + "</a>";
    sourceItem.firstChild.addEventListener("click", function(event) {
        if(event.altKey) event.stopPropagation(); // to allow option-click download
        else event.preventDefault();
    }, false);
    var _this = this;
    sourceItem.addEventListener("click", function(event) {
        _this.handleClickEvent(event, source);
        event.stopPropagation();
    }, false);
    sourceItem.addEventListener("contextmenu", function(event) {
        _this.handleContextMenuEvent(event, source);
        event.stopPropagation();
    }, false);
    this.containerElement.firstChild.appendChild(sourceItem);
};

sourceSelector.prototype.unhide = function(width, height) {
    if(this.containerElement.offsetWidth + OFFSET_LEFT < width && this.containerElement.offsetHeight + OFFSET_TOP < height) {
        this.containerElement.className = "CTFsourceSelector";
        return true;
    }
    return false;
};

sourceSelector.prototype.hide = function() {
    this.containerElement.className = "CTFsourceSelector CTFhidden";
}

