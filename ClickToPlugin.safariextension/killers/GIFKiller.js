function GIFKiller() {}

GIFKiller.prototype.canKill = function(data) {
    if(!safari.extension.settings.deanimateGIF || data.plugin !== "GIF") return false;
    return (hasExt("gif", data.src)); // use getMIMEType for sharper kill and just check data.plugin here?
};


GIFKiller.prototype.processElement = function(data, callback) {
    var image = new Image();
    var canvas = document.createElement("canvas");
    var handleLoadEvent = function(event) {
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height);
        var posterURL;
        try {posterURL = canvas.toDataURL();} catch(err) {return;}
        var imageData = {
            "playlist": [{"mediaType": "gif", "posterURL": posterURL, "sources": []}]
        };
        callback(imageData);
    };
    image.addEventListener("load", handleLoadEvent, false);
    image.src = data.src;
};