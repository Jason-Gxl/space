/**
 *
 *
 * date: 2018-03-24
 * author: Jason
 * fileName: image.js
 * describe: 演示图片
 *
 *
 */
;(function() {
	"use strict";

	function Image(params) {
		this.name = params.name || "Image";
		this.interimBuffer = [];
		this.buffer = [];
	}

	Image.prototype = {
		constructor: Image,
		active: function() {},
		// 绘制缓存接口，这里是将数据绘制到缓存画板上
		// status = 0
		renderBuffer: function(data) {
			var self = this;
			var data = {type: "image", data: [data], status: 0, origin: true, from: self.params.id, width: self.mainCanvas.offsetWidth, height: self.mainCanvas.offsetHeight};
			self.toolbarMap.image.interimBuffer.push(data);
		},
		// 绘制最终结果，这里是将数据绘制到持久画板上
		// status = 1
		render: function(_data) {
			if(!_data) return ;
			var self = this, data = self.toolbarMap.image.interimBuffer.shift();
			if(!data) return ;

			do {
				data.status = 1;
				data.data = [].concat.apply(data.data, _data);
				self.toolbarMap.image.buffer.push(data);
				self.render(data);
				data = self.toolbarMap.image.interimBuffer.shift();
			} while(data);
		},
		destory: function() {

		}
	};

	var vm = window.vm || {};
	vm.module = vm.module || {};
	vm.module.image = Image;
	window.vm = vm;
}());