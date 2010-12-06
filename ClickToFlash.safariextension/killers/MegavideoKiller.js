function MegavideoKiller() {
    this.name = "MegavideoKiller";
}

MegavideoKiller.prototype.canKill = function(data) {
    if(safari.extension.settings["QTbehavior"] === 1 || !canPlayFLV) return false;
    if(data.src === "http://wwwstatic.megavideo.com/mv_player.swf") {data.onsite = true; return true;};
    if(data.src.indexOf("megavideo.com/v/") !== -1) {data.onsite = false; return true;}
    return false;
};

MegavideoKiller.prototype.processElement = function(data, callback) {
    if(data.onsite) {
        var getVariable = function(s) {
            return getFlashVariable(data.params, s);
        };
        this.finalizeProcessing(getVariable, null, callback);
        return;
    } 
    
    // embedded video
    var matches = data.src.match(/megavideo\.com\/v\/([A-Z0-9]{8})/);
    if(!matches) return;
    
    var url = "http://megavideo.com/?v=" + matches[1];
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    var _this = this;
    xhr.onload = function() {
        var getVariable = function(s) {
            var matches = xhr.responseText.match(new RegExp("flashvars\\." + s + "\\s=\\s\\\"([^\"]*)\\\";"));
            if(matches) return matches[1];
            else return "";
        };
                
        _this.finalizeProcessing(getVariable, {"name": "Megavideo", "url": url}, callback);
    };
    xhr.send(null);
};

MegavideoKiller.prototype.finalizeProcessing = function(getVariable, siteInfo, callback) {
    var badgeLabel = "Video";
    var hd = "";
    
    if(safari.extension.settings["maxresolution"] > 1 && getVariable("hd") === "1") {
        hd = "hd_";
        badgeLabel = "HD&nbsp;Video";
    }
    
    var title = decodeURIComponent(getVariable("title")).replace(/\+/g, " ").toUpperCase();
    var videoURL = "http://www" + getVariable(hd + "s") + ".megavideo.com/files/" + this.decrypt(getVariable(hd + "un"), getVariable(hd + "k1"), getVariable(hd + "k2")) + "/" + title + ".flv";
    
    var videoData = {
        "playlist": [{"siteInfo": siteInfo, "mediaType": "video", "title": title, "mediaURL": videoURL}],
        "badgeLabel": badgeLabel
    };
    callback(videoData);
};

// taken from http://userscripts.org/scripts/review/87011
MegavideoKiller.prototype.decrypt = function(str, key1, key2) {
    var loc1 = [];
    for (var loc3 = 0; loc3 < str.length; ++loc3) {
        loc1.push(("000" + parseInt(str.charAt(loc3), 16).toString(2)).slice(-4));
    }
    loc1 = loc1.join("").split("");
    var loc6 = [];
    for (var loc3 = 0; loc3 < 384; ++loc3) {
        key1 = (key1 * 11 + 77213) % 81371;
        key2 = (key2 * 17 + 92717) % 192811;
        loc6[loc3] = (key1 + key2) % 128;
    }
    for (var loc3 = 256; loc3 >= 0; --loc3) {
        var loc5 = loc6[loc3];
        var loc4 = loc3 % 128;
        var loc8 = loc1[loc5];
        loc1[loc5] = loc1[loc4];
        loc1[loc4] = loc8;
    }
    for (var loc3 = 0; loc3 < 128; ++loc3) {
        loc1[loc3] = loc1[loc3] ^ loc6[loc3 + 256] & 1;
    }
    var loc12 = loc1.join("");
    var loc7 = [];
    for (var loc3 = 0; loc3 < loc12.length; loc3 = loc3 + 4) {
        var loc9 = loc12.substr(loc3, 4);
        loc7.push(loc9);
    }
    var loc2 = [];
    for (var loc3 = 0; loc3 < loc7.length; ++loc3) {
        loc2.push(parseInt(loc7[loc3], 2).toString(16));
    }
    return loc2.join("");
};
