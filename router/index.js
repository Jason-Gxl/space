/**
 * 路由入口
 */
var render = require("../render");

function router(req, res) {
	var url = req.url;

	if(/^\/?$/.test(url)) {
		render("index", res);
	} else {
		if(/^(?:\/view)?(\/[\w$-]+)\/?([^\?\.]*)?/.test(url)) {
			render("view" + RegExp.$1 + "/" + (RegExp.$2 || "index"), res);
		}
	}
}

module.exports = router;