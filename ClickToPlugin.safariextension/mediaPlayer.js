/***************************
mediaPlayer class definition
****************************/

function mediaPlayer() {
    
    this.playerType; // audio or video
    this.playlist = new Array();
    this.playlistLength = 0; // not necessarily synced with playlist.length!
    
    this.startTrack = null; // internal start track is always 0
    // when startTrack is set, createMediaElement can be called
    this.currentTrack = null; // for the user, current track is startTrack + currentTrack + 1
    // currentTrack is set iff loadMedia has been called
    this.currentSource; // the source being used for the currentTrack (an integer)
    
    this.containerElement;
    this.mediaElement; // the HTML video/audio element
    
    // Stylesheets for shadow DOM
    this.globalStyleElement; // aspect ratio fix
    this.controlsStyleElement; // show hide controls
    
    // dimensions of the container
    this.width = null;
    this.height = null;
    
    this.contextInfo = null;
    
    this.usePlaylistControls = false;
    
    this.trackInfo = null;
    this.playlistControls = null;
    this.sourceSelector = null;
    
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
        this.startTrack = mediaData.startTrack ? mediaData.startTrack : 0;
        this.usePlaylistControls = !mediaData.noPlaylistControls && this.playlistLength > 1;
        this.currentSource = mediaData.playlist[0].defaultSource;
    }
};

