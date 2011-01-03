const OFFSET_LEFT = 10;
const OFFSET_TOP = 10;

function sourceSelector(plugin, loadPlugin, handleClickEvent, handleContextMenuEvent) {
    this.element = document.createElement("div");
    this.element.className = "CTFsourceSelector CTFhidden";
    this.element.innerHTML = "<ul class=\"CTFsourceList\"></ul>";
    
    this.element.style.WebkitTransitionProperty = "none !important";
    var _this = this;
    setTimeout(function() {_this.element.style.WebkitTransitionProperty = "opacity !important";}, 0);
    
    this.sources = null;
    this.plugin = plugin;
    this.pluginSourceItem = null;
    
    this.currentSource = null;
    
    this.handleClickEvent = handleClickEvent;
    this.handleContextMenuEvent = handleContextMenuEvent;
    this.loadPlugin = loadPlugin;
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
    if(source === undefined) this.pluginSourceItem.className = "CTFcurrentSource";
    else this.element.firstChild.childNodes[source].className = "CTFcurrentSource";
    this.currentSource = source;
};

sourceSelector.prototype.buildSourceList = function(sources) {
    this.element.firstChild.innerHTML = "";
    this.sources = sources;
    for(var i = 0; i < sources.length; i++) {
        this.appendSource(i);
    }
    // Plugin source item
    this.pluginSourceItem = document.createElement("li");
    this.pluginSourceItem.innerHTML = this.plugin;
    var _this = this;
    this.pluginSourceItem.addEventListener("click", function(event) {
        _this.loadPlugin(event);
    }, false);
    this.pluginSourceItem.addEventListener("contextmenu", function(event) {
        _this.handleContextMenuEvent(event);
    }, false);
    this.element.firstChild.appendChild(this.pluginSourceItem);
};

sourceSelector.prototype.appendSource = function(source) {
    var sourceItem = document.createElement("li");
    sourceItem.innerHTML = "<a href=\"" + this.sources[source].url + "\">" + (this.sources[source].format ? this.sources[source].format : "HTML5") + "</a>";
    sourceItem.firstChild.addEventListener("click", function(event) {event.preventDefault();}, false);
    var _this = this;
    sourceItem.addEventListener("click", function(event) {
        _this.handleClickEvent(event, source);
    }, false);
    sourceItem.addEventListener("contextmenu", function(event) {
        _this.handleContextMenuEvent(event, source);
    }, false);
    this.element.firstChild.appendChild(sourceItem);
};

sourceSelector.prototype.setTitle = function(title) {
    if(!title) title = "";
    this.pluginSourceItem.title = title;
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

