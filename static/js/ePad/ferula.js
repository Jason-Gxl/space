/**
 *
 *
 * date: 2018-03-24
 * author: Jason
 * fileName: ferula.js
 * describe: 教鞭
 *
 *
 */
;(function() {
	"use strict";
	var pos = null;

	function Ferula(params) {
		this.name = params.name || "Ferula";
		// 存储持久数据
		this.buffer = [];
	}

	Ferula.prototype = {
		constructor: Ferula,
		active: function() {},
		// 鼠标绘制接口
		mouseRender: function(data) {
			var self = this;
			data = {type: "ferula", data: [data.x, data.y], from: self.params.id, width: self.mainCanvas.offsetWidth, height: self.mainCanvas.offsetHeight};
			pos = data;
			self.mouseRender.call(self, data);
		},
		destory: function() {
			var self = this;
			self.current.mouseRender.call(self, {x: -1, y: -1});
		}
	};

	var vm = window.vm || {};
	vm.module = vm.module || {};
	vm.module.ferula = Ferula;
	window.vm = vm;
}());