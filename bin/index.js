/**
 * 服务
 */
var app = require("../app.js");
var http = require("http");

var defaultPort = 8089;

var port = normalizePort(process.env.PORT || defaultPort);

var server = http.createServer(app);

server.listen(port);

function normalizePort(val) {
	var port = parseInt(val, 10);

	if(isNaN(port) || 0>=port) {
		port = defaultPort;
	}

	return port;
}