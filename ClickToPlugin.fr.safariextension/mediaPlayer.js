function mediaPlayer(playerType) {
	
	// PROPERTIES
	this.playerType = playerType;
	this.playlist = new Array(); // array of mediaData objects
	this.playlistLength = 0; // not necessarily synced with playlist.length
	
	this.startTrack = null; // internal start track is always 0
	this.currentTrack = null; // for the user, current track is startTrack + currentTrack + 1
	//this.isLoaded = false; // use currentTrack to check
	
	this.containerElement = null;
	this.mediaElement = null; // the HTML video/audio element
	// dimensions of the container
	this.width = null;
	this.height = null;
	
	this.usePlaylistControls = false;
	this.playlistControls = null;
	
	// METHODS
	//this.isReadyToBeLoaded = function() { // use startTrack to check
	//};
	
}

mediaPlayer.prototype.initialize = function(buffer, width, height, volume, contextInfo) {
	this.containerElement = document.createElement("div");
	this.containerElement.className = "CTFvideoContainer";
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
	this.mediaElement.ondblclick = function() {
		_this.switchLoop();
	};
	
	//this.usePlaylistControls = this.usePlaylistControls && this.playlistLength > 1;
	if(this.usePlaylistControls) {
		this.initializePlaylistControls();
	} else {
		this.initializeDownloadControls();
	}
};

