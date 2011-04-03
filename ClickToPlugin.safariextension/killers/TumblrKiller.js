function TumblrKiller() {}

TumblrKiller.prototype.canKill = function(data) {
    if(data.plugin !== "Flash") return false;
    return /\?audio_file=/.test(data.src);
};

TumblrKiller.prototype.process = function(data, callback) {
    var audioURL = data.src.match(/\?audio_file=([^&]*)/);
    if(audioURL) audioURL =  audioURL[1] + "?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio";

    var mediaData = {
        "playlist": [{"sources": [{"url": audioURL, "isNative": true, "mediaType": "audio"}]}],
        "isAudio": true
    };
    callback(mediaData);
};

