/**
 * 
 */
var router = require("./router");
var render = require("./render");

function app(req, res) {
	var url = req.url;

	if(/\.[a-zA-Z]+$/.test(url)) {
		render(__dirname + url, res);
	} else {
		router(req, res);
	}
}

module.exports = app;