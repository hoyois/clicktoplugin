addKiller("ThemisMedia", {

"canKill": function(data) {
    return data.src.indexOf("themis-media.com/") !== -1;
},

"process": function(data, callback) {
    var configUrl = parseFlashVariables(data.params.flashvars).config;
    if (configUrl) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', configUrl, true);
        var _this = this;
        xhr.onload = function(event) {
            // Fix the response data. They send something that looks like JSON, but really isn't:
            // they mostly use the ' character for strings and keys instead of ". This should turn
            // it into valid JSON.
            var response = JSON.parse(event.target.response.replace(/'/g, '"'));

            var title = "Video";
            var posterUrl = null;
            var sourceUrl;

            response.playlist.forEach(function(elem) {
                if (elem.eventCategory === "Video") {
                    sourceUrl = elem.url;
                } else if (elem.eventCategory === "Video Splash") {
                    posterUrl = elem.url;
                }
            });
            if ("viral" in response.plugins) {
                title = unescapeHTML(response.plugins.viral.share.description);
            }

            if (sourceUrl) {
                callback({"playlist": [{
                    "title": title,
                    "poster": posterUrl,
                    "sources": [{
                        "url": sourceUrl,
                        "format": "MP4",
                        "isNative": true
                    }]
                }]});
            }
        };
        xhr.send(null);
    }
}

});
