addKiller("Dailymotion", {

"canKill": function(data) {
	return data.src.indexOf("/dmplayerv4/") !== -1 || data.src.indexOf("www.dailymotion.com") !== -1;
},

"process": function(data, callback) {
	var sequence = parseFlashVariables(data.params.flashvars).sequence;
	if(sequence) this.processConfig(decodeURIComponent(sequence), callback);
	else {
		var match = /\/swf\/(?:video\/)?([^&?#]+)/.exec(data.src);
		if(match) this.processVideoID(match[1], callback);
	}
},

"processConfig": function(config, callback) {
	var config = JSON.parse(config);
	if(!config.sequence || config.sequence.length === 0) return;
	
	var name = function(name) {return function(x) {return x.name === name;};};
	var base = config.sequence.filter(name("root"))[0].layerList.filter(name("background"))[0];
	var video = base.sequenceList.filter(name("main"))[0].layerList.filter(name("video"))[0].param;
	var image = base.sequenceList.filter(name("main"))[0].layerList.filter(name("relatedBackground"))[0].param;
	var params = base.sequenceList.filter(name("reporting"))[0].layerList.filter(name("reporting"))[0].param.extraParams;
	
	var title = unescape(params.videoTitle.replace(/\+/g, " ").replace(/\\u/g, "%u").replace(/\\["'\/\\]/g, function(s){return s.charAt(1);})); // sic
	var poster = image.imageURL.replace(/\\\//g,"/");
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", video.autoURL.replace(/\\\//g,"/"), true);
	xhr.addEventListener("load", function () {
		var xml = JSON.parse(xhr.responseText);
		var sources = [];
		for(var i = xml.alternates.length - 1; i >= 0; i--) {
			var source = xml.alternates[i];
			sources.push({"url": source.template.replace(/mnft$/, "mp4"), "format": source.name + "p MP4", "height": parseInt(source.name), "isNative": true});
		}
		callback({"playlist": [{"title": title, "poster": poster, "sources": sources}]});
	}, false);
	xhr.send(null);
},

"processVideoID": function(videoID, callback) {
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://www.dailymotion.com/sequence/full/" + videoID, true);
	xhr.addEventListener("load", function() {
		var callbackForEmbed = function(videoData) {
			videoData.playlist[0].siteInfo = {"name": "Dailymotion", "url": "http://www.dailymotion.com/video/" + videoID};
			callback(videoData);
		};
		_this.processConfig(xhr.responseText, callbackForEmbed);
	}, false);
	xhr.send(null);
}

});
