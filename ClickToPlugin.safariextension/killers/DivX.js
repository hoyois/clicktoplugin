addKiller("DivX", {

"canKill": function(data) {
	return data.plugin === "DivX" && canPlayDivX;
},

"process": function(data, callback) {
	callback({
		"playlist": [{
			"poster": data.params.previewimage,
			"sources": [{"url": data.src, "isNative": false, "mediaType": "video"}]
		}]
	});
}

});
