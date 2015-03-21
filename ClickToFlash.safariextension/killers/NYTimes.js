addKiller("NYTimes", {
	
"canKill": function(data) {
	return /^https?:\/\/static\d*\.nyt\.com\/video\//.test(data.src);
},

"process": function(data, callback) {
	var flashvars = parseFlashVariables(data.params.flashvars);
	var url = "http://www.nytimes.com/svc/video/api/v2/video/" + flashvars.id;
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.addEventListener("load", function() {
		var media = JSON.parse(xhr.responseText);
		
		var sources = media.renditions.filter(function(e) {
			return e.video_codec === "H264" && /video_\d*p_mp4/.test(e.type);
		});
		
		sources.sort(function(a, b) {
			if(a.height < b.height) return 1;
			else return -1;
		});
		for(var i = 0; i < sources.length; i++) {
			sources[i].format = sources[i].height + " MP4";
			sources[i].isNative = true;
		}
		
		var poster = media.images[0].url;
		for(var i = 0; i < media.images.length; i++) {
			if(media.images[i].type === "videoSixteenByNine768") {
				poster = media.images[i].url;
				break;
			}
		}
		
		var mediaData = {"playlist": [{
			"sources": sources,
			"poster": "http://www.nytimes.com/" + poster,
			"title": media.headline
		}]};
		
		mediaData.initScript = "try{\
			var container = this.parentNode.parentNode;\
			var sheet = container.insertBefore(document.createElement(\"style\"), container.firstChild).sheet;\
			sheet.insertRule(\".video-player-container object,.vhs-loader,.nytd-player-controls{display:none !important;}\", 0);\
		} catch(e) {}";
		mediaData.restoreScript = "try{\
			var container = this.parentNode.parentNode;\
			container.removeChild(container.getElementsByTagName(\"style\")[0]);\
		} catch(e) {}";
		
		callback(mediaData);
	}, false);
	xhr.send(null);
}

});
