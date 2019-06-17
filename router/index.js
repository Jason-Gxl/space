/**
 * 路由入口
 */
var render = require("../render");

function router(req, res) {
	var url = req.url;

	switch(true) {
		case /^\/?$/.test(url):
			render("index", res, {title: "~>^<~"});
		break;
		case /^\/admin\/?([^\?]*)?/.test(url):
			render("view/admin/" + (RegExp.$1 || "index"), res, {title: "~>^<~"});
		break;
		case /^\/dashboard\/?([^\?]*)?/.test(url):
			render("view/dashboard/" + (RegExp.$1 || "index"), res, {title: "~>^<~"});
		break;
		case /^\/map\/?([^\?]*)?/.test(url):
			render("view/map/" + (RegExp.$1 || "index"), res, {title: "~>^<~"});
		break;
		case /^\/webgl\/?([^\?]*)?/.test(url):
			render("view/webgl/" + (RegExp.$1 || "index"), res, {title: "~>^<~"});
		break;
		case /^\/pad\/?([^\?]*)?/.test(url):
			render("view/ePad/" + (RegExp.$1 || "index"), res, {title: "~>^<~"});
		break;
		default:
	}
}

module.exports = router;