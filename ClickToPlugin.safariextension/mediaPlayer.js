/***************************
mediaPlayer class definition
****************************/

function mediaPlayer() {
    
    this.playerType; // audio or video
    this.playlist = new Array();
    this.playlistLength = 0; // not necessarily synced with playlist.length!
    
    this.startTrack; // internal start track is always 0
    // when startTrack is set, createMediaElement can be called
    this.currentTrack; // for the user, current track is startTrack + currentTrack + 1
    // currentTrack is set iff loadTrack has been called
    this.currentSource; // the source being used for the currentTrack (an integer)
    
    this.containerElement;
    this.mediaElement; // the HTML video/audio element
    
    // Shadow DOM
    this.shadowDOM = new Object();
    
    // Dimensions of the container
    this.width;
    this.height;
    
    this.contextInfo;
    
    // Additional HTML elements
    this.trackInfo;
    this.playlistControls;
    this.sourceSelector;
    
    // The following will be redefined if playlist controls are present
    this.showControls = function(fade) {};
    this.hideControls = function(fade) {};
    
}

mediaPlayer.prototype.handleMediaData = function(mediaData) {
    if(mediaData.loadAfter) { // just adding stuff to the playlist
        this.playlistLength -= mediaData.missed;
        this.addToPlaylist(mediaData.playlist);
    } else { // initial mediaData
        this.playerType = mediaData.isAudio ? "audio" : "video";
        this.addToPlaylist(mediaData.playlist, true);
        this.playlistLength = mediaData.playlistLength ? mediaData.playlistLength : mediaData.playlist.length;
        this.currentSource = mediaData.playlist[0].defaultSource;
        this.startTrack = mediaData.startTrack ? mediaData.startTrack : 0;
        this.playlistControls = !mediaData.noPlaylistControls && this.playlistLength > 1;
    }
};

