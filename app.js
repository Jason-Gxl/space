/**
 * 
 */
var router = require("./router");
var render = require("./render");
var queryString = require("queryString");
var url = require("url");
var request = require("request");

function app(req, res) {
	var urlStr = req.url;
	var params = queryString.parse(url.parse(urlStr).query);
	console.log(params.url);

	if(/\bproxy\b/.test(urlStr)) {
		request.get({url: params.url}, function(err, response, body) {
			let reg = /<\s*(link|script)[\s\S]+(?:href|src)\s*=\s*(?:\"|\')(.+)(?:\"|\')[\s\S]*\1\s*>/g;
			let arr = [];
			let list = [];

			res.setHeader('Access-Control-Allow-Origin', '*');
			res.writeHead(200, {'Content-type': 'application/json'});

			if(!response) {
				return res.end(JSON.stringify(list));
			}

			while((arr = reg.exec(response.body)) != null) {
				list.push({
					type: 'link'===arr[1]?'style':'script',
					url: params.url + arr[2]
				});
			}
			
			res.end(JSON.stringify(list));
		});
	} else {
		if(/\.[a-zA-Z]+$/.test(urlStr)) {
			render(__dirname + urlStr, res);
		} else {
			router(req, res);
		}
	}	
}

module.exports = app;