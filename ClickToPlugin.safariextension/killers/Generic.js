addKiller("Generic", {

"canKill": function(data) {
	// Streaming is not supported
	if(/^rts?p/.test(data.src) || data.params.href) return false;
	return (data.info = typeInfo(data.type)) || (data.info = extInfo(getExt(data.src)));
},

"process": function(data, callback) {
	data.info.url = data.src;
	callback({
		"playlist": [{
			"poster": data.params.previewimage,
			"sources": [data.info]
		}],
		"audioOnly": data.info.isAudio
	});
}

});
