/***************************
mediaPlayer class definition
****************************/

function mediaPlayer(playerType) {
    
    // PROPERTIES
    this.playerType = playerType; // audio or video
    this.playlist = new Array(); // array of mediaData objects
    this.playlistLength = 0; // not necessarily synced with playlist.length
    
    this.startTrack = null; // internal start track is always 0
    // when startTrack is set, loadMedia can be called
    this.currentTrack = null; // for the user, current track is startTrack + currentTrack + 1
    // currentTrack is set iff loadMedia has been called
    
    this.containerElement = null;
    this.mediaElement = null; // the HTML video/audio element
    this.downloadLink = null;
    
    // dimensions of the container
    this.width = null;
    this.height = null;
    
    this.usePlaylistControls = false;
    this.playlistControls = null;
    
}

mediaPlayer.prototype.initialize = function(buffer, width, height, volume, contextInfo) {
    this.containerElement = document.createElement("div");
    this.containerElement.className = "CTFmediaPlayer";
    this.mediaElement = document.createElement(this.playerType);
    this.mediaElement.className = "CTFvideoElement";
    this.containerElement.appendChild(this.mediaElement);
    
    this.mediaElement.setAttribute("controls", "controls");
    switch (buffer) {
        case "autoplay": 
            this.mediaElement.setAttribute("autoplay", "autoplay");
            break;
        case "buffer":
            this.mediaElement.setAttribute("preload", "auto");
            break;
        case "none":
            this.mediaElement.setAttribute("preload", "none");
            break;
    }
    
    // Set dimensions
    this.width = width;
    this.height = height;
    this.containerElement.style.width = width + "px";
    this.containerElement.style.height = height + "px";
    
    // Set volume
    this.mediaElement.volume = volume;
    
    // Set listeners
    var _this = this; // need anonymous function in listeners otherwise the 'this' will refer to the mediaElement!
    this.mediaElement.addEventListener("contextmenu", function(event) {_this.setContextInfo(event, contextInfo);}, false);
    this.mediaElement.addEventListener("loadedmetadata", function() {_this.fixAspectRatio();}, false);
    this.mediaElement.addEventListener("ended", function() {_this.nextTrack();}, false);
    this.mediaElement.ondblclick = function(event) {
        if(event.target == this && event.offsetY + 24 < this.offsetHeight) {
            _this.switchLoop();
        }
    };
    
    // Initialize download link
    this.downloadLink = document.createElement("a");
    this.downloadLink.className = "CTFtrackTitle";
    this.downloadLink.onclick = downloadTarget;
    
    if(this.usePlaylistControls) {
        this.initializePlaylistControls();
    } else {
        this.initializeDownloadControls();
    }
};

mediaPlayer.prototype.initializePlaylistControls = function() {

    this.playlistControls = document.createElement("div");
    this.playlistControls.className = "CTFplaylistControls";
    
    var playlistControlsLeft = document.createElement("div");
    playlistControlsLeft.className = "CTFplaylistControlsLeft";
    this.playlistControls.appendChild(playlistControlsLeft);
    
    var playlistControlsRight = document.createElement("div");
    playlistControlsRight.className = "CTFplaylistControlsRight";
    this.playlistControls.appendChild(playlistControlsRight);
    
    var trackInfo = document.createElement("div");
    trackInfo.className = "CTFtrackInfo";
    playlistControlsLeft.appendChild(trackInfo);
    
    trackInfo.appendChild(document.createElement("p"));
    trackInfo.firstChild.appendChild(document.createElement("span"));
    trackInfo.firstChild.appendChild(this.downloadLink);
    
    var prevButton = document.createElement("div");
    prevButton.className = "CTFprevButton";
    playlistControlsRight.appendChild(prevButton);
    
    var trackSelect = document.createElement("form");
    trackSelect.className = "CTFtrackSelect";
    playlistControlsRight.appendChild(trackSelect);
    
    var nextButton = document.createElement("div");
    nextButton.className = "CTFnextButton";
    playlistControlsRight.appendChild(nextButton);

    trackSelect.innerHTML = "<input type=\"text\" style=\"width: " + (8 * this.playlistLength.toString().length) + "px\"><span>/" + normalize(this.playlist.length, this.playlistLength) + "</span>";
    
    var _this = this;
    this.mediaElement.onmouseover = function(event) {
        this.focus = true;
        if(!this.paused && this.readyState > 1) _this.fadeIn(.05);
    };
    this.playlistControls.onmouseover = function(event) {
        _this.mediaElement.focus = true;
        if(!_this.mediaElement.paused && _this.mediaElement.readyState > 1) _this.fadeIn(0);
    };
    this.mediaElement.onmouseout = function(event) {
        // prevents the default controls from disappearing
        if(event.relatedTarget && (event.relatedTarget == prevButton || event.relatedTarget == nextButton || event.relatedTarget == trackSelect.firstChild || event.relatedTarget.className == "CTFtrackTitle" || event.relatedTarget.hasAttribute("precision"))) {
            event.preventDefault();
        } else {
            this.focus = false;
            if(!this.paused && this.readyState > 1) _this.fadeOut(0);
        }
    };
    this.playlistControls.onmouseout = function(event) {
        _this.mediaElement.focus = false;
        if(!_this.mediaElement.paused && _this.mediaElement.readyState > 1) _this.fadeOut(.1);
    };
    this.mediaElement.focus = false;
    this.mediaElement.addEventListener("pause", function(){_this.fadeIn(0);}, false);
    this.mediaElement.addEventListener("play", function(){if(!_this.mediaElement.focus) _this.fadeOut(0);}, false);
    
    trackSelect.onsubmit = function(event) {
        event.preventDefault();
        var track = this.getElementsByTagName("input")[0].value;
        if(!(/^\d+$/.test(track))) return;
        track = parseInt(track);
        if(track < 1 || track > _this.playlistLength) return;
        track = (track - _this.startTrack - 1 + _this.playlistLength) % _this.playlistLength;
        if(track == _this.currentTrack) return;
        if(track < _this.playlist.length) {
            _this.loadTrack(track, true);
        }
    };
    prevButton.onclick = function() {
        if(_this.playlist.length == 1) return;
        _this.loadTrack(_this.currentTrack - 1, true);
    };
    nextButton.onclick = function() {
        if(_this.playlist.length == 1) return;
        _this.loadTrack(_this.currentTrack + 1, true);
    };
    
    this.containerElement.appendChild(this.playlistControls);
};

