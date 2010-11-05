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
    this.mediaElement.addEventListener("dblclick", function(event) {
        if(event.target == this && event.offsetY + 24 < this.offsetHeight) {
            _this.switchLoop();
        }
    }, false);
    
    // Playlist constrols
    if(this.usePlaylistControls) this.initializePlaylistControls();
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
    
    var prevButton = document.createElement("div");
    prevButton.className = "CTFprevButton";
    playlistControlsRight.appendChild(prevButton);
    
    var trackSelect = document.createElement("form");
    trackSelect.className = "CTFtrackSelect";
    playlistControlsRight.appendChild(trackSelect);
    
    var nextButton = document.createElement("div");
    nextButton.className = "CTFnextButton";
    playlistControlsRight.appendChild(nextButton);

    trackSelect.innerHTML = "<input type=\"text\" style=\"width: " + (7 * (this.playlistLength.toString().length - 1) + 8) + "px\"><span>/" + normalize(this.playlist.length, this.playlistLength) + "</span>";
    
    var _this = this;
    this.mediaElement.addEventListener("mouseover", function(event) {
        this.focus = true;
        if(!this.paused && this.readyState > 1) _this.fadeIn(.05);
    }, false);
    this.playlistControls.addEventListener("mouseover", function(event) {
        _this.mediaElement.focus = true;
        if(!_this.mediaElement.paused && _this.mediaElement.readyState > 1) _this.fadeIn(0);
    }, false);
    this.mediaElement.addEventListener("mouseout", function(event) {
        // prevents the default controls from disappearing
        if(event.relatedTarget && (event.relatedTarget == prevButton || event.relatedTarget == nextButton || event.relatedTarget == trackSelect.firstChild || event.relatedTarget.hasAttribute("precision"))) {
            event.preventDefault();
        } else {
            this.focus = false;
            if(!this.paused && this.readyState > 1) _this.fadeOut(0);
        }
    }, false);
    this.playlistControls.addEventListener("mouseout", function(event) {
        _this.mediaElement.focus = false;
        if(!_this.mediaElement.paused && _this.mediaElement.readyState > 1) _this.fadeOut(.1);
    }, false);
    this.mediaElement.focus = false;
    this.mediaElement.addEventListener("pause", function(){_this.fadeIn(0);}, false);
    this.mediaElement.addEventListener("play", function(){if(!_this.mediaElement.focus) _this.fadeOut(0);}, false);
    
    trackSelect.addEventListener("submit", function(event) {
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
    }, false);
    prevButton.addEventListener("click", function() {
        if(_this.playlist.length == 1) return;
        _this.loadTrack(_this.currentTrack - 1, true);
    }, false);
    nextButton.addEventListener("click", function() {
        if(_this.playlist.length == 1) return;
        _this.loadTrack(_this.currentTrack + 1, true);
    }, false);
    
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
            if(this.usePlaylistControls) this.playlistControls.getElementsByTagName("p")[0].style.width = (width - this.playlistControls.getElementsByClassName("CTFplaylistControlsRight")[0].offsetWidth - 12) + "px";
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
        if(this.usePlaylistControls) this.playlistControls.getElementsByTagName("p")[0].style.width = (this.width - this.playlistControls.getElementsByClassName("CTFplaylistControlsRight")[0].offsetWidth - 12) + "px";
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
    
    if(this.usePlaylistControls) {
        var title = this.playlist[track].title;
        if(!title) title = "(no title)";
        track = this.printTrack(track);
        this.playlistControls.getElementsByTagName("p")[0].innerHTML = track + ". " + title;
        
        var inputField = this.playlistControls.getElementsByTagName("input")[0];
        var newInputField = document.createElement("input");
        newInputField.setAttribute("type", "text");
        newInputField.setAttribute("value", track);
        newInputField.style.width = (7 * (this.playlistLength.toString().length - 1) + 8) + "px";
        // simply changing the value does not update if user has used the field
        this.playlistControls.getElementsByTagName("form")[0].replaceChild(newInputField, inputField);
        
        // Show playlist controls
        this.playlistControls.style.WebkitTransition = "";
        this.playlistControls.style.opacity = "1";
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
    contextInfo.isVideo = this.currentTrack !== null;
    safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
    event.stopPropagation();
};

mediaPlayer.prototype.addToPlaylist = function(playlist, init) {
    if(init) this.playlist = playlist.concat(this.playlist);
    else this.playlist = this.playlist.concat(playlist);
    if(this.usePlaylistControls && this.playlistControls) {
        this.playlistControls.getElementsByTagName("span")[0].innerHTML = "/" + normalize(this.playlist.length + this.startTrack, this.playlistLength);
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


