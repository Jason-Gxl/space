/**
 * 页面渲染
 */
var fs = require("fs");

var MIME_TYPE = {
    "css": "text/css",
    "gif": "image/gif",
    "html": "text/html",
    "ico": "image/x-icon",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "text/javascript",
    "json": "application/json",
    "pdf": "application/pdf",
    "png": "image/png",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tiff": "image/tiff",
    "txt": "text/plain",
    "wav": "audio/x-wav",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "xml": "text/xml",
    "woff": "application/font-woff"
};

function render(file, res, params) {
	if(/\.[a-zA-Z]+$/.test(file)) {
		var fileArr = file.split("."),  ext = fileArr.pop() || "html", url = fileArr.join(".") + "." + ext;
	} else {
		var ext = "html", url = file + "." + ext;
    }

	fs.exists(url, function(exist) {
		if(!exist) return ;
		var content = fs.readFileSync(url, "binary");

		if("html"===ext && params) {
			for(var key in params) {
				var reg = new RegExp("{{" + key + "}}", "ig");
				content = content.replace(reg, params[key]);
			}
    }

		res.writeHead(200, {'Content-type' : MIME_TYPE[ext]});
		res.write(content, "binary");
		res.end();
	});
}

module.exports = render;