mediaPlayer.prototype.initializeDownloadControls = function() {
    this.playlistControls =  document.createElement("div");
    this.playlistControls.className = "CTFplaylistControls";
    
    var hoverElement = document.createElement("div");
    hoverElement.className = "CTFhoverElement";
    this.playlistControls.innerHTML = "<div class=\"CTFplaylistControlsLeft CTFnodisplay\"><div class=\"CTFtrackInfo\"><p></p></div></div>";
    this.playlistControls.firstChild.firstChild.firstChild.appendChild(this.downloadLink);
    
    this.playlistControls.appendChild(hoverElement);
    
    var _this = this;
    
    this.playlistControls.firstChild.onmouseout = function(event) {
        this.nextSibling.className = "CTFhoverElement";
        _this.fadeOut(0)
    };
    
    this.playlistControls.firstChild.onmouseover = function(event) {
        if(event.relatedTarget && event.relatedTarget.className == "CTFhoverElement") {
            this.nextSibling.className = "CTFhoverElement CTFnodisplay";
            _this.fadeIn(0)
        }
    };
    hoverElement.onmouseover = function(event) {
        this.previousSibling.className ="CTFplaylistControlsLeft";
    }
    
    hoverElement.onmouseout = function(event) {
        if(!event.relatedTarget || event.relatedTarget.className != "CTFtrackTitle") {
            this.previousSibling.className ="CTFplaylistControlsLeft CTFnodisplay";
        }
    };
    
    this.mediaElement.onmouseout = function(event) {
        if(event.relatedTarget && (event.relatedTarget == hoverElement || event.relatedTarget.className == "CTFtrackTitle")) {
            event.preventDefault();
        }
    }
    
    this.playlistControls.addEventListener("webkitTransitionEnd", function() {if(this.style.opacity == "0") this.firstChild.className = "CTFplaylistControlsLeft CTFnodisplay";}, false);
    
    this.playlistControls.style.opacity = "0";
    
    this.containerElement.appendChild(this.playlistControls);
};

mediaPlayer.prototype.fadeOut = function(delay) {
    this.playlistControls.style.WebkitTransition = "opacity .4s linear " + delay + "s";
    this.playlistControls.style.opacity = "0";
};

mediaPlayer.prototype.fadeIn = function(delay) {
    this.playlistControls.style.WebkitTransition = "opacity .05s linear " + delay + "s";
    this.playlistControls.style.opacity = "0.9";
};

/*mediaPlayer.prototype.getCurrentTrackURL = function() {
    if(this.currentTrack === null) return this.playlist[0].mediaURL;
    else return this.playlist[this.currentTrack].mediaURL;
};*/

