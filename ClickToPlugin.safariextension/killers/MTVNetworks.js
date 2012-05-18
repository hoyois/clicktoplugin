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

/*

# Should work with the following URLs:

- http://www.colbertnation.com/full-episodes/thu-december-15-2011-daniel-craig
- http://www.thedailyshow.com/full-episodes/thu-december-15-2011-matt-damon
- http://gametrailers.com/video/preview-binary-domain/725281
- http://www.thedailyshow.com/collection/404874/the-republican-field/120707
- http://www.colbertnation.com/the-colbert-report-collections/403545/bye-bye-bye-plan/
- http://www.mtv.com/videos/movie-trailers/722144/men-in-black-3.jhtml
- http://www.southparkstudios.co.uk/clips/sp_vid_254168/
- http://www.comedycentral.com/shows/30-rock/index.jhtml
- http://www.southparkstudios.com/

# Config URLs for the various MTV network sites

The context number is important.  If someone know's how to derive it, then please let me
know.

Daily Show Clips
- http://media.mtvnservices.com/pmt/e1/players/mgid:cms:video:thedailyshow.com:/context11/config.xml
Daily Show Episodes
- http://media.mtvnservices.com/pmt/e1/players/mgid:cms:episode:thedailyshow.com:/context5/config.xml
Colbert Report Episodes
- http://media.mtvnservices.com/pmt/e1/players/mgid:cms:episode:colbertnation.com:/context7/config.xml
Colbert Report Clips
- http://media.mtvnservices.com/pmt/e1/players/mgid:cms:video:colbertnation.com:/context8/config.xml
Gametrailers
- http://media.mtvnservices.com/pmt/e1/players/mgid:moses:video:gametrailers.com:/context1/config.xml
*/


