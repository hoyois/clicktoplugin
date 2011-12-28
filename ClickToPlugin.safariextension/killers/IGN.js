addKiller("IGN", {

"canKill": function(data) {
	return data.src.indexOf("media.ign.com/ev/prod/embed.swf") !== -1;
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	
	var url;
	if(flashvars.config) {
		url = JSON.parse(decodeURIComponent(flashvars.config)).plugins.igncontrolbar.doc_referer;
	} else if(flashvars.url) {
		url = decodeURIComponent(flashvars.url);
	} else return;
	
	var siteInfo;
	if(!/^http:\/\/www\.ign\.com\/videos\//.test(data.location)) siteInfo = {"name": "IGN", "url": url};
	
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url + ".config", true);
	xhr.onload = function() {
		_this.processConfig(JSON.parse(xhr.responseText), siteInfo, callback);
	};
	xhr.send(null);
},

"processConfig": function(config, siteInfo, callback) {
	var title = decodeURIComponent(config.plugins.igncontrolbar.doc_title);
	
	var sources = [];
	config.playlist[1].bitrates.forEach(function(bitrate) {
		if(bitrate.height && bitrate.url)
			sources.push({"url": bitrate.url.replace(/mp4:/,"http://assets.ign.com/") , "format":  bitrate.height + "p MP4", "height": bitrate.height, "isNative": true});
	});
	
	callback({
		"playlist": [{
			"title": title,
			"sources": sources,
			"poster": config.playlist[0].url,
			"siteInfo": siteInfo
		}]
	});
}
	
});