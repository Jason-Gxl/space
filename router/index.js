/**
 * 路由入口
 */
var render = require("../render");

function router(req, res) {
	var url = req.url;

	switch(true) {
		case /^\/?$/.test(url):
			render("index", res);
		break;
		case /^(\/view)?\/admin\/?([^\?]*)?/.test(url):
			render("view/admin/" + (RegExp.$1 || "index"), res);
		break;
		case /^(\/view)?\/dashboard\/?([^\?]*)?/.test(url):
			render("view/dashboard/" + (RegExp.$1 || "index"), res);
		break;
		case /^(\/view)?\/map\/?([^\?]*)?/.test(url):
			render("view/map/" + (RegExp.$1 || "index"), res);
		break;
		case /^(\/view)?\/webgl\/?([^\?]*)?/.test(url):
			render("view/webgl/" + (RegExp.$1 || "index"), res);
		break;
		case /^(\/view)?\/ePad\/?([^\?]*)?/.test(url):
			render("view/ePad/" + (RegExp.$1 || "index"), res);
		break;
		default:
	}
}

module.exports = router;