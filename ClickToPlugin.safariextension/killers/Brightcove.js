addKiller("Brightcove", {
	
"canKill": function(data) {
	return data.isObject && data.params["class"] == "BrightcoveExperience";
},

"process": function(data, callback) {
//try {
	// Load Brightcove's loader JavaScript
	if (this.brightcove === undefined)
	{
		var request = new XMLHttpRequest();
		request.open("GET", "https://sadmin.brightcove.com/js/BrightcoveExperiences.js", false);
		request.send(null);
		eval(request.responseText);
		this.brightcove = brightcove;
		
		// Override this function so we always get an HTML5 player.
		this.brightcove.determinePlayerType = function () { return brightcove.playerType.HTML };
	}
	
	// Reconstruct the "experience" object.
	var outer = document.createElement("div");
	var exp = document.createElement("object");
	exp.className = "BrighcoveExperience";
	outer.appendChild(exp);
	
	if (!data.params.hasOwnProperty("pubCode"))
		data.params.pubCode = "";
	
	// Use HTTPS always
	data.params.secureConnections = "true";
	
	for (var p in data.params)
	{
		if (p == "class" || p == "type") continue;
		var param = document.createElement("param");
		param.setAttribute("name", this.fixParamCase(p));
		param.setAttribute("value", data.params[p]);
		exp.appendChild(param);
	}
	
	// Ask Brightcove's loader to process it.
	this.brightcove.collectExperiences = function () { return new Array(exp) };
	this.brightcove.createExperiences(null, null);
	
	// Unfortunately we can't just reach into the resulting iframe, so we have
	// to make a subsequent XMLHttpRequest for it.
	if (outer.childElementCount == 0 || !(outer.firstChild instanceof HTMLIFrameElement))
		return;
	
	var request = new XMLHttpRequest();
	request.open("GET", outer.firstChild.getAttribute("src"), false);
	request.send(null);
	
	// Grab the useful JSON data out of it
	var match = /var experienceJSON = .*/.exec(request.responseText);
	if (match == false) return;
	eval(match[0]);
	
	// Now we can build up the result for the callback.
	var mediadata = {
		"playlist": [{
			"poster": "",
			"sources": [ ]
		}]
	};
	
	// Can't guarantee the format of the JSON; use a try block.
	try {
		mediadata.playlist[0].poster = experienceJSON.data.configuredProperties.backgroundImage;
		
		var renditions = experienceJSON.data.programmedContent.videoPlayer.mediaDTO.renditions;
		for (var i = 0; i < renditions.length; i ++)
		{
			var r = renditions[i];
			if (!r.hasOwnProperty("defaultURL")) continue;
			
			var urlinfo = urlInfo(r.defaultURL);
			
			var source = { };
			source.url = r.defaultURL;
			source.isAudio = r.audioOnly || (urlinfo ? urlinfo.isAudio : false);
			source.isNative = (urlinfo ? urlinfo.isNative : false);
			source.format = r.videoCodec || (urlinfo ? urlinfo.format : "unknown");
			
			if (r.hasOwnProperty("frameHeight"))
			{
				source.height = r.frameHeight;
				source.format += " " + source.height.toString() + "p";
			}
			
			mediadata.playlist[0].sources.push(source);
		}
	} catch(e) { /* alert("Error " + e.toString()); */ }
	
	// Yay, we're done.
	callback(mediadata);
//} catch(e) { alert("Error " + e.toString()); }
},

// ClickToPlugin passes us param names in lowercase, but Brightcove is picky.
"fixParamCase": function(param) {
	switch(param)
	{
		case "autostart":        return "autoStart";
		case "dynamicstreaming": return "dynamicStreaming";
		case "isui":             return "isUI";
		case "isvid":            return "isVid";
		case "playerid":         return "playerID";
		case "playerkey":        return "playerKey";
		case "@videoplayer":     return "@videoPlayer";
		default: return param;
	}
}

});
