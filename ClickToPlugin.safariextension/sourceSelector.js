const OFFSET_LEFT = 10;
const OFFSET_TOP = 10;

function sourceSelector(plugin, loadPlugin, viewInQTP, handleClickEvent, handleContextMenuEvent) {
    this.element = document.createElement("div");
    this.element.className = "CTFsourceSelector CTFhidden";
    this.element.innerHTML = "<ul class=\"CTFsourceList\"></ul>";
    
    this.element.style.WebkitTransitionProperty = "none !important";
    var _this = this;
    setTimeout(function() {_this.element.style.WebkitTransitionProperty = "opacity !important";}, 0);
    
    this.sources = null;
    this.plugin = plugin;
    
    this.currentSource = null;
    
    this.handleClickEvent = handleClickEvent;
    this.handleContextMenuEvent = handleContextMenuEvent;
    this.loadPlugin = loadPlugin;
    this.viewInQTP = viewInQTP;
}

sourceSelector.prototype.setPosition = function(left, top) {
    this.element.style.left = (OFFSET_LEFT + left) + "px !important";
    this.element.style.top = (OFFSET_TOP + top) + "px !important";
};

sourceSelector.prototype.setCurrentSource = function(source) {
    if(this.currentSource !== null) {
        if(this.currentSource === undefined) this.pluginSourceItem.removeAttribute("class");
        else this.element.firstChild.childNodes[this.currentSource].removeAttribute("class");
    }
    if(source === undefined) {
        if(this.pluginSourceItem) this.pluginSourceItem.className = "CTFcurrentSource";
    } else if(settings.defaultPlayer === "qtp") {
        if(this.QTPSourceItem) this.QTPSourceItem.className = "CTFcurrentSource";
    } else this.element.firstChild.childNodes[source].className = "CTFcurrentSource";
    this.currentSource = source;
};

sourceSelector.prototype.buildSourceList = function(sources) {
    this.element.firstChild.innerHTML = "";
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
        this.element.firstChild.appendChild(this.pluginSourceItem);
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
        this.element.firstChild.appendChild(this.QTPSourceItem);
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
    this.element.firstChild.appendChild(sourceItem);
};

sourceSelector.prototype.setTitle = function(title) {
    //if(!title) title = "";
    //this.pluginSourceItem.title = title;
};

sourceSelector.prototype.unhide = function(width, height) {
    if(this.element.offsetWidth + OFFSET_LEFT < width && this.element.offsetHeight + OFFSET_TOP < height) {
        this.element.className = "CTFsourceSelector";
        return true;
    }
    return false;
};

sourceSelector.prototype.hide = function() {
    this.element.className = "CTFsourceSelector CTFhidden";
}