mediaPlayer.prototype.createMediaElement = function(width, height, contextInfo) {
    this.containerElement = document.createElement("div");
    this.containerElement.className = "CTFmediaPlayer" + (settings.hideRewindButton ? " CTFnoRewindButton" : "");
    this.containerElement.tabIndex = -1;
    this.globalStyleElement = document.createElement("style");
    this.globalStyleElement.type = "text/css";
    this.containerElement.appendChild(this.globalStyleElement);
    this.controlsStyleElement = document.createElement("style");
    this.controlsStyleElement.type = "text/css";
    this.containerElement.appendChild(this.controlsStyleElement);
    this.mediaElement = document.createElement(this.playerType);
    this.mediaElement.className = "CTFmediaElement" + (settings.showVolumeSlider && !/\+/.test(navigator.appVersion) ? " CTFvolumeSlider" : "");
    this.mediaElement.id = "CTFmediaElement" + contextInfo.elementID;
    this.containerElement.appendChild(this.mediaElement);
    
    this.mediaElement.setAttribute("controls", "");
    this.mediaElement.setAttribute("preload", "auto");
    //if(autoplay) this.mediaElement.setAttribute("autoplay", "");
    
    // Set dimensions
    this.width = width;
    this.height = height;
    this.containerElement.style.width = width + "px";
    this.containerElement.style.height = height + "px";
    
    // Set volume
    this.mediaElement.volume = settings.volume;
    
    // Set global contextInfo
    this.contextInfo = contextInfo;
    
    // Set listeners
    var _this = this; // need anonymous function in listeners otherwise the 'this' will refer to the mediaElement!
    this.mediaElement.addEventListener("contextmenu", function(event) {
        _this.setContextInfo(event, contextInfo, null);
        event.stopPropagation();
    }, false);
    this.mediaElement.addEventListener("loadedmetadata", function() {_this.fixAspectRatio();}, false);
    this.mediaElement.addEventListener("ended", function() {_this.showControls(true); _this.nextTrack();}, false);
    
    // Set keyboard shortcuts
    this.registerShortcuts();
    
    // Pass mouseover events from container to media element
    this.containerElement.addEventListener("mouseover", function(event) {
        this.isInFocus = true;
        _this.showControls(true);
        if(event.target === _this.mediaElement) return;
        var e = document.createEvent("MouseEvents");
        e.initMouseEvent("mouseover", false, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        _this.mediaElement.dispatchEvent(e);
    }, false);
    this.containerElement.addEventListener("mouseout", function(event) {
        if(event.relatedTarget && (event.relatedTarget === this || event.relatedTarget.compareDocumentPosition(this) === 10 || event.relatedTarget.hasAttribute("precision"))) { // shadow DOM leaks in relatedTarget!
            //alert(HTMLToString(event.relatedTarget.parentNode.parentNode.parentNode))
            //event.relatedTarget.parentNode.removeChild(event.relatedTarget)
            if(event.target === _this.mediaElement) event.preventDefault();
            return;
        }
        this.isInFocus = false;
        _this.hideControls(true);
        var e = document.createEvent("MouseEvents");
        e.initMouseEvent("mouseout", false, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        _this.mediaElement.dispatchEvent(e);
    }, false);
    this.mediaElement.addEventListener("play", function(event) {
        if(!_this.containerElement.isInFocus) _this.hideControls(true);
    }, false);
    this.mediaElement.addEventListener("pause", function(event) {_this.showControls(true);}, false);
    //this.containerElement.addEventListener("blur", function(event) {alert("hey"); event.preventDefault(); event.stopPropagation();}, true);
    //setTimeout(function(){_this.mediaElement.play()}, 2000);
    
    // Additional controls
    if(this.playlist[0].title || this.usePlaylistControls) this.initializeTrackInfo();
    if(this.usePlaylistControls) this.initializePlaylistControls();
    if(settings.showSourceSelector) this.initializeSourceSelector();
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
    if(this.usePlaylistControls) {
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
    if(settings.showTitleShortcut) {
        this.addEventListener(settings.showTitleShortcut.type, function(event) {
            if(testShortcut(event, settings.showTitleShortcut)) {
                if(_this.controlsStyleElement.sheet.cssRules.length > 0) _this.hideTrackInfo();
                else _this.showTrackInfo(false);
            }
        });
    }
};

mediaPlayer.prototype.initializeTrackInfo = function() {
    var width = this.width - (this.usePlaylistControls ? 175 : 117);
    if(width < 100) return;
    this.trackInfo = document.createElement("div");
    this.trackInfo.className = "CTFtrackInfo";
    this.trackInfo.innerHTML = "<div><p></p></div>";
    
    this.containerElement.appendChild(this.trackInfo);
};

mediaPlayer.prototype.showTrackInfo = function(isLoading) {
    if(this.controlsStyleElement.sheet.cssRules.length > 0) return; ///
    var leftOffset = 0;
    var leftPadding = 7;
    if(isLoading) {
        leftOffset = this.usePlaylistControls ? 170 : 112;
        if(this.width - leftOffset < 80) return;
        leftPadding = 0;
    }
    this.trackInfo.style.left = leftOffset + "px !important";
    this.trackInfo.style.width = (this.width - leftOffset) + "px !important";
    leftOffset += isLoading ? 7 : 14;
    this.trackInfo.firstChild.firstChild.style.width = (this.width - leftOffset) + "px !important";
    this.trackInfo.firstChild.firstChild.style.paddingLeft = leftPadding + "px !important";
    
    if(!isLoading) {
        this.controlsStyleElement.sheet.insertRule(".CTFmediaElement::-webkit-media-controls-panel {display: none;}", 0);
        if(this.usePlaylistControls) this.playlistControls.style.display = "none !important";
    } else {
        this.controlsStyleElement.sheet.insertRule(".CTFmediaElement::-webkit-media-controls-panel {width: " + leftOffset + "px;}", 0);
        //this.controlsStyleElement.sheet.insertRule(".CTFmediaElement::-webkit-media-controls-status-display {margin-right: 0; padding-right: 0;}", 1);
        this.controlsStyleElement.sheet.insertRule(".CTFmediaElement::-webkit-media-controls-timeline-container {display: none;}", 0);
        this.controlsStyleElement.sheet.insertRule(".CTFmediaElement::-webkit-media-controls-mute-button {display: none;}", 0);
        this.controlsStyleElement.sheet.insertRule(".CTFmediaElement::-webkit-media-controls-volume-slider-container {display: none;}", 0);
        this.controlsStyleElement.sheet.insertRule(".CTFmediaElement::-webkit-media-controls-fullscreen-button {display: none;}", 0);
    }
    
    this.trackInfo.style.display = "block !important";
};

mediaPlayer.prototype.hideTrackInfo = function() {
    this.trackInfo.style.display = "none !important";
    while(this.controlsStyleElement.sheet.cssRules.length > 0) {
        this.controlsStyleElement.sheet.deleteRule(0);
    }
    if(this.usePlaylistControls) this.playlistControls.style.display = "-webkit-box !important";
};

mediaPlayer.prototype.initializePlaylistControls = function() {
    
    this.containerElement.className += " CTFhasPlaylistControls"; // on media element?
    
    this.playlistControls = document.createElement("div");
    this.playlistControls.className = "CTFplaylistControls";
    this.playlistControls.style.display = "-webkit-box !important";
    
    var prevButton = document.createElement("div");
    prevButton.className = "CTFprevButton";
    prevButton.innerHTML = "0";
    this.playlistControls.appendChild(prevButton);
    var nextButton = document.createElement("div");
    nextButton.className = "CTFnextButton";
    nextButton.innerHTML = "1";
    this.playlistControls.appendChild(nextButton);
    
    var _this = this;
    this.showControls = function(fade) {
        _this.playlistControls.style.WebkitTransitionTimingFunction = "ease-out";
        opacityTransition(_this.playlistControls, fade ? .18 : 0, 0, 1);
    };
    this.hideControls = function(fade) {
        if(_this.mediaElement.paused || this.playlist[this.currentTrack].sources[this.currentSource].isAudio) return;
        _this.playlistControls.style.WebkitTransitionTimingFunction = "ease-in-out";
        opacityTransition(_this.playlistControls, fade ? .4 : 0, 0, 0);
    };
    
    prevButton.addEventListener("click", function() {
        _this.jumpTrack(-1);
    }, false);
    nextButton.addEventListener("click", function() {
        _this.jumpTrack(1);
    }, false);
    
    this.containerElement.appendChild(this.playlistControls);
};

mediaPlayer.prototype.jumpTrack = function(diff) {
    if(this.playlist.length === 1) return;
    this.loadTrack(this.currentTrack + diff, null, true);
}

mediaPlayer.prototype.initializeSourceSelector = function() {
    var _this = this;
    var loadPlugin = function(event) {reloadInPlugin(_this.contextInfo.elementID);};
    var viewInQTP = function(event) {viewInQuickTimePlayer(_this.contextInfo.elementID);};
    var handleClickEvent = function(event, source) {_this.switchSource(source);};
    var handleContextMenuEvent = function(event, source) {_this.setContextInfo(event, _this.contextInfo, source);};
    
    this.sourceSelector = new sourceSelector(this.contextInfo.plugin, loadPlugin, viewInQTP, handleClickEvent, handleContextMenuEvent);
    
    this.containerElement.appendChild(this.sourceSelector.element);
};

mediaPlayer.prototype.fixAspectRatio = function() {
    this.hideTrackInfo();
    var w = this.mediaElement.videoWidth;
    var h = this.mediaElement.videoHeight;
    if(!w || !h) { // audio source
        this.mediaElement.style.width = this.width + "px"; this.mediaElement.style.height = (this.height < 24 ? "24" : this.height) + "px";
    } else if (w/h > this.width/this.height) {
        // No rounding to avoid stretching in fullscreen
        var height = h/w*this.width;
        this.mediaElement.style.width = this.width + "px"; this.mediaElement.style.height = height + "px";
        this.globalStyleElement.sheet.insertRule("#CTFmediaElement" + this.contextInfo.elementID + "::-webkit-media-controls-panel {bottom: " + Math.floor((height - this.height)*.5) + "px;}", 0);
    } else {
        var width = w/h*this.height;
        this.mediaElement.style.height = this.height + "px"; this.mediaElement.style.width = width + "px";
        this.globalStyleElement.sheet.insertRule("#CTFmediaElement" + this.contextInfo.elementID + "::-webkit-media-controls-panel {width: " + this.width + "px; left: " + Math.round((width - this.width)*.5) + "px;}", 0);
    }
};

mediaPlayer.prototype.resetAspectRatio = function() {
    if(this.globalStyleElement.sheet.cssRules.length > 0) this.globalStyleElement.sheet.deleteRule(0);
    this.mediaElement.style.width = this.width + "px";
    this.mediaElement.style.height = this.height + "px";
};

mediaPlayer.prototype.toggleLooping = function() {
    if(this.mediaElement.hasAttribute("loop")) this.mediaElement.removeAttribute("loop");
    else this.mediaElement.setAttribute("loop", "true");
};

mediaPlayer.prototype.nextTrack = function() {
    if(!this.mediaElement.hasAttribute("loop")) {
        if(this.currentTrack + this.startTrack + 1 == this.playlistLength) return;
        this.loadTrack(this.currentTrack + 1, null, true);
    }
};

mediaPlayer.prototype.loadTrack = function(track, source, autoplay) { // source MUST be an existing source or null for default
    track = track % this.playlist.length;
    if(track < 0) track += this.playlist.length; // weird JS behavior
    if(source === null) source = this.playlist[track].defaultSource;
    if(source === undefined) source = 0; // should NOT happen
    
    this.resetAspectRatio();
    this.mediaElement.src = this.playlist[track].sources[source].url;
    // If src is not set before poster, poster is not shown. Webkit bug?
    if(this.playlist[track].posterURL) {
        if(this.playlist[track].mediaType === "video") {
            this.mediaElement.poster = this.playlist[track].posterURL;
            this.mediaElement.style.backgroundImage = "none !important";
        } else {
            if(this.mediaElement.hasAttribute("poster")) this.mediaElement.removeAttribute("poster");
            this.mediaElement.style.backgroundImage = "url('" + this.playlist[track].posterURL + "') !important";
        }
    }  else {
        if(this.mediaElement.hasAttribute("poster")) this.mediaElement.removeAttribute("poster");
        this.mediaElement.style.backgroundImage = "none !important";
    }
    this.currentTrack = track;
    this.currentSource = source;
    if(autoplay) {
        //this.mediaElement.setAttribute("preload", "auto");
        this.mediaElement.setAttribute("autoplay", "");
    }
    
    var title = this.playlist[track].title;
    if(!title) title = "(no title)";
    if(this.usePlaylistControls) title = this.printTrack(track) + "/" + this.playlistLength + "\u2003" + title;
    if(this.trackInfo) this.trackInfo.firstChild.firstChild.textContent = title;
    this.showControls(false);
    this.showTrackInfo(true);
    
    if(this.sourceSelector) {
        this.sourceSelector.hide();
        this.sourceSelector.buildSourceList(this.playlist[track].sources);
        this.sourceSelector.setCurrentSource(source);
        //if(settings.showMediaTooltip) this.sourceSelector.setTitle(this.playlist[track].title);
        this.sourceSelector.unhide(this.width, this.height);
    }
};

mediaPlayer.prototype.switchSource = function(source) {
    if(source === this.currentSource) return;
    
    this.sourceSelector.setCurrentSource(source);
    
    var currentTime = this.mediaElement.currentTime;
    this.mediaElement.setAttribute("preload", "auto");
    this.mediaElement.setAttribute("autoplay", "autoplay");
    this.mediaElement.src = this.playlist[this.currentTrack].sources[source].url;
    this.currentSource = source;
    this.showControls(false);
    this.showTrackInfo(true);
    
    var setInitialTime = function(event) {
        event.target.removeEventListener("loadedmetadata", setInitialTime, false);
        event.target.currentTime = currentTime;
    };
    this.mediaElement.addEventListener("loadedmetadata", setInitialTime, false);
};

mediaPlayer.prototype.printTrack = function(track) {
    return (track + this.startTrack) % this.playlistLength + 1;
};

mediaPlayer.prototype.setContextInfo = function(event, contextInfo, source) {
    var track = this.currentTrack;
    if(track === null) track = 0;
    contextInfo.mediaType = this.playlist[track].mediaType;
    contextInfo.siteInfo = this.playlist[track].siteInfo;
    contextInfo.hasVideo = true;
    contextInfo.isVideo = this.currentTrack !== null;
    if(source === null) {
        if(this.currentSource !== undefined) contextInfo.source = this.currentSource;
        else contextInfo.source = this.playlist[track].defaultSource;
    } else {
        //contextInfo.isSelector = true;
        contextInfo.source = source;
    }
    if(contextInfo.source !== undefined) contextInfo.noDownload = this.playlist[track].sources[contextInfo.source].noDownload;
    safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
};

mediaPlayer.prototype.addToPlaylist = function(playlist, init) {
    if(init) this.playlist = playlist.concat(this.playlist);
    else this.playlist = this.playlist.concat(playlist);
};

mediaPlayer.prototype.addEventListener = function(type, handler) {
    if(type === "click" || type === "dblclick") { // ignore clicks on controls
        this.containerElement.addEventListener(type, function(event) {
            if(!(event.target === this || event.target.hasAttribute("controls")) || event.offsetY + 25 > this.offsetHeight) return;
            handler(event);
        }, false);
    } else {
        this.containerElement.addEventListener(type, handler, false);
    }
}

function opacityTransition(element, duration, delay, opacity) {
    element.style.WebkitTransition = "opacity " + duration + "s linear " + delay + "s";
    element.style.opacity = opacity + " !important";
};

