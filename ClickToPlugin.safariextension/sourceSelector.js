if(location.href !== "about:blank") {

/******************************
SourceSelector class definition
*******************************/

function SourceSelector(plugin, loadPlugin, viewInQTP, handleClickEvent, handleContextMenuEvent) {
	this.containerElement = document.createElement("div");
	this.containerElement.className = "CTPsourceSelector CTPhidden";
	this.containerElement.innerHTML = "<ul class=\"CTPsourceList\"></ul>";
	
	this.containerElement.style.WebkitTransitionProperty = "none !important";
	var _this = this;
	setTimeout(function() {_this.containerElement.style.WebkitTransitionProperty = "opacity !important";}, 0);
	
	this.plugin = plugin;
	this.handleClickEvent = handleClickEvent;
	this.handleContextMenuEvent = handleContextMenuEvent;
	this.loadPlugin = loadPlugin;
	this.viewInQTP = viewInQTP;
}

SourceSelector.prototype.init = function(sources) {
	this.containerElement.firstChild.innerHTML = "";
	this.sources = sources;
	for(var i = 0; i < sources.length; i++) {
		this.appendSource(i);
	}
	var _this = this;
	// Plugin source item
	if(settings.showPluginSourceItem && this.plugin) {
		this.pluginSourceItem = document.createElement("li");
		this.pluginSourceItem.className = "CTPsourceItem";
		this.pluginSourceItem.textContent = this.plugin;
		this.pluginSourceItem.addEventListener("click", function(event) {
			_this.loadPlugin(event);
			event.preventDefault();
			event.stopPropagation();
		}, false);
		this.pluginSourceItem.addEventListener("contextmenu", function(event) {
			_this.handleContextMenuEvent(event);
			event.stopPropagation();
		}, false);
		this.containerElement.firstChild.appendChild(this.pluginSourceItem);
	}
	// QuickTime Player source item
	if(settings.showQTPSourceItem && this.viewInQTP !== undefined) {
		this.QTPSourceItem = document.createElement("li");
		this.QTPSourceItem.className = "CTPsourceItem";
		this.QTPSourceItem.textContent = "QuickTime Player";
		this.QTPSourceItem.addEventListener("click", function(event) {
			_this.viewInQTP(event);
			event.preventDefault();
			event.stopPropagation();
		}, false);
		this.QTPSourceItem.addEventListener("contextmenu", function(event) {
			_this.handleContextMenuEvent(event);
			event.stopPropagation();
		}, false);
		this.containerElement.firstChild.appendChild(this.QTPSourceItem);
	}
};

SourceSelector.prototype.appendSource = function(source) {
	var sourceItem = document.createElement("li");
	sourceItem.className = "CTPsourceItem";
	sourceItem.innerHTML = "<a class=\"CTPsourceLink\" href=\"" + this.sources[source].url + "\">" + (this.sources[source].format ? this.sources[source].format : "HTML5") + "</a>";
	var _this = this;
	
	sourceItem.firstChild.addEventListener("click", function(event) {
		if(event.altKey) return; // to allow option-click download
		_this.handleClickEvent(event, source);
		event.preventDefault();
		event.stopImmediatePropagation(); // Needed for Facebook
	}, false);
	
	sourceItem.addEventListener("click", function(event) {
		_this.handleClickEvent(event, source);
		event.preventDefault();
		event.stopPropagation();
	}, false);
	sourceItem.addEventListener("contextmenu", function(event) {
		_this.handleContextMenuEvent(event, source);
		event.stopPropagation();
	}, false);
	this.containerElement.firstChild.appendChild(sourceItem);
};

SourceSelector.prototype.setCurrentSource = function(source) {
	if(source === undefined) source = "plugin";
	if(this.currentSource !== undefined) {
		if(this.currentSource === "plugin") this.pluginSourceItem.className = "CTPsourceItem";
		else if(this.currentSource === "qtp") this.QTPSourceItem.className = "CTPsourceItem";
		else this.containerElement.firstChild.childNodes[this.currentSource].className = "CTPsourceItem";
	}
	if(source === "plugin") {
		if(this.pluginSourceItem) this.pluginSourceItem.className += " CTPcurrentSource";
	} else if(source === "qtp") {
		if(this.QTPSourceItem) this.QTPSourceItem.className += " CTPcurrentSource";
	} else this.containerElement.firstChild.childNodes[source].className += " CTPcurrentSource";
	this.currentSource = source;
};

SourceSelector.prototype.unhide = function(width, height) {
	if(this.containerElement.offsetWidth + 10 < width && this.containerElement.offsetHeight + 10 < height) {
		this.containerElement.className = "CTPsourceSelector";
		return true;
	}
	return false;
};

SourceSelector.prototype.hide = function() {
	this.containerElement.className = "CTPsourceSelector CTPhidden";
};

}
