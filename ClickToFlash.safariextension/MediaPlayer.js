"use strict";
/****************
MediaPlayer class
****************/

function MediaPlayer(width, height, contextInfo) {
	this.playlist = [];
	this.width = width;
	this.height = height;
	this.contextInfo = contextInfo;
	this.currentTrack = 0;
}

MediaPlayer.prototype.getURL = function(source) {
	if(source === undefined) source = this.currentSource;
	return this.playlist[this.currentTrack].sources[source].url;
};

MediaPlayer.prototype.download = function(source) {
	(settings.useDownloadManager ? sendToDownloadManager : downloadURL)(this.getURL(source));
};

MediaPlayer.prototype.openInQTP = function(source) {
	if(this.mediaElement) this.mediaElement.pause();
	openInQuickTimePlayer(this.getURL(source));
};

MediaPlayer.prototype.airplay = function(source) {
	if(this.mediaElement) this.mediaElement.pause();
	var anchor = document.createElement("a");
	anchor.href = this.getURL(source);
	safari.self.tab.dispatchMessage("airplay", anchor.href);
};

MediaPlayer.prototype.viewOnSite = function() {
	safari.self.tab.dispatchMessage("openTab", this.playlist[this.currentTrack].siteInfo.url);
};

MediaPlayer.prototype.handleMediaData = function(mediaData) {
	if(mediaData.loadAfter) { // just adding stuff to the playlist
		if(this.playlistLength === 1) return;
		this.playlist = this.playlist.concat(mediaData.playlist);
		if(this.trackSelector) this.trackSelector.add(mediaData.playlist);
	} else { // initial mediaData
		if(this.startTrack !== undefined) return;
		this.playlist = mediaData.playlist.concat(this.playlist);
		this.startTime = mediaData.startTime;
		this.initScript = mediaData.initScript;
		this.restoreScript = mediaData.restoreScript;
		this.startTrack = mediaData.startTrack ? mediaData.startTrack : 0;
		this.currentSource = mediaData.playlist[0].defaultSource;
		if(this.currentSource === undefined) this.playlistLength = 1;
		else this.playlistLength = mediaData.playlistLength ? mediaData.playlistLength : mediaData.playlist.length;
		this.initialBehavior = mediaData.autoplay ? "autoplay" : settings.initialBehavior;
		this.audioOnly = mediaData.audioOnly;
		this.initSourceSelector();
	}
};

MediaPlayer.prototype.init = function(style) {
	this.container = document.createElement("div");
	this.container.className = "CTPmediaPlayer";
	this.container.tabIndex = -1; // make focusable
	
	this.mediaElement = document.createElement(this.audioOnly ? "audio" : "video");
	this.mediaElement.id = "CTPmediaElement" + this.contextInfo.elementID;
	this.mediaElement.className = "CTPmediaElement";
	this.mediaElement.controls = true;
	switch(this.initialBehavior) {
	case "none":
		this.mediaElement.preload = "none";
		break;
	case "buffer":
		this.mediaElement.preload = "auto";
		break;
	case "autoplay":
		this.mediaElement.preload = "auto";
		this.mediaElement.autoplay = true;
		break;
	}
	this.container.appendChild(this.mediaElement);
	
	// Set styles
	this.container.style.setProperty("width", this.width + "px", "important");
	this.container.style.setProperty("height", this.height + "px", "important");
	this.mediaElement.style.setProperty("width", this.width + "px", "important");
	this.mediaElement.style.setProperty("height", this.height + "px", "important");
	applyCSS(this.container, style, ["position", "top", "right", "bottom", "left", "z-index", "clear", "float", "vertical-align", "margin-top", "margin-right", "margin-bottom", "margin-left", "-webkit-margin-before-collapse", "-webkit-margin-after-collapse"]);
	
	// Set volume
	this.mediaElement.volume = settings.volume;
	
	// Additional controls
	this.initTrackSelector();
	if(this.playlistLength > 1) this.initPlaylistControls();
	if(this.sourceSelector) {
		this.sourceSelector.updateHandlers();
		this.sourceSelector.attachTo(this.container);
	}
	
	// Set listeners
	this.addListeners();
	this.registerShortcuts();
};

