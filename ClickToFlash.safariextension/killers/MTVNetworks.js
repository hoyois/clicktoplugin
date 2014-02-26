addKiller("MTVNetworks", {

"contexts": {
	"cms:video:thedailyshow.com:": "",
	"cms:episode:thedailyshow.com:": "5",
	"cms:video:colbertnation.com:": "8",
	"cms:episode:colbertnation.com:": "7",
	"arc:video:gametrailers.com:": "",
	"arc:video:southparkstudios.com:": "",
	"arc:episode:southparkstudios.com:": "3",
	"arc:video:comedycentral.com:": "",
	"arc:playlist:comedycentral.com:": "6",
	"arc:episode:comedycentral.com:": "",
	"arc:promo:tosh.comedycentral.com:": "",
	"arc:video:tosh.comedycentral.com:": "",
	"arc:episode:tosh.comedycentral.com:": "1"//,
	// "hcx:content:comedycentral.co.uk:": "", // no working context
	// "uma:video:mtv.com:": "", // only rtmpe
	// "uma:videolist:mtv.com:": "" // only rtmpe
},

"canKill": function(data) {
	return data.src.indexOf("media.mtvnservices.com") !== -1;
},

"process": function(data, callback) {
	var mgid = /mgid:([^.]*[.\w]+:)[-\w]+/.exec(data.src);
	if(!mgid) return;
	var context = "";
	if(this.contexts[mgid[1]]) context = "/context" + this.contexts[mgid[1]];
	
	var _this = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://media.mtvnservices.com/pmt/e1/players/mgid:" + mgid[1] + context + "/config.xml", true);
	xhr.addEventListener("load", function() {
		var xml = xhr.responseXML;
		var feedURL = xml.getElementsByTagName("feed")[0].textContent.replace(/\n/g, "").replace("{uri}", mgid[0]);
		if(feedURL) _this.processFeedURL(feedURL, mgid[1], callback);
	}, false);
	xhr.send(null);
},

"processFeedURL": function(feedURL, mgid, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", feedURL, true);
	xhr.addEventListener("load", function() {
		var xml = new DOMParser().parseFromString(xhr.responseText.replace(/^\s+/,""), "text/xml");
		var items = xml.getElementsByTagName("item");
		
		var list = [];
		var playlist = [];
		
		var content, poster, title, obj;
		for(var i = 0; i < items.length; i++) {
			content = items[i].getElementsByTagNameNS("http://search.yahoo.com/mrss/", "content")[0];
			if(!content) continue;
			obj = {"content": content.getAttribute("url")};
			
			poster = items[i].getElementsByTagNameNS("http://search.yahoo.com/mrss/", "thumbnail")[0];
			if(poster) obj.poster = poster.getAttribute("url");
			
			title = items[i].getElementsByTagName("title")[0];
			if(title) obj.title = title.textContent;
			
			list.push(obj);
		}
		
		var length = list.length - 1;
		
		var next = function() {
			if(list.length === 0) callback({"playlist": playlist});
			else addToPlaylist(list.shift());
		};
		
		var addToPlaylist = function(obj) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", obj.content, true);
			delete obj.content;
			xhr.addEventListener("load", function() {
				var renditions = xhr.responseXML.getElementsByTagName("rendition");
				
				var sources = [];
				var src, index;
				for(var i = renditions.length -1 ; i >= 0; i--) {
					var source = typeInfo(renditions[i].getAttribute("type"));
					if(source === null) continue;
					
					src = renditions[i].getElementsByTagName("src")[0].textContent;
					index = src.indexOf("/gsp.");
					if(index === -1) continue;
					source.url = "http://mtvnmobile.vo.llnwd.net/kip0/_pxn=0+_pxK=18639/44620/mtvnorigin" + src.substring(index);
					
					source.format = renditions[i].getAttribute("bitrate") + "k " + source.format;
					source.height = parseInt(renditions[i].getAttribute("height"));
					sources.push(source);
				}
				
				if(sources.length === 0) {
					if(list.length === length) return;
				} else {
					obj.sources = sources;
					playlist.push(obj);
				}
				
				next();
			}, false);
			xhr.send(null);
		};
		
		next();
		
	}, false);
	xhr.send(null);
}

});
