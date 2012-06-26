/*
Copyright 2011 Paul Grave

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

addKiller("BBC", {

"canKill": function(data) {
	return data.params && data.params.id && data.location.indexOf("bbc.co.uk") !== -1;
},
"process": function(data, callback) {
	
	if(!/emp.swf/.test(data.src))
		return;
	
	var flashvars = parseFlashVariables(data.params.flashvars);
	var playlistURL = decodeURIComponent(flashvars.playlist);
	
	if(playlistURL === "undefined") { // BBC bug
		playlistURL = data.location.replace(/^http:\/\/www/, "http://playlists").replace(/[#?].*$/, "") + "A/playlist.sxml";
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open('GET', playlistURL, true);
	xhr.addEventListener("load", function (event) {
		var doc = event.target.responseXML;
		var mediatorElements = doc.getElementsByTagName('mediator');
	
		if( !mediatorElements.length ) 
			return;
		
		var titleElements = doc.getElementsByTagName('title');
		var title, poster;
		
		if ( titleElements.length ) {
			title = titleElements[0].textContent;
		};
		
		var linkElements = doc.getElementsByTagName('link');
		
		for( var i = 0; i < linkElements.length ; i++ ) {
			if( linkElements[i].getAttribute('rel') == 'holding' ) {
				poster = linkElements[i].getAttribute('href');
				break;
			}
		}
		
		var url = "http://open.live.bbc.co.uk/mediaselector/4/jsfunc/stream/" + mediatorElements[0].getAttribute('identifier') + "/processJSON/";
		
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.addEventListener("load", function(event) {

			var processJSON = function(data) {
				if( data.result != 'ok' )
					return;

				var sources;

				sources = [];
				data.media.forEach( function( media, i ) {
					if( !(media.connection instanceof Array) && typeof(media['connection']) != undefined )
						return;

					var connection = media.connection[0];

					if( typeof(connection['protocol']) != undefined && connection.protocol != 'http' )
						return;

					if( connection.href && media.bitrate && media.height )
					   sources.push({"url": connection.href , "format":  media.bitrate + "k MP4", "height": media.height, "isNative": true});
				});

				if(sources.length > 0) callback({
					"playlist": [{
						"title": title,
						"poster": poster,
						"sources": sources
				 }]});
			};
			eval(event.target.response);
		}, false);
		xhr.send(null);
	}, false);
	xhr.send(null);
	
	

}

});