MediaPlayer.prototype.destroy = function() {
	if(this.restoreScript) injectScript("(function(){" + this.restoreScript + "})();");
};

MediaPlayer.prototype.initPlaylistControls = function() {
	var _this = this;
	var x = settings.hideRewindButton ? 0 : 26;
	this.mediaElement.addEventListener("click", function(event) {
		if(event.target !== this) return; // click on trackSelector
		var coord = _this.getCoordinates(event);
		if(coord.y + 25 > _this.height && event.target.controls) { // click in controls
			if(coord.x >= x + 6 && coord.x <= x + 25) {
				event.preventDefault();
				_this.prevTrack();
			} else if(coord.x >= x + 54 && coord.x <= x + 73) {
				event.preventDefault();
				_this.nextTrack();
			}
		}
	}, false);
};

MediaPlayer.prototype.nextTrack = function() {
	var track = this.currentTrack;
	do {track = this.normalizeTrack(track + 1);}
	while(this.playlist[track] === null);
	if(track === this.currentTrack) return;
	this.loadTrack(track);
};

MediaPlayer.prototype.prevTrack = function() {
	var track = this.currentTrack;
	do {track = this.normalizeTrack(track - 1);}
	while(this.playlist[track] === null);
	if(track === this.currentTrack) return;
	this.loadTrack(track);
};

MediaPlayer.prototype.isLastTrack = function() {
	var track = this.currentTrack;
	for(var i = this.currentTrack; this.printTrack(track) < this.playlistLength; i++) {
		if(this.playlist[i] !== null) return false;
	}
	return true;
};

MediaPlayer.prototype.normalizeTrack = function(track) {
	track = track % this.playlist.length;
	if(track < 0) track += this.playlist.length; // stupid JS behavior
	return track;
};

MediaPlayer.prototype.loadFirstTrack = function() {
	this.initShadowDOM();
	if(this.initScript) injectScript("(function(){" + this.initScript + "}).call(document.getElementById(\"" + this.mediaElement.id + "\"));");
	if(this.startTime) {
		var _this = this;
		var setInitialTime = function(event) {
			event.target.removeEventListener("loadeddata", setInitialTime, false);
			if(_this.currentTrack === 0) event.target.currentTime = _this.startTime;
		};
		this.mediaElement.addEventListener("loadeddata", setInitialTime, false);
	}
	this.load(0, this.currentSource, false, true);
	if(this.sourceSelector) this.sourceSelector.update();
};

MediaPlayer.prototype.loadTrack = function(track) {
	var source = this.playlist[track].defaultSource;
	this.load(track, source, true, true);
	if(this.sourceSelector) this.sourceSelector.update();
};

MediaPlayer.prototype.switchSource = function(source) {
	if(source === this.currentSource) return;
	
	var currentTime = this.mediaElement.currentTime;
	var setInitialTime = function(event) {
		event.target.removeEventListener("loadeddata", setInitialTime, false);
		event.target.currentTime = currentTime;
	};
	
	if(this.sourceSelector) this.sourceSelector.setSource(source);
	
	this.load(this.currentTrack, source, true, !this.playlist[this.currentTrack].sources[this.currentSource].isAudio !== !this.playlist[this.currentTrack].sources[source].isAudio);
	this.mediaElement.addEventListener("loadeddata", setInitialTime, false);
};

MediaPlayer.prototype.load = function(track, source, autoplay, updatePoster) {
	if(updatePoster) {
		// Remove poster early so that it doesn't show before the new poster is loaded
		this.mediaElement.removeAttribute("poster");
		this.container.style.setProperty("background-image", "none", "important");
	}
	// Pause first to prevent undesirable sound quirks
	// Conditional needed, otherwise Webkit fails to reset autoplaying flag on initial load
	if(!this.mediaElement.paused) this.mediaElement.pause();
	this.currentTrack = track;
	this.currentSource = source;
	this.mediaElement.src = this.playlist[track].sources[source].url;
	if(updatePoster) this.updatePoster(); // must be done after setting src (#67900)
	if(autoplay) {
		this.mediaElement.preload = "auto";
		this.mediaElement.autoplay = true;
	}
	this.trackSelector.update();
	if(settings.instantAutoplay && this.mediaElement.autoplay) this.mediaElement.play();
};

