addKiller("Generic", {

"canKill": function(data) {
	// Streaming is not supported
	if(/^rts?p/.test(data.src) || data.params.href) return false;
	return (data.source = HTML5.typeInfo(data.type)) || (data.source = HTML5.urlInfo(data.src));
},

"process": function(data, callback) {
	data.source.url = data.src;
	callback({
		"playlist": [{
			"poster": data.params.previewimage,
			"sources": [data.source]
		}],
		"audioOnly": data.source.isAudio,
	});
}

});
