addKiller("Brightcove", {
"canKill": function(data) {
	return data.isObject && data.params["class"] == "BrightcoveExperience";
},

"process": function(data, callback) {
try
{
	// Load Brightcove's loader JavaScript
	var request = new XMLHttpRequest();
	request.open("GET", "http://admin.brightcove.com/js/BrightcoveExperiences.js", false);
	request.send(null);
	
	// Reconstruct the "experience" object.
	var parent = document.createElement("div");

	var exp = document.createElement("object");
	exp.className = "BrighcoveExperience";
	parent.appendChild(exp);

	if (!data.params.hasOwnProperty("pubCode"))
		data.params["pubCode"] = "";

	for (var p in data.params)
	{
		if (p == "class" || p == "type") continue;
		var param = document.createElement("param");
		param.setAttribute("name", this.fixParamCase(p));
		param.setAttribute("value", data.params[p]);
		exp.appendChild(param);
	}
	
	// Ask Brightcove's loader to process it
	eval(request.responseText);
	brightcove.collectExperiences = function () { return new Array(exp) };
	brightcove.determinePlayerType = function () { return brightcove.playerType.HTML };
	brightcove.createExperiences(null, null);
	
	// Request the source of the iframe's page
	var request = new XMLHttpRequest();
	request.open("GET", parent.firstChild.getAttribute("src"), false);
	request.send(null);
	
	// Grab the useful JSON data out of it
	var match = /var experienceJSON = .*/.exec(request.responseText);
	if (match == false) return;
	eval(match[0]);
	
	// Now we can build up the result for the callback.
	var result = {
		"playlist": [{
			"poster": experienceJSON.data.configuredProperties.backgroundImage,
			"sources": [ ]
		}]
	};
	
	var renditions = experienceJSON.data.programmedContent.videoPlayer.mediaDTO.renditions;
	for (var i = 0; i < renditions.length; i ++)
	{
		var r = renditions[i];
		var urlinfo = urlInfo(r.defaultURL);
		
		var s = { };
		s["url"] = r.defaultURL;
		s["isAudio"] = r.audioOnly;
		s["height"] = r.frameHeight;
		s["format"] = r.videoCodec;
		s["isNative"] = urlinfo ? urlinfo.isNative : "false";
		result.playlist[0].sources.push(s);
	}
	
	// Yay, we're done.
	callback(result);
	
} catch(err)
{
	alert("Error " + err.toString() + " on line " + err.lineNumber);
}
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