mediaPlayer.prototype.initializePlaylistControls = function() {

	this.playlistControls = document.createElement("div");
	this.playlistControls.className = "CTFplaylistControls";
	
	var trackTitle = document.createElement("div");
	trackTitle.className = "CTFtrackTitle";
	this.playlistControls.appendChild(trackTitle);
	
	var trackSelect = document.createElement("div");
	trackSelect.className = "CTFtrackSelect";
	this.playlistControls.appendChild(trackSelect);
	
	var trackTitleText = document.createElement("div");
	trackTitleText.className = "CTFtrackTitleText";
	trackTitle.appendChild(trackTitleText);
	
	var trackTitleTextP = document.createElement("p");
	trackTitleText.appendChild(trackTitleTextP);
	
	var prevButton = document.createElement("div");
	prevButton.className = "CTFprevButton";
	trackSelect.appendChild(prevButton);
	
	var trackInput = document.createElement("form");
	trackInput.className = "CTFtrackInput";
	trackSelect.appendChild(trackInput);
	
	var nextButton = document.createElement("div");
	nextButton.className = "CTFnextButton";
	trackSelect.appendChild(nextButton);

	trackInput.innerHTML = "<input type=\"text\" style=\"width: " + (8 * this.playlistLength.toString().length) + "px\"><span>/" + normalize(this.playlist.length, this.playlistLength) + "</span>";
	
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
		if(event.relatedTarget && (event.relatedTarget == prevButton || event.relatedTarget == nextButton || event.relatedTarget == trackInput.firstChild || event.relatedTarget == trackTitleTextP.lastChild || event.relatedTarget.hasAttribute("precision"))) {
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
	
	trackInput.onsubmit = function(event) {
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
	
	// If the controls are shown at once a webkit bug will mess up font smoothing
	// when the video starts playing.
	// The only way I was able to prevent this is to show controls on loadedmetadata
	this.playlistControls.style.opacity = "0";
	this.containerElement.appendChild(this.playlistControls);

};

mediaPlayer.prototype.initializeDownloadControls = function() {
	this.playlistControls =  document.createElement("div");
	this.playlistControls.className = "CTFplaylistControls";
	
	var hoverElement = document.createElement("div");
	hoverElement.className = "CTFhoverElement";
	this.playlistControls.innerHTML = "<div class=\"CTFtrackTitle\"><div class=\"CTFtrackTitleText\"><p></p></div></div>";
	
	this.playlistControls.appendChild(hoverElement);
	
	var _this = this;
	
	this.playlistControls.firstChild.onmouseout = function(event) {
		this.nextSibling.style.display = "block";
		_this.fadeOut(0)
	};
	
	this.playlistControls.firstChild.onmouseover = function(event) {
		if(event.relatedTarget && event.relatedTarget.className == "CTFhoverElement") {
			this.nextSibling.style.display = "none";
			_this.fadeIn(0)
		}
	};
	hoverElement.onmouseover = function(event) {
		this.previousSibling.style.display ="block";
	}
	
	hoverElement.onmouseout = function(event) {
		if(!event.relatedTarget || event.relatedTarget.className != "CTFtitleText") {
			this.previousSibling.style.display ="none";
		}
	};
	
	this.mediaElement.onmouseout = function(event) {
		if(event.relatedTarget && (event.relatedTarget == hoverElement || event.relatedTarget.className == "CTFtitleText")) {
			event.preventDefault();
		}
	}
	
	this.playlistControls.addEventListener("webkitTransitionEnd", function() {if(this.style.opacity == "0") this.firstChild.style.display = "none";}, false);
	
	this.playlistControls.style.opacity = "0";
	this.playlistControls.firstChild.style.display = "none";
	//this.playlistControls.firstChild.style.pointerEvents = "auto";
	
	this.containerElement.appendChild(this.playlistControls);
};

mediaPlayer.prototype.fadeOut = function(delay) {
	this.playlistControls.style.WebkitTransition = "opacity .4s linear " + delay + "s";
	this.playlistControls.style.opacity = "0";
};

mediaPlayer.prototype.fadeIn = function(delay) {
	this.playlistControls.style.WebkitTransition = "opacity .05s linear " + delay + "s";
	this.playlistControls.style.opacity = "0.93";
};

mediaPlayer.prototype.fixAspectRatio = function() {
	var w = this.mediaElement.videoWidth;
	var h = this.mediaElement.videoHeight;
	if(w == 0 || h == 0) { // audio source
        //this.mediaElement.style.height = "24px"; // the height of the controls
        this.mediaElement.style.width = this.width + "px"; this.mediaElement.style.height = this.height + "px";
		if(this.playlistControls) this.playlistControls.style.width = this.width + "px";
    } else if (w/h > this.width/this.height) {
        this.mediaElement.style.width = this.width + "px"; this.mediaElement.style.height = "";
		if(this.playlistControls) this.playlistControls.style.width = this.width + "px";
    } else {
        this.mediaElement.style.height = this.height + "px"; this.mediaElement.style.width = "";
		// Apparently webkit uses floor, not round
		if(this.playlistControls) this.playlistControls.style.width = Math.floor(w/h*this.height) + "px";
    }
	if(this.usePlaylistControls) {
		this.fadeIn(.05);
	}
	
};

mediaPlayer.prototype.resetAspectRatio = function() {
	this.mediaElement.style.width = this.width + "px";
	this.mediaElement.style.height = this.height + "px";
	if(this.playlistControls) this.playlistControls.style.width = this.width + "px";
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
			this.mediaElement.style.background = "";
			// this.mediaElement.style.backgroundSize = "";
    	} else {
			if(this.mediaElement.hasAttribute("poster")) this.mediaElement.removeAttribute("poster");
			this.mediaElement.style.backgroundImage = "url('" + this.playlist[track].posterURL + "')";
			this.mediaElement.style.backgroundRepeat = "no-repeat";
			this.mediaElement.style.backgroundPosition = "center center";
			// this.mediaElement.style.backgroundSize = "100 %";
		}
	}  else {
		if(this.mediaElement.hasAttribute("poster")) this.mediaElement.removeAttribute("poster");
		this.mediaElement.style.background = "";
	}
	this.currentTrack = track;
	if(autoplay) {
        this.mediaElement.setAttribute("preload", "auto");
        this.mediaElement.setAttribute("autoplay", "autoplay");
    }

	if(this.usePlaylistControls) {
		var title = this.playlist[track].title;
		if(!title) title = "(no title)";
		title = "<a class=\"CTFtitleText\" href=\"" + this.mediaElement.src + "\">" + title + "</a>";
		this.playlistControls.getElementsByTagName("p")[0].innerHTML = ((track + this.startTrack) % this.playlistLength + 1) + ". " + title;
		var inputField = this.playlistControls.getElementsByTagName("input")[0];
		var newInputField = document.createElement("input");
		newInputField.setAttribute("type", "text");
		newInputField.setAttribute("value", (track + this.startTrack) % this.playlistLength + 1);
		newInputField.style.width = (8 * this.playlistLength.toString().length) + "px";
		// simply changing the value does not update if user has used the field
		this.playlistControls.getElementsByTagName("form")[0].replaceChild(newInputField, inputField);
		//this.playlistControls.getElementsByTagName("input")[0].setAttribute("value", track + this.startTrack + 1);
	} else {
		var title = "Télécharger " + (this.playlist[track].mediaType == "audio" ? "l'audio" : "la vidéo");
		title = "<a class=\"CTFtitleText\" href=\"" + this.mediaElement.src + "\">" + title + "</a>";
		this.playlistControls.getElementsByTagName("p")[0].innerHTML = title;
	}
};

mediaPlayer.prototype.setContextInfo = function(event, contextInfo) {
	var track = this.currentTrack;
	if(track == null) track = 0;
	contextInfo.mediaType = this.playlist[track].mediaType;
	contextInfo.siteInfo = this.playlist[track].siteInfo;
	//if(this.mediaElement) contextInfo.loop = this.mediaElement.hasAttribute("loop");
	// contextInfo.isPlaylist = (this.playlist.length > 1); // not used
	safari.self.tab.setContextMenuEventUserInfo(event, contextInfo);
	event.stopPropagation();
};

mediaPlayer.prototype.addToPlaylist = function(playlist, init) {
	if(init) this.playlist = playlist.concat(this.playlist);
	else this.playlist = this.playlist.concat(playlist);
	if(this.usePlaylistControls && this.playlistControls) {
		this.playlistControls.getElementsByTagName("span")[0].innerHTML = "/" + normalize(this.playlist.length + this.startTrack, this.playlistLength); 
		var width = this.playlistControls.offsetWidth - this.playlistControls.getElementsByClassName("CTFtrackSelect")[0].offsetWidth;
		this.playlistControls.getElementsByTagName("p")[0].style.width = (width - 7) + "px";
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


