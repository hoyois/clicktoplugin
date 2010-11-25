function TumblrKiller() {
    this.name = "TumblrKiller";
}

TumblrKiller.prototype.canKill = function(data) {
    return /\?audio_file=/.test(data.src);
};

TumblrKiller.prototype.processElement = function(data, callback) {
    var audioURL = data.src.match(/\?audio_file=([^&]*)(?:&|$)/);
    if(audioURL) audioURL =  audioURL[1] + "?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio";

    var mediaData = {
        "playlist": [{"mediaType": "audio", "mediaURL": audioURL}],
        "badgeLabel": "Audio",
        "isAudio": true
    };
    callback(mediaData);
};

