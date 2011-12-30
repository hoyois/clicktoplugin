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
"externalidentifiers": {},
"process": function(data, callback) {
	var identifier = data.params.id;
	if( identifier && !this.externalidentifiers[identifier] && data.params.externalidentifier ){
		this.externalidentifiers[identifier] = data.params.externalidentifier;
	}

	var flashvars = parseFlashVariables(data.params.flashvars);
	var videoInfo = this.externalidentifiers[identifier];

	if(!/emp.swf/.test(data.src)) {
		return;
	}

	var flashvars = parseFlashVariables(data.params.flashvars);
	var url = "http://open.live.bbc.co.uk/mediaselector/4/jsfunc/stream/" + videoInfo + "/processJSON/";

	var processJSON = this.processJSON;
	var posterURL = decodeURIComponent(flashvars.holdingImage);
	var title = data.title;

	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onload = function() {

		var processJSON = function(data) {
			if( data.result != 'ok' )
				return;

			var siteInfo, sources;

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

			callback({
				"loadAfter": false,
				"playlist": [{
					"title": title,
					"poster": posterURL,
					"sources": sources
			 }]});


		};

		eval(xhr.responseText);
	};
	xhr.send(null);
}

});
