if(location.href !== "about:blank") {

/***************************
MediaPlayer class definition
****************************/

function MediaPlayer() {
	this.playlist = [];
	this.shadowDOM = {};
}

MediaPlayer.prototype.handleMediaData = function(mediaData) {
	if(mediaData.loadAfter) { // just adding stuff to the playlist
		this.playlist = this.playlist.concat(mediaData.playlist);
		if(this.trackInfo) this.addToSelector(mediaData.playlist);
	} else { // initial mediaData
		this.audioOnly = mediaData.audioOnly;
		this.playlist = mediaData.playlist.concat(this.playlist);
		this.playlistLength = mediaData.playlistLength ? mediaData.playlistLength : mediaData.playlist.length;
		this.currentSource = mediaData.playlist[0].defaultSource;
		this.startTrack = mediaData.startTrack ? mediaData.startTrack : 0;
		this.playlistControls = this.playlistLength > 1 && this.currentSource !== undefined;
	}
};

MediaPlayer.prototype.init = function(width, height, style, contextInfo) {
	this.containerElement = document.createElement("div");
	this.containerElement.className = "CTPmediaPlayer";
	this.containerElement.tabIndex = -1; // make focusable
	this.containerElement.addEventListener("click", function(event) {event.stopPropagation();}, false);
	
	var styleElement = document.createElement("style"); // use scoped attribute when supported
	this.containerElement.appendChild(styleElement);
	
	this.mediaElement = document.createElement(this.audioOnly ? "audio" : "video");
	this.mediaElement.className = "CTPmediaElement";
	this.mediaElement.id = "CTPmediaElement" + contextInfo.elementID;
	this.mediaElement.setAttribute("controls", "");
	switch(settings.initialBehavior) {
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
	this.containerElement.appendChild(this.mediaElement);
	
	// Set dimensions & CSS
	this.width = width;
	this.height = height;
	this.containerElement.style.width = width + "px !important";
	this.containerElement.style.height = height + "px !important";
	this.mediaElement.style.width = width + "px";
	this.mediaElement.style.height = height + "px";
	applyCSS(this.containerElement, style, ["position", "top", "right", "bottom", "left", "z-index", "clear", "float", "vertical-align", "margin-top", "margin-right", "margin-bottom", "margin-left", "-webkit-margin-before-collapse", "-webkit-margin-after-collapse"]);
	
	// Set volume
	this.mediaElement.volume = settings.volume;
	
	// Set global contextInfo
	this.contextInfo = contextInfo;
	
	// Set listeners
	var _this = this;
	this.containerElement.addEventListener("contextmenu", function(event) {
		_this.setContextInfo(event, contextInfo);
		event.stopPropagation();
	}, false);
	this.mediaElement.addEventListener("loadedmetadata", function() {_this.handleLoadedMetadataEvent();}, false);
	if(this.playlistControls) this.mediaElement.addEventListener("ended", function() {
		if(!_this.mediaElement.loop) _this.nextTrack();
	}, false);
	
	// Additional controls
	this.initializeTrackInfo();
	if(this.playlistControls) this.initializePlaylistControls();
	if(settings.showSourceSelector) this.initializeSourceSelector();
	
	// Set keyboard shortcuts
	this.registerShortcuts();
};

MediaPlayer.prototype.handleLoadedMetadataEvent = function() {
	this.hideTrackInfo();
	this.trackInfo.firstChild.textContent = "";
};

MediaPlayer.prototype.initializeShadowDOM = function() {
	var stylesheet = this.containerElement.firstChild.sheet;
	var pseudoElements = {"controlsPanel": "-webkit-media-controls-panel", "playButton": "-webkit-media-controls-play-button", "muteButton": "-webkit-media-controls-mute-button", "volumeSliderContainer": "-webkit-media-controls-volume-slider-container", "rewindButton": "-webkit-media-controls-rewind-button", "fullscreenButton": "-webkit-media-controls-fullscreen-button", "timelineContainer": "-webkit-media-controls-timeline-container", "statusDisplay": "-webkit-media-controls-status-display", "seekBackButton": "-webkit-media-controls-seek-back-button", "seekForwardButton": "-webkit-media-controls-seek-forward-button"};//, "volumeSlider": "-webkit-media-controls-volume-slider", "toggleClosedCaptionsButton": "-webkit-media-controls-toggle-closed-captions-button", "timeline": "-webkit-media-controls-timeline", "currentTimeDisplay": "-webkit-media-controls-current-time-display", "timeRemainingDisplay": "-webkit-media-controls-time-remaining-display", "returnToRealtimeButton": "-webkit-media-controls-return-to-realtime-button"};
	
	for(var e in pseudoElements) {
		stylesheet.insertRule("#CTPmediaElement" + this.contextInfo.elementID + ":not(:-webkit-full-screen)::" + pseudoElements[e] + "{}", 0);
		this.shadowDOM[e] = stylesheet.cssRules[0];
	}
	
	// Status display
	this.shadowDOM.statusDisplay.style.display = "none";
	
	// Rewind button
	if(settings.hideRewindButton) this.shadowDOM.rewindButton.style.display = "none";
	
	// Playlist controls
	if(this.playlistControls) {
		// Re-order controls
		this.shadowDOM.rewindButton.style.WebkitBoxOrdinalGroup = "1";
		this.shadowDOM.seekBackButton.style.WebkitBoxOrdinalGroup = "2";
		this.shadowDOM.playButton.style.WebkitBoxOrdinalGroup = "3";
		this.shadowDOM.seekForwardButton.style.WebkitBoxOrdinalGroup = "4";
		this.shadowDOM.statusDisplay.style.WebkitBoxOrdinalGroup = "5";
		this.shadowDOM.timelineContainer.style.WebkitBoxOrdinalGroup = "6";
		this.shadowDOM.muteButton.style.WebkitBoxOrdinalGroup = "7";
		this.shadowDOM.fullscreenButton.style.WebkitBoxOrdinalGroup = "9";
		
		// Show back/forward buttons
		this.shadowDOM.seekBackButton.style.display = "-webkit-box";
		this.shadowDOM.seekBackButton.style.marginLeft = "6px";
		this.shadowDOM.seekBackButton.style.width = "20px";
		this.shadowDOM.seekBackButton.style.height = "12px";
		this.shadowDOM.seekForwardButton.style.display = "-webkit-box";
		this.shadowDOM.seekForwardButton.style.marginLeft = "6px";
		this.shadowDOM.seekForwardButton.style.width = "20px";
		this.shadowDOM.seekForwardButton.style.height = "12px";
	}
};

MediaPlayer.prototype.initializeTrackInfo = function() {
	this.trackInfo = document.createElement("div");
	this.trackInfo.className = "CTPtrackInfo";
	var statusDisplay = document.createElement("div");
	statusDisplay.className = "CTPstatusDisplay";
	var trackSelector = document.createElement("select");
	trackSelector.className = "CTPtrackSelector";
	this.trackInfo.appendChild(statusDisplay);
	this.trackInfo.appendChild(trackSelector);
	this.containerElement.appendChild(this.trackInfo);
	
	if(this.playlistControls) {
		this.addToSelector(this.playlist);
		
		var _this = this;
		trackSelector.addEventListener("change", function(event) {
			_this.loadTrack(parseInt(event.target.value));
			_this.containerElement.focus();
		}, false);
		if(settings.showTitleShortcut && settings.showTitleShortcut.type === "keydown") { // override keydown shortcuts
			trackSelector.addEventListener("keydown", function(event) {
				if((event.keyIdentifier === "U+0020" || event.keyIdentifier === "Up" || event.keyIdentifier === "Down") && !event.shiftKey && !event.metaKey && !event.altKey && !event.ctrlKey) event.allowDefault = true;
			}, false);
		}
	} else {
		trackSelector.disabled = true;
		var option = document.createElement("option");
		if(this.playlist[0].title) option.textContent = this.playlist[0].title;
		trackSelector.appendChild(option);
	}
};

MediaPlayer.prototype.addToSelector = function(playlist) {
	var firstTrack = this.trackInfo.lastChild.querySelector("[value='0']");
	var start = this.playlist.length - playlist.length;
	for(var i = 0; i < playlist.length; i++) {
		if(playlist[i] === null) continue;
		var option = document.createElement("option");
		var track = i + start;
		option.value = track;
		var title = "[" + this.printTrack(track) + "/" + this.playlistLength + "]\u2002";
		if(playlist[i].title) title += playlist[i].title;
		option.textContent = title;
		if(firstTrack === null) firstTrack = option;
		if(this.printTrack(track) <= this.startTrack) this.trackInfo.lastChild.insertBefore(option, firstTrack);
		else this.trackInfo.lastChild.appendChild(option);
	}
};

MediaPlayer.prototype.showTrackInfo = function(isLoading) {
	var leftOffset = 0;
	if(isLoading) {
		leftOffset = 53;
		if(settings.hideRewindButton) leftOffset -= 26;
		if(this.playlistControls) leftOffset += 52;
		this.shadowDOM.controlsPanel.style.width = leftOffset + "px";
		this.shadowDOM.fullscreenButton.style.display = "none";
		this.shadowDOM.volumeSliderContainer.style.display = "none";
		this.shadowDOM.muteButton.style.display = "none";
		this.shadowDOM.timelineContainer.style.display = "none";
	} else {
		this.shadowDOM.controlsPanel.style.display = "none";
	}
	
	this.trackInfo.style.left = leftOffset + "px !important";
	this.trackInfo.style.width = (this.width - leftOffset) + "px !important";
	this.trackInfo.classList.remove("CTPhidden");
};

MediaPlayer.prototype.hideTrackInfo = function() {
	this.trackInfo.classList.add("CTPhidden");
	this.shadowDOM.timelineContainer.style.removeProperty("display");
	this.shadowDOM.muteButton.style.removeProperty("display");
	this.shadowDOM.volumeSliderContainer.style.removeProperty("display");
	this.shadowDOM.fullscreenButton.style.removeProperty("display");
	this.shadowDOM.controlsPanel.style.width = this.width + "px";
	this.shadowDOM.controlsPanel.style.removeProperty("display");
};

MediaPlayer.prototype.initializePlaylistControls = function() {
	var _this = this;
	var x = 26;
	if(settings.hideRewindButton) x = 0;
	this.containerElement.addEventListener("click", function(event) {
		var coord = _this.getCoordinates(event);
		if(coord.y + 25 > _this.height) { // click in controls
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

MediaPlayer.prototype.initializeSourceSelector = function() {
	var _this = this;
	this.sourceSelector = new SourceSelector(this.contextInfo.plugin,
		function(event) {restorePlugin(_this.contextInfo.elementID);},
		function(event) {viewInQuickTimePlayer(_this.contextInfo.elementID);},
		function(event, source) {_this.switchSource(source);},
		function(event, source) {_this.setContextInfo(event, _this.contextInfo, source);}
	);
	
	this.containerElement.appendChild(this.sourceSelector.containerElement);
	
	// Cancel mouseout to source selector
	this.containerElement.addEventListener("mouseout", function(event) {
		if(event.target === _this.mediaElement && event.relatedTarget && event.relatedTarget.compareDocumentPosition(this) === 10) event.preventDefault();
	}, false);
};

MediaPlayer.prototype.nextTrack = function() {
	var track = this.currentTrack;
	do {
		track = this.normalizeTrack(track + 1);
	} while(this.playlist[track] === null);
	if(track === this.currentTrack) return;
	this.loadTrack(track);
};

MediaPlayer.prototype.prevTrack = function() {
	var track = this.currentTrack;
	do {
		track = this.normalizeTrack(track - 1);
	} while(this.playlist[track] === null);
	if(track === this.currentTrack) return;
	this.loadTrack(track);
};

MediaPlayer.prototype.normalizeTrack = function(track) {
	track = track % this.playlist.length;
	if(track < 0) track += this.playlist.length; // stupid JS behavior
	return track;
};

MediaPlayer.prototype.setPoster = function() {
	if(this.playlist[this.currentTrack].poster) {
		if(this.playlist[this.currentTrack].sources[this.currentSource].isAudio) {
			if(this.mediaElement.hasAttribute("poster")) this.mediaElement.removeAttribute("poster");
			this.containerElement.style.backgroundImage = "url('" + this.playlist[this.currentTrack].poster + "') !important";
		} else {
			this.mediaElement.poster = this.playlist[this.currentTrack].poster;
			this.containerElement.style.backgroundImage = "none !important";
		}
	} else {
		if(this.mediaElement.hasAttribute("poster")) this.mediaElement.removeAttribute("poster");
		this.containerElement.style.backgroundImage = "none !important";
	}
};

MediaPlayer.prototype.loadTrack = function(track, init) {
	var source = this.currentTrack === undefined ? this.currentSource : this.playlist[track].defaultSource;
	this.load(track, source, !init);
	
	if(this.sourceSelector) {
		this.sourceSelector.hide();
		this.sourceSelector.init(this.playlist[track].sources);
		this.sourceSelector.setCurrentSource(source);
		this.sourceSelector.unhide(this.width, this.height);
	}
};

MediaPlayer.prototype.switchSource = function(source) {
	if(source === this.currentSource) return;
	this.sourceSelector.setCurrentSource(source);
	
	var currentTime = this.mediaElement.currentTime;
	var setInitialTime = function(event) {
		event.target.removeEventListener("loadedmetadata", setInitialTime, false);
		event.target.currentTime = currentTime;
	};
	
	this.load(this.currentTrack, source, true);
	this.mediaElement.addEventListener("loadedmetadata", setInitialTime, false);
};

MediaPlayer.prototype.load = function(track, source, autoplay) {
	// Pause first to prevent undesirable quirks
	// Conditional needed, otherwise Webkit fails to reset autoplaying flag on initial load
	if(!this.mediaElement.paused) this.mediaElement.pause();
	this.currentTrack = track;
	this.currentSource = source;
	this.mediaElement.src = this.playlist[track].sources[source].url;
	this.setPoster(); // If this is set before src, poster is not shown!
	if(autoplay) {
		this.mediaElement.preload = "auto";
		this.mediaElement.autoplay = true;
	}
	
	this.hideTrackInfo();
	this.trackInfo.lastChild.value = track;
	if(this.mediaElement.preload !== "none") this.trackInfo.firstChild.textContent = LOADING + "\u2002";
	this.showTrackInfo(true);
	
	if(this.mediaElement.autoplay && settings.instantPlay) this.mediaElement.play();
};

MediaPlayer.prototype.toggleLooping = function() {
	if(this.mediaElement.loop) this.mediaElement.loop = false;
	else this.mediaElement.loop = true;
};

MediaPlayer.prototype.setContextInfo = function(event, contextInfo, source) {
	var track = this.currentTrack;
	if(track === undefined) track = 0;
	if(source === undefined) source = this.currentSource;
	contextInfo.siteInfo = this.playlist[track].siteInfo;
	contextInfo.hasMedia = true;
	contextInfo.isMedia = this.currentTrack !== undefined;
	contextInfo.source = source;
	if(source !== undefined) contextInfo.isAudio = this.playlist[track].sources[source].isAudio;
	safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
};

MediaPlayer.prototype.printTrack = function(track) {
	return (track + this.startTrack) % this.playlistLength + 1;
};

MediaPlayer.prototype.registerShortcuts = function() {
	var _this = this;
	if(settings.playPauseShortcut) {
		this.addEventListener(settings.playPauseShortcut.type, function(event) {
			if(testShortcut(event, settings.playPauseShortcut)) {
				if(_this.mediaElement.paused) _this.mediaElement.play();
				else _this.mediaElement.pause();
			}
		});
	}
	if(settings.enterFullscreenShortcut) {
		this.addEventListener(settings.enterFullscreenShortcut.type, function(event) {
			if(testShortcut(event, settings.enterFullscreenShortcut)) {
				if(_this.mediaElement.webkitDisplayingFullscreen) _this.mediaElement.webkitExitFullscreen();
				else _this.mediaElement.webkitEnterFullscreen();
			}
		});
	}
	if(settings.volumeUpShortcut) {
		this.addEventListener(settings.volumeUpShortcut.type, function(event) {
			if(testShortcut(event, settings.volumeUpShortcut)) {
				var newVolume = _this.mediaElement.volume + .1;
				if(newVolume > 1) _this.mediaElement.volume = 1;
				else _this.mediaElement.volume = newVolume;
			}
		});
	}
	if(settings.volumeDownShortcut) {
		this.addEventListener(settings.volumeDownShortcut.type, function(event) {
			if(testShortcut(event, settings.volumeDownShortcut)) {
				var newVolume = _this.mediaElement.volume - .1;
				if(newVolume < 0) _this.mediaElement.volume = 0;
				else _this.mediaElement.volume = newVolume;
			}
		});
	}
	if(this.playlistControls) {
		if(settings.prevTrackShortcut) {
			this.addEventListener(settings.prevTrackShortcut.type, function(event) {
				if(testShortcut(event, settings.prevTrackShortcut)) _this.prevTrack();
			});
		}
		if(settings.nextTrackShortcut) {
			this.addEventListener(settings.nextTrackShortcut.type, function(event) {
				if(testShortcut(event, settings.nextTrackShortcut)) _this.nextTrack();
			});
		}
	}
	if(settings.toggleLoopingShortcut) {
		this.addEventListener(settings.toggleLoopingShortcut.type, function(event) {
			if(testShortcut(event, settings.toggleLoopingShortcut)) _this.toggleLooping();
		});
	}
	if(settings.showTitleShortcut && (this.playlist[0].title || this.playlistControls)) {
		this.addEventListener(settings.showTitleShortcut.type, function(event) {
			if(_this.mediaElement.readyState === 0) return;
			event.allowDefault = false;
			if(testShortcut(event, settings.showTitleShortcut)) {
				if(_this.trackInfo.classList.contains("CTPhidden")) {
					_this.showTrackInfo(false);
					_this.trackInfo.lastChild.focus();
				} else {
					_this.hideTrackInfo();
					_this.containerElement.focus();
				}
			}
		});
	}
};

MediaPlayer.prototype.addEventListener = function(type, handler) {
	if(type === "click" || type === "dblclick") { // ignore clicks on controls
		var _this = this;
		this.containerElement.addEventListener(type, function(event) {
			if(!(event.target === this || event.target.hasAttribute("controls")) || event.offsetY + _this.mediaElement.offsetTop + 25 > _this.height) return;
			handler(event);
		}, false);
	} else {
		this.containerElement.addEventListener(type, function(event) {
			if(event.allowDefault) return;
			handler(event);
		}, false);
	}
};

MediaPlayer.prototype.getCoordinates = function(event) {
	var x = event.offsetX, y = event.offsetY;
	var e = event.target;
	do {
		if(e === this.containerElement) break;
		x += e.offsetLeft;
		y += e.offsetTop;
	} while(e = e.offsetParent);
	return {"x": x, "y": y};
};

}
