addKiller("Brightcove", {
	
"canKill": function(data) {
	if(/^https?:\/\/(?:c|secure)\.brightcove\.com\/services\/viewer\/federated_f9/.test(data.src)) return true;
	if(/^http:\/\/graphics8\.nytimes\.com\/video\//.test(data.src)) {data.nyt = true; return true;}
	return false;
},

"process": function(data, callback) {
	var isSecure = data.src.charAt(4) === "s";
	var flashvars = parseFlashVariables(data.params.flashvars);
	
	var url;
	if(data.nyt) {
		url = "http://c.brightcove.com/services/viewer/htmlFederated?%40videoPlayer=ref%3A" + flashvars.id + "&playerID=2640832222001";
	} else if(/[&?]playerID=/.test(data.src)) {
		url = data.src.replace("federated_f9", "htmlFederated");
	} else {
		url = (isSecure ? "https://secure" : "http://c") + ".brightcove.com/services/viewer/htmlFederated?playerID=" + flashvars.playerID + "&playerKey=" + flashvars.playerKey + "&%40videoPlayer=" + flashvars.videoId;
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.addEventListener("load", function() {
		var i = xhr.responseText.indexOf("experienceJSON");
		if(i === -1) return;
		
		var s = xhr.responseText.substring(i + 17);
		s = s.substring(0, s.indexOf("\n") - 2);
		
		try {
			var media = JSON.parse(s).data.programmedContent.videoPlayer.mediaDTO;
		} catch(e) {
			return;
		}
		
		var sources = [];
		var processRendition = function(source) {
			// videoCodec can be H264, SORENSON, or ON2
			if(source.videoCodec !== "H264" || !source.defaultURL) return;
			var bitrate = Math.round(parseInt(source.encodingRate)/100000);
			var format = bitrate === 0 ? source.frameHeight + "p " : bitrate + "00k ";
			var ext = getExt(source.defaultURL);
			format += ext ? ext.toUpperCase() : "MP4";
			sources.unshift({"url": source.defaultURL, "format": format, "height": parseInt(source.frameHeight), "isAudio": source.audioOnly, "isNative": true});
		};
		
		media.renditions.forEach(processRendition);
		if(sources.length === 0) {
			media.IOSRenditions.forEach(processRendition);
			if(sources.length === 0) {
				var source = extInfo(getExt(media.FLVFullLengthURL));
				if(source && !media.FLVFullLengthStreamed) {
					source.url = media.FLVFullLengthURL;
					sources.push(source);
				} else return;
			}
		}
		
		var mediaData = {"playlist": [{
			"sources": sources,
			"poster": media.videoStillURL,
			"title": media.displayName
		}]};
		
		// Fix annoying behavior on nytimes.com
		if(/www\.nytimes\.com/.test(data.location)) {
			mediaData.initScript = "try{\
				var container = this.parentNode.parentNode;\
				var sheet = container.insertBefore(document.createElement(\"style\"), container.firstChild).sheet;\
				sheet.insertRule(\".video-player-container object,.nytd-player-controls{display:none !important;}\", 0);\
			} catch(e) {}";
			mediaData.restoreScript = "try{\
				var container = this.parentNode.parentNode;\
				var duplicate = container.getElementsByTagName(\"object\")[0];\
				if(duplicate) duplicate.parentNode.removeChild(duplicate);\
				container.removeChild(container.getElementsByTagName(\"style\")[0]);\
			} catch(e) {}";
		}
		
		callback(mediaData);
	}, false);
	xhr.send(null);
}

});
