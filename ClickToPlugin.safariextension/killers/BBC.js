addKiller("BBC", {

"canKill": function(data) {
	return data.location.indexOf("bbc.co.uk") !== -1;
},

"process": function(data, callback) {
	if( !this.videoInfo )
		this.videoInfo = data.params.externalidentifier;
	
	if(!/emp.swf/.test(data.src)) {
		return;
	}
	
	var flashvars = parseFlashVariables(data.params.flashvars);

	var url = "http://open.live.bbc.co.uk/mediaselector/4/jsfunc/stream/" + this.videoInfo + "/processJSON/";
	this.videoInfo = null;
	
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