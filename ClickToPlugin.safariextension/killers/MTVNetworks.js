addKiller("MTVNetworks", {

"contexts": {
	"arc:video:thedailyshow.com:": "4",
	"arc:episode:thedailyshow.com:": "5",
	"arc:playlist:thedailyshow.com:": "8",
	"arc:video:colbertnation.com:": "5",
	// "arc:episode:colbertnation.com:": "", // no feed
	"arc:video:gametrailers.com:": "",
	"arc:video:southparkstudios.com:": "",
	"arc:episode:southparkstudios.com:": "3",
	"arc:video:comedycentral.com:": "",
	"arc:playlist:comedycentral.com:": "6",
	"arc:episode:comedycentral.com:": "",
	"arc:promo:tosh.comedycentral.com:": "",
	"arc:video:tosh.comedycentral.com:": "",
	"arc:episode:tosh.comedycentral.com:": "1"//
	// "uma:video:mtv.com:": "", // only rtmpe
	// "uma:videolist:mtv.com:": "" // only rtmpe
},

"aliases": {
	"arc:episode:colbertnation.com:": "arc:video:colbertnation.com:",
	"arc:episode:southpark.de:": "arc:episode:southparkstudios.com:"
},

"canKill": function(data) {
	if(data.src.indexOf("media.mtvnservices.com") !== -1) return true;
	if(/^http:\/\/southpark\.cc\.com/.test(data.location)) {data.hulu = true; return true;}
	return false;
},

"process": function(data, callback) {
	if(data.hulu) {
		var _this = this;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", data.location, true);
		xhr.addEventListener("load", function() {
			var mgid = /\bdata-mgid=\"(mgid:([^.]*[.\w]+:)[-\w]+)\"/.exec(xhr.responseText);
			if(!mgid) return;
			mgid.shift();
			_this.processMGID(mgid, callback);
		}, false);
		xhr.send(null);
	} else {
		var mgid = /mgid:([^.]*[.\w]+:)[-\w]+/.exec(data.src);
		if(!mgid) return;
		this.processMGID(mgid, callback);
	}
},

"processMGID": function(mgid, callback) {
	var context = "";
	if(this.aliases[mgid[1]]) mgid[1] = this.aliases[mgid[1]];
	if(this.contexts[mgid[1]]) context = "/context" + this.contexts[mgid[1]];
	
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://media.mtvnservices.com/pmt/e1/players/mgid:" + mgid[1] + context + "/config.xml", true);
	xhr.addEventListener("load", function() {
		var xml = xhr.responseXML;
		var feedURL = xml.getElementsByTagName("feed")[0].textContent.replace(/\n/g, "").replace("{uri}", mgid[0]);
		if(feedURL) _this.processFeedURL(feedURL, callback);
	}, false);
	xhr.send(null);
},

"processFeedURL": function(feedURL, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", feedURL, true);
	xhr.addEventListener("load", function() {
		var xml = new DOMParser().parseFromString(xhr.responseText.replace(/^\s+/,""), "text/xml");
		var channels = xml.getElementsByTagName("channel");
		if(channels.length !== 0) xml = channels[0];
		var items = xml.getElementsByTagName("item");
		
		var list = [];
		var playlist = [];
		
		for(var i = 0; i < items.length; i++) {
			var element = items[i].getElementsByTagName("guid")[0];
			if(!element) continue;
			var track = {"mgid": element.textContent};
			
			element = items[i].getElementsByTagNameNS("http://search.yahoo.com/mrss/", "thumbnail")[0];
			if(element) track.poster = element.getAttribute("url");
			
			element = items[i].getElementsByTagName("title")[0];
			if(element) track.title = element.textContent;
			
			list.push(track);
		}
		
		var length = list.length - 1;
		
		var next = function() {
			if(list.length === 0) callback({"playlist": playlist});
			else addToPlaylist(list.shift());
		};
		
		var addToPlaylist = function(track) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", "http://media.mtvnservices.com/player/html5/mediagen/?uri=" + track.mgid + "&device=iPad", true);
			delete track.mgid;
			xhr.addEventListener("load", function() {
				var xml = new DOMParser().parseFromString(xhr.responseText.replace(/^\s+/,""), "text/xml");
				var src = xml.getElementsByTagName("src")[0];
				if(src) {
					track.sources = [{"url": src.textContent, "format": "HLS", "isNative": true}];
					playlist.push(track);
				} else if(list.length === length) return;
				next();
			}, false);
			xhr.send(null);
		};
		
		next();
		
	}, false);
	xhr.send(null);
}

});