MediaPlayer.prototype.updatePoster = function() {
	if(!this.playlist[this.currentTrack].poster) return;
	if(this.playlist[this.currentTrack].sources[this.currentSource].isAudio) {
		this.container.style.setProperty("background-image", "url('" + this.playlist[this.currentTrack].poster + "')", "important");
	} else {
		this.mediaElement.poster = this.playlist[this.currentTrack].poster;
	}
};

MediaPlayer.prototype.toggleLooping = function() {
	if(this.mediaElement.loop) this.mediaElement.loop = false;
	else this.mediaElement.loop = true;
};

MediaPlayer.prototype.printTrack = function(track) {
	return (track + this.startTrack) % this.playlistLength + 1;
};

MediaPlayer.prototype.setContextInfo = function(event) {
	var media = this.playlist[this.currentTrack];
	var source = event.source;
	if(source === undefined) source = this.currentSource;
	
	var contextInfo = this.contextInfo;
	if(media.siteInfo) contextInfo.site = media.siteInfo.name;
	contextInfo.hasMedia = true;
	contextInfo.isMedia = this.mediaElement !== undefined;
	contextInfo.source = source;
	if(source !== undefined) contextInfo.isAudio = media.sources[source].isAudio;
	safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
};

MediaPlayer.prototype.addListeners = function() {
	var _this = this;
	this.container.addEventListener("click", function(event) {
		event.stopPropagation();
	}, false);
	this.container.addEventListener("contextmenu", function(event) {
		_this.setContextInfo(event);
		event.stopPropagation();
	}, false);
	if(this.playlistLength > 1) this.mediaElement.addEventListener("ended", function() {
		if(!_this.isLastTrack()) _this.nextTrack();
	}, false);
	// Cancel mouseout to source selector
	if(this.sourceSelector) this.container.addEventListener("mouseout", function(event) {
		if(event.target === _this.mediaElement && event.relatedTarget && event.relatedTarget.compareDocumentPosition(this) === 10) event.preventDefault();
	}, false);
};

MediaPlayer.prototype.registerShortcuts = function() {
	var _this = this;
	["keys", "gestures"].forEach(function(x) {
		if(settings[x].playPause) {
			this.addEventListener(settings[x].playPause.type, function(event) {
				if(testShortcut(event, settings[x].playPause)) {
					if(_this.mediaElement.paused || _this.mediaElement.ended) _this.mediaElement.play();
					else _this.mediaElement.pause();
				}
			});
		}
		if(settings[x].enterFullscreen) {
			this.addEventListener(settings[x].enterFullscreen.type, function(event) {
				if(testShortcut(event, settings[x].enterFullscreen)) {
					if(_this.mediaElement.webkitDisplayingFullscreen) _this.mediaElement.webkitExitFullscreen();
					else _this.mediaElement.webkitEnterFullscreen();
				}
			});
		}
		if(settings[x].volumeUp) {
			this.addEventListener(settings[x].volumeUp.type, function(event) {
				if(testShortcut(event, settings[x].volumeUp)) {
					var newVolume = _this.mediaElement.volume + .1;
					if(newVolume > 1) _this.mediaElement.volume = 1;
					else _this.mediaElement.volume = newVolume;
				}
			});
		}
		if(settings[x].volumeDown) {
			this.addEventListener(settings[x].volumeDown.type, function(event) {
				if(testShortcut(event, settings[x].volumeDown)) {
					var newVolume = _this.mediaElement.volume - .1;
					if(newVolume < 0) _this.mediaElement.volume = 0;
					else _this.mediaElement.volume = newVolume;
				}
			});
		}
		if(this.playlistLength > 1) {
			if(settings[x].prevTrack) {
				this.addEventListener(settings[x].prevTrack.type, function(event) {
					if(testShortcut(event, settings[x].prevTrack)) _this.prevTrack();
				});
			}
			if(settings[x].nextTrack) {
				this.addEventListener(settings[x].nextTrack.type, function(event) {
					if(testShortcut(event, settings[x].nextTrack)) _this.nextTrack();
				});
			}
		}
		if(settings[x].toggleLooping) {
			this.addEventListener(settings[x].toggleLooping.type, function(event) {
				if(testShortcut(event, settings[x].toggleLooping)) _this.toggleLooping();
			});
		}
		if(settings[x].trackSelector && (this.playlist[0].title || this.playlistLength > 1)) {
			this.addEventListener(settings[x].trackSelector.type, function(event) {
				if(_this.mediaElement.readyState === 0) return;
				event.allowDefault = false;
				if(testShortcut(event, settings[x].trackSelector)) {
					_this.trackSelector.toggle();
				}
			});
		}
	}, this);
};