addKiller("MTVNetworks", {

"contexts": {
	"cms:video:thedailyshow.com:": "context11",
	"cms:episode:thedailyshow.com:": "context5",
	"cms:episode:colbertnation.com:": "context7",
	"cms:video:colbertnation.com:": "context8",
	"moses:video:gametrailers.com:": "context1",
	"cms:item:southparkstudios.com:": "context1",
	"cms:content:southparkstudios.com:": "context2",
	"cms:video:comedycentral.com:": "context6",
	"cms:video:tosh.comedycentral.com:": "context2",
	"hcx:content:comedycentral.co.uk:": "context3"
},
"canKill": function(data) {
	return data.src && data.src.indexOf("media.mtvnservices.com") !== -1;
},
"process": function(data, callback) {
//	console.log(data);

	var flashvars = parseFlashVariables(data.params.flashvars);
	var matches = /mgid:(.*?\.\w+:)[-\w]+/.exec(data.src);
	var mgid = matches[0];

	// The context number in the URL below is important.  I can't figure out how to derive
	// it or even better derive the entire URL.
	// The swf on the page redirects to a URL the contains the all important config url.
	// As far as I can see there's know way to grab the redirected location.
	//
	// E.g., this URL (which is the data.src): http://media.mtvnservices.com/mgid:cms:video:colbertnation.com:404447
	// redirects to this:
	// http://media.mtvnservices.com/player/prime/mediaplayerprime.1.11.3.swf?uri=mgid:cms:video:colbertnation.com:404447&type=normal&ref=None&geo=GB&group=entertainment&&CONFIG_URL=http%3a%2f%2fmedia.mtvnservices.com%2fpmt%2fe1%2fplayers%2fmgid%3acms%3avideo%3acolbertnation.com%3a%2fcontext3%2fconfig.xml%3furi%3dmgid%3acms%3avideo%3acolbertnation.com%3a404447%26type%3dnormal%26ref%3dNone%26geo%3dGB%26group%3dentertainment%2
	//
	// You can see in the URL immediately above that the CONFIG_URL is there, but how do
	// I grab it?
	// The configURL isn't in the data var either.  I can't access the current page from
	// the killer unless I make an XHR to grab it, but even if I do that I can't grab
	// the redirected URL.
	// XHR'ing the data.src erases any evidence of Location headers.  I thought I could
	// perhaps inject an iframe into the globalpage, with its src = data.src, but Safari
	// doesn't even attempt to load the content.

	// So en lieu of being able to accurately derive the configURL, I do the best I can
	// with the info available in the data var and the knowledge that I've acquired
	// when visiting each of the supported sites.

	// I've discovered that the context number given in the CONFIG_URL varies depending on
	// your geo location, you'll either be provided with a context number
	// that works or one that doesn't.  E.g., colbert episodes provides me with a context
	// of 7 in the US but 5 in the UK. context5 doesn't work.
	// So it's perhaps better that we don't derive it but instead hardcode it.

	// Try to get a context, if we can't lets set it to context1, it might work.  Better
	// than nothing.
	var context = this.contexts[matches[1]];
	if( typeof(context) == "undefined" )
		context = "context1";

	var configURL = 'http://media.mtvnservices.com/pmt/e1/players/mgid:'+ matches[1] +'/' + context + '/config.xml';
	if( mgid.indexOf('mtv.com') >= 0 )
		configURL = 'http://www.mtv.com/player/embed/AS3/configuration.jhtml?uri=' + mgid + '&type=network&ref=www.mtv.com';

//	console.log(configURL);

	var callbackData = {"playlist": []};
	var _this = this;

	var xhr = new XMLHttpRequest();
	xhr.open('GET', configURL , true);
	xhr.onload = function() {
		var doc = new DOMParser().parseFromString(this.responseText.replace(/^\s+/,''), "text/xml");
		var feedElement = doc.getElementsByTagName('feed')[0];
		var feedURL = feedElement.textContent;
		feedURL = feedURL.replace('{uri}',mgid);
		var fluxAccountDomain = doc.getElementsByTagName('fluxAccountDomain')[0].textContent;
		siteName = fluxAccountDomain.replace('community.','');
		data.siteName = siteName;

		// MTV has the info this doc, so there's no need to make an additional XHR
		var renditionsURLs = _this.getRenditionsURLsFromDoc( doc, data, callbackData, callback);

		// No renditionsURLs ? Then we're probably not on mtv so we'll need to make the
		// additional call that gets us the resource that contains the renditions.
		if( renditionsURLs.length == 0 )
			renditionsURLs = _this.getRenditionsURLsFromFeed( feedURL, data, callbackData, _this.processRenditions, callback);
		else
			_this.processRenditions( renditionsURLs, data, callbackData, callback );
	};
	xhr.send();

	return;
},
"getRenditionsURLsFromDoc": function( doc, data, callbackData, callback) {

	var items = doc.getElementsByTagName('item');
	var item, renditionsURLs, poster, title;

	renditionsURLs = [];

	for( var i = 0; i < items.length ; i++ ) {
		item = items[i];

		var itemContentTag = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/','content');

		if( !itemContentTag.length )
			continue;

		var renditionURL = itemContentTag[0].getAttribute('url');

		// all renditionURLs happen to have have mediagen in their paths.  This check
		// is to avoid adding URLs that don't return renditions.
		if(  /mediagen/i.test(renditionURL) ) {

			renditionsURLs.push( renditionURL );
			playlistItem = {};

			if( item.getElementsByTagNameNS('http://search.yahoo.com/mrss/','thumbnail').length > 0 )
				playlistItem.poster = (item.getElementsByTagNameNS('http://search.yahoo.com/mrss/','thumbnail')[0]).getAttribute('url');

			if( item.getElementsByTagName('title').length > 0 )
				playlistItem.title = (item.getElementsByTagName('title')[0]).textContent;

			playlistItem.sources = [];
			callbackData.playlist.push(playlistItem);
		}

	}

	return renditionsURLs;
},
"getRenditionsURLsFromFeed": function( feedURL, data, callbackData, processCallback, callback) {
	var _this = this;
	var xhr2 = new XMLHttpRequest();
	xhr2.open('GET',feedURL, true);
	xhr2.onload = function() {
		var doc = new DOMParser().parseFromString(this.responseText.replace(/^\s+/,''), "text/xml");
		var renditionsURLs = _this.getRenditionsURLsFromDoc( doc, data, callbackData, callback);

		if( processCallback )
			return processCallback(renditionsURLs, data, callbackData, callback);
	};
	xhr2.send();
	return;
},
"processRenditions": function(renditionsURLs, data, callbackData, callback) {

	// we use the todo var to track the number of jobs (i.e., XHR calls) that
	// we need to make in order to get the sources for all the playlists
	var todo = renditionsURLs.length;
	for( var j = 0; j < renditionsURLs.length ; j++ ) {

		// we can never be sure of the value of j if we don't use an anonymous wrapper
		// function.  We're making sure that the onload callback is able to reference the
		// value of j at the time the xhr was made.
		( function(j) {

			var xhr3 = new XMLHttpRequest();
			xhr3.open('GET', renditionsURLs[j], true);
			xhr3.onload = function() {

				var doc = new DOMParser().parseFromString(this.responseText.replace(/^\s+/,''), "text/xml");
				var sources = [];
				var renditions = doc.getElementsByTagName('rendition');

				for( var i = renditions.length - 1; i >= 0; i-- ) {

					var src = renditions[i].getElementsByTagName('src')[0];
					var source = {};
					source.height = renditions[i].getAttribute('height');
					source.format = renditions[i].getAttribute('bitrate') + "k MP4";
					source.isNative = renditions[i].getAttribute('type').indexOf('mp4') !== -1;
					source.url = src.textContent;

					// Very hacky but this makes colbertnation + dailyshow sources work
					// that otherwise wouldn't
					source.url = source.url.replace(/rtmpe:\/\/\w+.fplive.net\/\w+/,'http://mtvnmobile2.rd.llnwd.net/44620/mtvnorigin');

					// we don't want to add rmpt or rtmpe sources to our sources array.
					// we're not able to play those.
					if( !/^rtmpe?:\/\//.test( source.url ) )
						sources.push(source);
				};

				// we only add sources to the playlist if we have any.
				if( sources.length )
					callbackData.playlist[j].sources = sources;

				// we're done iterating through the sources, so we that one job done
				// therefore we decrement the job list var
				todo--;

				// all our xhr requests have finished, lets finish up by calling the callback
				if( todo <= 0 ) {

					// just incase there are some playlists with no valid sources
					// lets remove them.
					callbackData.playlist = callbackData.playlist.filter( function(element, index, array) {
						return (element.sources && element.sources.length > 0);
					});

					// that's it, we've generated the callbackData now call the callback
					callback( callbackData );
				}

			};
			xhr3.send();
		})(j);
	}
	return;
}


});