mediaPlayer.prototype.createMediaElement = function(width, height, style, contextInfo) {
    this.containerElement = document.createElement("div");
    this.containerElement.className = "CTFmediaPlayer" + (settings.hideRewindButton ? " CTFnoRewindButton" : "");
    this.containerElement.tabIndex = -1;
    
    var styleElement = document.createElement("style");
    styleElement.type = "text/css";
    this.containerElement.appendChild(styleElement);
    
    this.mediaElement = document.createElement(this.playerType);
    this.mediaElement.className = "CTFmediaElement";
    this.mediaElement.id = "CTFmediaElement" + contextInfo.elementID;
    this.mediaElement.setAttribute("controls", "");
    if(settings.preload) this.mediaElement.setAttribute("preload", "auto");
    else this.mediaElement.setAttribute("preload", "none");
    this.containerElement.appendChild(this.mediaElement);
    
    // Set dimensions
    this.width = width;
    this.height = height;
    this.containerElement.style.width = width + "px !important";
    this.containerElement.style.height = height + "px !important";
    // z-index: < 1 -> 1 (avoid WebKit font-rendering bugs with transitions)
    var zIndex = style.getPropertyValue("z-index");
    if(zIndex === "auto" || parseInt(zIndex) < 1) this.containerElement.style.setProperty("z-index", "1", "important");
    else this.containerElement.style.setProperty("z-index", zIndex, "important");
    applyCSS(this.containerElement, style, ["position", "top", "right", "bottom", "left", "clear", "float", "margin-top", "margin-right", "margin-bottom", "margin-left", "-webkit-margin-top-collapse", "-webkit-margin-right-collapse", "-webkit-margin-bottom-collapse", "-webkit-margin-left-collapse"]);
    
    // Set volume
    this.mediaElement.volume = settings.volume;
    
    // Set global contextInfo
    this.contextInfo = contextInfo;
    
    // Set listeners
    var _this = this;
    this.mediaElement.addEventListener("contextmenu", function(event) {
        _this.setContextInfo(event, contextInfo);
        event.stopPropagation();
    }, false);
    this.mediaElement.addEventListener("loadedmetadata", function() {_this.fixAspectRatio();}, false);
    this.mediaElement.addEventListener("ended", function() {_this.showControls(true); _this.nextTrack();}, false);
    
    // Make the mediaPlayer a single element for mousover/mouseout events
    this.containerElement.addEventListener("mouseover", function(event) {
        this.isInFocus = true;
        _this.showControls(true);
        if(event.target === _this.mediaElement) return;
        var e = document.createEvent("MouseEvents");
        e.initMouseEvent("mouseover", false, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        _this.mediaElement.dispatchEvent(e);
    }, false);
    this.containerElement.addEventListener("mouseout", function(event) {
        if(event.relatedTarget && (event.relatedTarget === this || event.relatedTarget.compareDocumentPosition(this) === 10 || event.relatedTarget.hasAttribute("precision"))) {// shadow DOM leaks fully in relatedTarget!
            if(event.target === _this.mediaElement) event.preventDefault();
            return;
        }
        this.isInFocus = false;
        _this.hideControls(true);
        var e = document.createEvent("MouseEvents");
        e.initMouseEvent("mouseout", false, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        _this.mediaElement.dispatchEvent(e);
    }, false);
    this.mediaElement.addEventListener("play", function(event) {if(!_this.containerElement.isInFocus) _this.hideControls(true);}, false);
    this.mediaElement.addEventListener("pause", function(event) {_this.showControls(true);}, false);

    // Additional controls
    if(this.playlist[0].title || this.playlistControls) this.initializeTrackInfo();
    if(this.playlistControls) this.initializePlaylistControls();
    if(settings.showSourceSelector) this.initializeSourceSelector();
    
    // Set keyboard shortcuts
    this.registerShortcuts();
};

mediaPlayer.prototype.initializeShadowDOM = function() {
    var stylesheet = this.containerElement.firstChild.sheet;
    var pseudoElements = {"controlsPanel": "-webkit-media-controls-panel", "playButton": "-webkit-media-controls-play-button", "muteButton": "-webkit-media-controls-mute-button", "rewindButton": "-webkit-media-controls-rewind-button", "fullscreenButton": "-webkit-media-controls-fullscreen-button", "timelineContainer": "-webkit-media-controls-timeline-container", "volumeSliderContainer": "-webkit-media-controls-volume-slider-container", "volumeSlider": "-webkit-media-controls-volume-slider", "statusDisplay": "-webkit-media-controls-status-display"}; //, "timeline": "-webkit-media-controls-timeline", "currentTimeDisplay": "-webkit-media-controls-current-time-display", "timeRemainingDisplay": "-webkit-media-controls-time-remaining-display", "returnToRealtimeButton": "-webkit-media-controls-return-to-realtime-button", "seekBackButton": "-webkit-media-controls-seek-back-button", "seekForwardButton": "-webkit-media-controls-seek-forward-button", "toggleClosedCaptionsButton": "-webkit-media-controls-toggle-closed-captions-button"};
    
    for(var e in pseudoElements) {
        stylesheet.insertRule("#CTFmediaElement" + this.contextInfo.elementID + "::" + pseudoElements[e] + "{}", 0);
        this.shadowDOM[e] = stylesheet.cssRules[0];
    }
    
    // Status display
    if(this.trackInfo) this.shadowDOM.statusDisplay.style.display = "none";
    
    // Rewind button
    if(settings.hideRewindButton) this.shadowDOM.rewindButton.style.display = "none";
    
    // Playlist controls
    if(this.playlistControls) this.shadowDOM.playButton.style.cssText = "margin-left: 36px; margin-right: 30px;";
    
    // Set controls width once and for all
    this.shadowDOM.controlsPanel.style.width = this.width + "px";
    
    // Volume slider
    if(settings.showVolumeSlider && !/\+/.test(navigator.appVersion)) {
        this.shadowDOM.controlsPanel.style.overflow = "visible";
        this.shadowDOM.volumeSliderContainer.style.cssText = "display: block; -webkit-appearance: none; height: 80px; width: 15px;";
        this.shadowDOM.volumeSlider.style.cssText = "display: block; -webkit-appearance: slider-vertical; height: 80px; width: 15px;";
    }
};

mediaPlayer.prototype.initializeTrackInfo = function() {
    this.trackInfo = document.createElement("div");
    this.trackInfo.className = "CTFtrackInfo";
    this.containerElement.appendChild(this.trackInfo);
};

mediaPlayer.prototype.showTrackInfo = function(isLoading) {
    var leftOffset = 0;
    if(isLoading) {
        leftOffset = 53;
        if(this.shadowDOM.rewindButton.style.display === "none") leftOffset -= 26;
        if(this.playlistControls) leftOffset += 58;
        this.shadowDOM.controlsPanel.style.width = leftOffset + "px";
        this.shadowDOM.fullscreenButton.style.display = "none";
        this.shadowDOM.volumeSliderContainer.style.display = "none";
        this.shadowDOM.muteButton.style.display = "none";
        this.shadowDOM.timelineContainer.style.display = "none";
    } else {
        this.shadowDOM.controlsPanel.style.display = "none";
        if(this.playlistControls) this.playlistControls.style.display = "none !important";
    }
    
    this.trackInfo.style.left = leftOffset + "px !important";
    this.trackInfo.style.width = (this.width - leftOffset) + "px !important";
    this.trackInfo.style.display = "-webkit-box !important";
};

mediaPlayer.prototype.hideTrackInfo = function() {
    this.trackInfo.style.display = "none !important";
    this.shadowDOM.timelineContainer.style.removeProperty("display");
    this.shadowDOM.muteButton.style.removeProperty("display");
    this.shadowDOM.volumeSliderContainer.style.removeProperty("display");
    this.shadowDOM.fullscreenButton.style.removeProperty("display");
    this.shadowDOM.controlsPanel.style.width = this.width + "px";
    this.shadowDOM.controlsPanel.style.removeProperty("display");
    if(this.playlistControls) this.playlistControls.style.display = "-webkit-box !important";
};

mediaPlayer.prototype.initializePlaylistControls = function() {
    this.playlistControls = document.createElement("div");
    this.playlistControls.className = "CTFplaylistControls";
    this.playlistControls.style.display = "-webkit-box !important";
    this.playlistControls.style.left = settings.hideRewindButton ? "5px" : "31px";
    
    var prevButton = document.createElement("div");
    prevButton.className = "CTFprevButton";
    prevButton.textContent = "0";
    this.playlistControls.appendChild(prevButton);
    var nextButton = document.createElement("div");
    nextButton.className = "CTFnextButton";
    nextButton.textContent = "1";
    this.playlistControls.appendChild(nextButton);
    
    var _this = this;
    this.showControls = function(fade) {
        opacityTransition(_this.playlistControls, 1, fade ? .17 : 0, 0, "ease-in");
    };
    this.hideControls = function(fade) {
        if(_this.mediaElement.paused || this.playlist[this.currentTrack].sources[this.currentSource].mediaType === "audio") return;
        opacityTransition(_this.playlistControls, 0, fade ? .3 : 0, 0, "ease-in");
    };
    
    prevButton.addEventListener("click", function() {
        _this.jumpTrack(-1);
    }, false);
    nextButton.addEventListener("click", function() {
        _this.jumpTrack(1);
    }, false);
    
    this.containerElement.appendChild(this.playlistControls);
};

mediaPlayer.prototype.initializeSourceSelector = function() {
    var _this = this;
    this.sourceSelector = new sourceSelector(this.contextInfo.plugin,
        function(event) {restorePlugin(_this.contextInfo.elementID);},
        function(event) {_this.mediaElement.pause(); viewInQuickTimePlayer(_this.contextInfo.elementID);},
        function(event, source) {_this.switchSource(source);},
        function(event, source) {_this.setContextInfo(event, _this.contextInfo, source);}
    );
    
    this.containerElement.appendChild(this.sourceSelector.containerElement);
};

mediaPlayer.prototype.fixAspectRatio = function() {
    if(this.trackInfo) {
        this.hideTrackInfo();
        this.trackInfo.firstChild.textContent = "";
    }
    var w = this.mediaElement.videoWidth;
    var h = this.mediaElement.videoHeight;
    if(!w || !h) { // audio source
        this.mediaElement.style.width = this.width + "px";
        this.mediaElement.style.height = (this.height < 25 ? "25" : this.height) + "px";
    } else if (w/h > this.width/this.height) {
        var height = h/w*this.width;
        this.mediaElement.style.width = this.width + "px";
        this.mediaElement.style.height = height + "px";
        this.shadowDOM.controlsPanel.style.bottom = Math.floor((height - this.height)*.5) + "px";
    } else {
        var width = w/h*this.height;
        this.mediaElement.style.height = this.height + "px";
        this.mediaElement.style.width = width + "px";
        this.shadowDOM.controlsPanel.style.left = Math.round((width - this.width)*.5) + "px";
    }
};

mediaPlayer.prototype.resetAspectRatio = function() {
    this.shadowDOM.controlsPanel.style.removeProperty("left");
    this.shadowDOM.controlsPanel.style.removeProperty("bottom");
    this.mediaElement.style.width = this.width + "px";
    this.mediaElement.style.height = this.height + "px";
};

mediaPlayer.prototype.nextTrack = function() {
    if(!this.mediaElement.hasAttribute("loop")) {
        if(this.currentTrack + this.startTrack + 1 === this.playlistLength) return;
        this.loadTrack(this.currentTrack + 1, true);
    }
};

mediaPlayer.prototype.jumpTrack = function(diff) {
    if(this.playlist.length === 1) return;
    this.loadTrack(this.currentTrack + diff, true);
};

mediaPlayer.prototype.loadTrack = function(track, autoplay, source) {
    track = track % this.playlist.length;
    if(track < 0) track += this.playlist.length; // weird JS behavior
    if(source === undefined) source = this.playlist[track].defaultSource;
    
    this.resetAspectRatio();
    this.mediaElement.src = this.playlist[track].sources[source].url;
    // If src is not set before poster, poster is not shown. Webkit bug?
    if(this.playlist[track].posterURL) {
        if(this.playlist[track].sources[source].mediaType === "video") {
            this.mediaElement.poster = this.playlist[track].posterURL;
            this.containerElement.style.backgroundImage = "none !important";
        } else {
            if(this.mediaElement.hasAttribute("poster")) this.mediaElement.removeAttribute("poster");
            this.containerElement.style.backgroundImage = "url('" + this.playlist[track].posterURL + "') !important";
        }
    }  else {
        if(this.mediaElement.hasAttribute("poster")) this.mediaElement.removeAttribute("poster");
        this.containerElement.style.backgroundImage = "none !important";
    }
    this.currentTrack = track;
    this.currentSource = source;
    if(autoplay) {
        this.mediaElement.setAttribute("preload", "auto");
        this.mediaElement.setAttribute("autoplay", "");
    }
    
    var title = this.playlist[track].title;
    if(!title) title = "(no title)";
    if(this.playlistControls) title = "[" + this.printTrack(track) + "/" + this.playlistLength + "]\u2002" + title;
    if(this.trackInfo) {
        this.hideTrackInfo();
        this.trackInfo.innerHTML = "<p class=\"CTFtrackStatus\"></p><p class=\"CTFtrackTitle\"></p>";
        if(this.mediaElement.getAttribute("preload") === "auto") this.trackInfo.firstChild.textContent = "Loading\u2026\u2002";
        this.trackInfo.childNodes[1].textContent = title;
        this.showTrackInfo(true);
    }
    this.showControls(false);
    
    if(this.sourceSelector) {
        this.sourceSelector.hide();
        this.sourceSelector.buildSourceList(this.playlist[track].sources);
        this.sourceSelector.setCurrentSource(source);
        this.sourceSelector.unhide(this.width, this.height);
    }
};

mediaPlayer.prototype.switchSource = function(source) {
    if(source === this.currentSource) return;
    
    this.sourceSelector.setCurrentSource(source);
    
    var currentTime = this.mediaElement.currentTime;
    this.mediaElement.setAttribute("autoplay", "");
    this.mediaElement.src = this.playlist[this.currentTrack].sources[source].url;
    this.currentSource = source;
    this.showControls(false);
    if(this.trackInfo) {
        this.trackInfo.firstChild.textContent = "Loading\u2026\u2002";
        this.showTrackInfo(true);
    }
    
    var setInitialTime = function(event) {
        event.target.removeEventListener("loadedmetadata", setInitialTime, false);
        event.target.currentTime = currentTime;
    };
    this.mediaElement.addEventListener("loadedmetadata", setInitialTime, false);
};

mediaPlayer.prototype.toggleLooping = function() {
    if(this.mediaElement.hasAttribute("loop")) this.mediaElement.removeAttribute("loop");
    else this.mediaElement.setAttribute("loop", "true");
};

mediaPlayer.prototype.setContextInfo = function(event, contextInfo, source) {
    var track = this.currentTrack;
    if(track === undefined) track = 0;
    if(source === undefined) source = this.currentSource;
    contextInfo.siteInfo = this.playlist[track].siteInfo;
    contextInfo.hasMedia = true;
    contextInfo.isMedia = this.currentTrack !== undefined;
    contextInfo.source = source;
    if(source !== undefined) {
        contextInfo.noDownload = this.playlist[track].sources[source].noDownload;
        contextInfo.mediaType = this.playlist[track].sources[source].mediaType;
    }
    safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
};

mediaPlayer.prototype.printTrack = function(track) {
    return (track + this.startTrack) % this.playlistLength + 1;
};

mediaPlayer.prototype.addToPlaylist = function(playlist, init) {
    if(init) this.playlist = playlist.concat(this.playlist);
    else this.playlist = this.playlist.concat(playlist);
};

mediaPlayer.prototype.registerShortcuts = function() {
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
            if(testShortcut(event, settings.enterFullscreenShortcut)) _this.mediaElement.webkitEnterFullscreen();
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
                if(testShortcut(event, settings.prevTrackShortcut)) _this.jumpTrack(-1);
            });
        }
        if(settings.nextTrackShortcut) {
            this.addEventListener(settings.nextTrackShortcut.type, function(event) {
                if(testShortcut(event, settings.nextTrackShortcut)) _this.jumpTrack(1);
            });
        }
    }
    if(settings.toggleLoopingShortcut) {
        this.addEventListener(settings.toggleLoopingShortcut.type, function(event) {
            if(testShortcut(event, settings.toggleLoopingShortcut)) _this.toggleLooping();
        });
    }
    if(this.trackInfo && settings.showTitleShortcut) {
        this.addEventListener(settings.showTitleShortcut.type, function(event) {
            if(testShortcut(event, settings.showTitleShortcut)) {
                if(_this.shadowDOM.controlsPanel.style.display === "none") _this.hideTrackInfo();
                else _this.showTrackInfo(false);
            }
        });
    }
};

mediaPlayer.prototype.addEventListener = function(type, handler) {
    if(type === "click" || type === "dblclick") { // ignore clicks on controls
        var _this = this;
        this.containerElement.addEventListener(type, function(event) {
            if(!(event.target === this || event.target.hasAttribute("controls")) || event.offsetY + _this.mediaElement.offsetTop + 25 > _this.height) return;
            handler(event);
        }, false);
    } else {
        this.containerElement.addEventListener(type, handler, false);
    }
};

function opacityTransition(element, opacity, duration, delay, timing) {
    element.style.WebkitTransition = "opacity " + duration + "s " + timing + " " + delay + "s";
    element.style.opacity = opacity + " !important";
};

