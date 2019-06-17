/**
 *
 *
 * date: 2018-03-24
 * author: Jason
 * fileName: pen.js
 * describe: 笔
 *
 *
 */
;(function() {
	"use strict";

	function Pen(params) {
		this.name = params.name || "Pen";
		this.interimBuffer = [];
		this.buffer = [];
	}

	Pen.prototype = {
		constructor: Pen,
		active: function() {},
		// 绘制缓存接口，这里是将数据绘制到缓存画板上
		// status = 0
		bufferRender: function(_data, origin) {
			var self = this,
				data = !!origin?{type: "pen", data: [], status: 0, origin: !!origin, color: self.params.color, from: self.params.id, width: self.mainCanvas.offsetWidth, height: self.mainCanvas.offsetHeight}:self.current.interimBuffer.pop();
			data.data.push(_data);
			self.current.interimBuffer.push(data);
			self.render(data);
		},
		// 绘制最终结果，这里是将数据绘制到持久画板上
		// status = 1
		render: function() {
			var self = this, data = self.current.interimBuffer.shift();
			if(!data) return ;

			do {
				data.status = 1;
				self.current.buffer.push(data);
				self.render(data);
				data = self.current.interimBuffer.shift();
			} while(data);
		},
		destory: function() {
			
		}
	};

	var vm = window.vm || {};
	vm.module = vm.module || {};
	vm.module.pen = Pen;
	window.vm = vm;
}());