mediaPlayer.prototype.fixAspectRatio = function() {
    var w = this.mediaElement.videoWidth;
    var h = this.mediaElement.videoHeight;
    if(!w || !h) { // audio source
        this.mediaElement.style.width = this.width + "px"; this.mediaElement.style.height = (this.height < 24 ? "24" : this.height) + "px";
    } else if (w/h > this.width/this.height) {
        // No rounding to avoid stretching in fullscreen
        this.mediaElement.style.width = this.width + "px"; this.mediaElement.style.height = h/w*this.width + "px";
    } else {
        var width = w/h*this.height;
        this.mediaElement.style.height = this.height + "px"; this.mediaElement.style.width = width + "px";
        if(this.playlistControls) {
            this.playlistControls.style.width = width + "px";
            if(this.usePlaylistControls) this.downloadLink.parentNode.style.width = (width - this.playlistControls.getElementsByClassName("CTFplaylistControlsRight")[0].offsetWidth - 12) + "px";
        }
    }
    if(this.usePlaylistControls) {
        // need this otherwise a webkit bug messes up font smoothing
        this.fadeIn(0);
    }
    
};

mediaPlayer.prototype.resetAspectRatio = function() {
    this.mediaElement.style.width = this.width + "px";
    this.mediaElement.style.height = this.height + "px";
    if(this.playlistControls) {
        this.playlistControls.style.width = this.width + "px";
        if(this.usePlaylistControls) this.downloadLink.parentNode.style.width = (this.width - this.playlistControls.getElementsByClassName("CTFplaylistControlsRight")[0].offsetWidth - 12) + "px";
    }
};

mediaPlayer.prototype.switchLoop = function() {
    if(this.mediaElement.hasAttribute("loop")) this.mediaElement.removeAttribute("loop");
    else this.mediaElement.setAttribute("loop", "true");
}

mediaPlayer.prototype.nextTrack = function() {
    if(!this.mediaElement.hasAttribute("loop")) {
        if(this.currentTrack + this.startTrack + 1 == this.playlistLength) return;
        this.loadTrack(this.currentTrack + 1, true);
    }
};

mediaPlayer.prototype.loadTrack = function(track, autoplay) {
    track = track % this.playlist.length;
    if(track < 0) track += this.playlist.length; // weird JS behavior
    
    this.resetAspectRatio();
    this.mediaElement.src = this.playlist[track].mediaURL;
    // If src is not set before poster, poster is not shown. Webkit bug?
    if(this.playlist[track].posterURL) {
        if(this.playlist[track].mediaType == "video") {
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
    if(autoplay) {
        this.mediaElement.setAttribute("preload", "auto");
        this.mediaElement.setAttribute("autoplay", "autoplay");
    }
    
    // Set download link
    this.downloadLink.href = this.playlist[track].mediaURL;
    var title;
    if(this.usePlaylistControls) {
        title = this.playlist[track].title;
        if(!title) title = "(no title)";
        track = this.printTrack(track);
        this.downloadLink.previousSibling.innerHTML = track + ". ";
        this.downloadLink.innerHTML = title;
        
        var inputField = this.playlistControls.getElementsByTagName("input")[0];
        var newInputField = document.createElement("input");
        newInputField.setAttribute("type", "text");
        newInputField.setAttribute("value", track);
        newInputField.style.width = (8 * this.playlistLength.toString().length) + "px";
        // simply changing the value does not update if user has used the field
        this.playlistControls.getElementsByTagName("form")[0].replaceChild(newInputField, inputField);
        // Show playlist controls
        this.playlistControls.style.WebkitTransition = "";
        this.playlistControls.style.opacity = "1";
    } else {
        title = this.playlist[track].mediaType == "audio" ? localize("AUDIO_LINK") : localize("VIDEO_LINK");
        this.downloadLink.innerHTML = title;
    }
};

mediaPlayer.prototype.printTrack = function(track) {
    return (track + this.startTrack) % this.playlistLength + 1;
};

mediaPlayer.prototype.setContextInfo = function(event, contextInfo) {
    var track = this.currentTrack;
    if(track === null) track = 0;
    contextInfo.mediaType = this.playlist[track].mediaType;
    contextInfo.siteInfo = this.playlist[track].siteInfo;
    contextInfo.isVideo = this.currentTrack != null;
    safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
    event.stopPropagation();
};

mediaPlayer.prototype.addToPlaylist = function(playlist, init) {
    if(init) this.playlist = playlist.concat(this.playlist);
    else this.playlist = this.playlist.concat(playlist);
    if(this.usePlaylistControls && this.playlistControls) {
        this.playlistControls.getElementsByTagName("span")[1].innerHTML = "/" + normalize(this.playlist.length + this.startTrack, this.playlistLength);
    }
};

function normalize(n,m) {
    if(n > m) return m.toString();
    var string = n.toString();
    while(string.length < m.toString().length) {
        string = "0" + string;
    }
    return string;
}