MediaPlayer.prototype.addEventListener = function(type, handler) {
	if(type === "click" || type === "dblclick") { // ignore clicks on controls
		var _this = this;
		this.container.addEventListener(type, function(event) {
			if(event.target !== _this.mediaElement || (_this.mediaElement.controls && event.offsetY + 25 > _this.height)) return;
			handler(event);
		}, false);
	} else {
		this.container.addEventListener(type, function(event) {
			if(event.allowDefault) return;
			handler(event);
		}, false);
	}
};

MediaPlayer.prototype.getCoordinates = function(event) {
	var x = event.offsetX, y = event.offsetY;
	var e = event.target;
	do {
		if(e === this.container) break;
		x += e.offsetLeft;
		y += e.offsetTop;
	} while(e = e.offsetParent);
	return {"x": x, "y": y};
};

/******************
ShadowDOM interface
******************/

MediaPlayer.prototype.initShadowDOM = function() {
	var sheet = this.container.appendChild(document.createElement("style")).sheet;
	
	// Status display is provided by trackSelector
	sheet.insertRule("#" + this.mediaElement.id + "::-webkit-media-controls-status-display{display:none;}", 0);
	
	var pseudoElements = {"controlsPanel": "-webkit-media-controls-panel", "playButton": "-webkit-media-controls-play-button", "muteButton": "-webkit-media-controls-mute-button", "volumeSliderContainer": "-webkit-media-controls-volume-slider-container", "rewindButton": "-webkit-media-controls-rewind-button", "fullscreenButton": "-webkit-media-controls-fullscreen-button", "timelineContainer": "-webkit-media-controls-timeline-container", "seekBackButton": "-webkit-media-controls-seek-back-button", "seekForwardButton": "-webkit-media-controls-seek-forward-button"};
	
	this.shadowDOM = {};
	for(var e in pseudoElements) {
		sheet.insertRule("#" + this.mediaElement.id + ":not(:-webkit-full-screen)::" + pseudoElements[e] + "{}", 0);
		this.shadowDOM[e] = sheet.cssRules[0];
	}
	
	this.shadowDOM.controlsPanel.style.position = "absolute"; // for height < 25 in Safari 6 (cf. mediaControls.css)
	if(settings.hideRewindButton) this.shadowDOM.rewindButton.style.display = "none";
	
	if(this.playlistLength > 1) {
		// Reorder controls
		// Safari < 6.1
		this.shadowDOM.controlsPanel.style.WebkitBoxDirection = "reverse";
		this.shadowDOM.timelineContainer.style.WebkitBoxDirection = "normal";
		this.shadowDOM.volumeSliderContainer.style.WebkitBoxDirection = "normal";
		this.shadowDOM.rewindButton.style.WebkitBoxOrdinalGroup = "9";
		this.shadowDOM.seekBackButton.style.WebkitBoxOrdinalGroup = "8";
		this.shadowDOM.playButton.style.WebkitBoxOrdinalGroup = "7";
		this.shadowDOM.seekForwardButton.style.WebkitBoxOrdinalGroup = "6";
		this.shadowDOM.timelineContainer.style.WebkitBoxOrdinalGroup = "4";
		this.shadowDOM.fullscreenButton.style.WebkitBoxOrdinalGroup = "1";
		// Safari >= 6.1
		this.shadowDOM.rewindButton.style.WebkitOrder = "-5";
		this.shadowDOM.seekBackButton.style.WebkitOrder = "-4";
		this.shadowDOM.playButton.style.WebkitOrder = "-3";
		this.shadowDOM.seekForwardButton.style.WebkitOrder = "-2";
		this.shadowDOM.timelineContainer.style.WebkitOrder = "-1";
		this.shadowDOM.fullscreenButton.style.WebkitOrder = "1";
		
		// Show back/forward buttons
		this.shadowDOM.seekBackButton.style.display = "-webkit-box"; // Safari < 6.1
		this.shadowDOM.seekBackButton.style.display = "-webkit-flex"; // Safari >= 6.1
		this.shadowDOM.seekBackButton.style.marginLeft = "6px";
		this.shadowDOM.seekBackButton.style.width = "20px";
		this.shadowDOM.seekBackButton.style.height = "12px";
		this.shadowDOM.seekForwardButton.style.display = "-webkit-box"; // Safari < 6.1
		this.shadowDOM.seekForwardButton.style.display = "-webkit-flex"; // Safari >= 6.1
		this.shadowDOM.seekForwardButton.style.marginLeft = "6px";
		this.shadowDOM.seekForwardButton.style.width = "20px";
		this.shadowDOM.seekForwardButton.style.height = "12px";
	}
};

