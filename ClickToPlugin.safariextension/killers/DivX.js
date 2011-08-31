var killer = {};
addKiller("DivX", killer);

killer.canKill = function(data) {
	return data.plugin === "DivX" && canPlayDivX;
};


killer.process = function(data, callback) {
	callback({
		"playlist": [{
			"poster": data.params.previewimage,
			"sources": [{"url": data.src, "isNative": false, "mediaType": "video"}]
		}]
	});
};