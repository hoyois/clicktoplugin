function sourceSwitcher(plugin, loadPlugin, handleClickEvent, handleContextMenuEvent) {
    this.element = document.createElement("div");
    this.element.className = "CTFsourceSwitcher";
    this.element.innerHTML = "<ul class=\"CTFsourceList\"></ul>";
    
    this.sources = null;
    this.plugin = plugin;
    this.pluginSourceItem = null;
    
    this.currentSource = null;
    
    this.handleClickEvent = handleClickEvent;
    this.handleContextMenuEvent = handleContextMenuEvent;
    this.loadPlugin = loadPlugin;
}

sourceSwitcher.prototype.setPosition = function(left, top) {
    this.element.style.left = (20 + left) + "px !important";
    this.element.style.top = (20 + top) + "px !important";
};

sourceSwitcher.prototype.setCurrentSource = function(source) {
    if(this.currentSource !== null) {
        if(this.currentSource === undefined) this.pluginSourceItem.removeAttribute("class");
        else this.element.firstChild.childNodes[this.currentSource].removeAttribute("class");
    }
    if(source === undefined) this.pluginSourceItem.className = "CTFcurrentSource";
    else this.element.firstChild.childNodes[source].className = "CTFcurrentSource";
    this.currentSource = source;
};

sourceSwitcher.prototype.buildSourceList = function(sources) {
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

sourceSwitcher.prototype.appendSource = function(source) {
    var sourceItem = document.createElement("li");
    sourceItem.innerHTML = this.sources[source].format ? this.sources[source].format : "HTML5";
    var _this = this;
    sourceItem.addEventListener("click", function(event) {
        _this.handleClickEvent(event, source);
    }, false);
    sourceItem.addEventListener("contextmenu", function(event) {
        _this.handleContextMenuEvent(event, source);
    }, false);
    this.element.firstChild.appendChild(sourceItem);
};