/***********************
SourceSelector interface
***********************/

MediaPlayer.prototype.initSourceSelector = function() {
	var player = this;
	var container = document.createElement("div");
	container.className = "CTPsourceSelector CTPhidden";
	var list = document.createElement("div");
	list.className = "CTPsourceList";
	container.appendChild(list);
	
	var append = function(name, click, url, source) {
		var a = document.createElement("a");
		a.className = "CTPsourceItem";
		if(url) a.href = url;
		a.textContent = name;
		
		a.addEventListener("click", function(event) {
			event.stopImmediatePropagation(); // Needed on Facebook
			if(event.altKey) return; // to allow option-click download
			click(source);
			event.preventDefault();
		}, false);
		if(source !== undefined) a.addEventListener("contextmenu", function(event) {event.source = source;}, false);
		list.appendChild(a);
	};
	
	var clickSource = function(i) {
		player.currentSource = i;
		loadMedia(player.contextInfo.elementID, true);
	};
	var clickPlugin = function() {loadPlugin(player.contextInfo.elementID);};
	var clickQTP = function() {player.openInQTP();};
	var clickAirPlay = function() {player.airplay();};
	var clickSite = function() {player.viewOnSite();};
	
	this.sourceSelector = {
		"updateHandlers": function() {
			clickSource = function(i) {player.switchSource(i);};
			clickPlugin = function() {restorePlugin(player.contextInfo.elementID);};
		},
		
		"attachTo": function(element) {
			container.style.setProperty("-webkit-transition-property", "none", "important");
			element.appendChild(container);
			setTimeout(function() {container.style.setProperty("-webkit-transition-property", "opacity", "important");}, 0);
		},
		
		"update": function() {
			container.classList.add("CTPhidden");
			list.innerHTML = "";
			var media = player.playlist[player.currentTrack];
			if(settings.showMediaSources) {
				for(var i = 0; i < media.sources.length; i++) {
					var format = media.sources[i].format;
					append(format ? format : "HTML5", clickSource, media.sources[i].url, i);
				}
				if(player.currentSource !== undefined) list.childNodes[player.currentSource].classList.add("CTPcurrentSource");
			}
			if(settings.showPluginSource && player.contextInfo.plugin) append(player.contextInfo.plugin, clickPlugin, player.contextInfo.src);
			if(settings.showSiteSource && media.siteInfo) append(media.siteInfo.name, clickSite, media.siteInfo.url);
			if(settings.showQTPSource && player.currentSource !== undefined) append(QT_PLAYER, clickQTP);
			if(settings.showAirPlaySource && player.currentSource !== undefined) append("AirPlay", clickAirPlay);

			// Unhide if it doesn't overflow
			if(list.childNodes.length > 0 && container.offsetWidth + 10 < player.width && container.offsetHeight + (player.mediaElement ? 35 : 10) < player.height) container.classList.remove("CTPhidden");
		},

		"setSource": function(i) {
			list.childNodes[player.currentSource].classList.remove("CTPcurrentSource");
			list.childNodes[i].classList.add("CTPcurrentSource");
		}
	};
};

/**********************
TrackSelector interface
**********************/

MediaPlayer.prototype.initTrackSelector = function() {
	var player = this;
	var container = document.createElement("div");
	container.className = "CTPtrackSelector CTPhidden";
	var status = document.createElement("div");
	status.className = "CTPstatusDisplay";
	var selector = document.createElement("select");
	selector.className = "CTPtrackList";
	
	container.appendChild(status)
	container.appendChild(selector);
	
	var leftOffset = 53;
	if(settings.hideRewindButton) leftOffset -= 26;
	if(this.playlistLength > 1) leftOffset += 52;
	
	var showLoading = function() {
		if(player.mediaElement.controls) player.shadowDOM.controlsPanel.style.width = leftOffset + "px";
		player.shadowDOM.fullscreenButton.style.display = "none";
		player.shadowDOM.volumeSliderContainer.style.display = "none";
		player.shadowDOM.muteButton.style.display = "none";
		player.shadowDOM.timelineContainer.style.display = "none";
		if(player.mediaElement.controls) container.style.setProperty("left", leftOffset + "px", "important");
		if(player.mediaElement.controls) container.style.setProperty("width", (player.width - leftOffset) + "px", "important");
		container.classList.remove("CTPhidden");
	};
	
	var hideLoading = function() {
		container.classList.add("CTPhidden");
		player.shadowDOM.timelineContainer.style.removeProperty("display");
		player.shadowDOM.muteButton.style.removeProperty("display");
		player.shadowDOM.volumeSliderContainer.style.removeProperty("display");
		player.shadowDOM.fullscreenButton.style.removeProperty("display");
		player.shadowDOM.controlsPanel.style.removeProperty("width");
		status.textContent = "";
	};
	
	var show = function() {
		player.shadowDOM.controlsPanel.style.display = "none";
		container.style.setProperty("left", "0px", "important");
		container.style.setProperty("width", "inherit", "important");
		container.classList.remove("CTPhidden");
		selector.focus();
	};
	
	var hide = function() {
		player.container.focus();
		container.classList.add("CTPhidden");
		player.shadowDOM.controlsPanel.style.removeProperty("display");
	};
	
	this.trackSelector = {
		"toggle": function() {
			if(container.classList.contains("CTPhidden")) show();
			else hide();
		},
		
		"update": function() {
			if(player.shadowDOM.controlsPanel.style.display === "none") hide();
			selector.value = player.currentTrack;
			if(player.mediaElement.preload !== "none") status.textContent = LOADING + " "; // en-space
			showLoading();
		},
	};
	
	this.mediaElement.addEventListener("loadedmetadata", hideLoading, false);
	this.container.appendChild(container);
	
	if(this.playlistLength === 1) {
		selector.disabled = true;
		var option = document.createElement("option");
		option.value = 0;
		if(this.playlist[0].title) option.textContent = this.playlist[0].title;
		selector.appendChild(option);
		return;
	}
	
	for(var i = 0; i < this.playlistLength; i++) {
		var option = document.createElement("option");
		option.disabled = true;
		option.value = (i + this.playlistLength - this.startTrack) % this.playlistLength;
		option.textContent = "[" + (i+1) + "/" + this.playlistLength + "]\u2002" + LOADING;
		selector.appendChild(option);
	}
	
	this.trackSelector.add = function(playlist) {
		var start = player.playlist.length - playlist.length;
		for(var i = 0; i < playlist.length; i++) {
			var track = player.printTrack(i + start);
			var option = selector.childNodes[track - 1];
			var title = "[" + track + "/" + player.playlistLength + "]\u2002";
			if(playlist[i] !== null) {
				option.disabled = false;
				if(playlist[i].title) title += playlist[i].title;
			}
			option.textContent = title;
		}
	};
	
	selector.addEventListener("change", function(event) {
		player.loadTrack(parseInt(event.target.value));
		player.container.focus();
	}, false);
	if(settings.keys.trackSelector) { // override keydown shortcuts
		selector.addEventListener("keydown", function(event) {
			if((event.keyIdentifier === "U+0020" || event.keyIdentifier === "Up" || event.keyIdentifier === "Down") && !event.shiftKey && !event.metaKey && !event.altKey && !event.ctrlKey) event.allowDefault = true;
		}, false);
	}
	
	this.trackSelector.add(this.playlist);
};
