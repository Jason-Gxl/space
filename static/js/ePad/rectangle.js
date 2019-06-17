/**
 *
 *
 * date: 2018-03-24
 * author: Jason
 * fileName: rectangle.js
 * describe: 矩形
 *
 *
 */
;(function() {
	"use strict";
	var modeMap = {
		rectstroke: 0,	//空心矩形
		rect: 1	//实心矩形
	};

	function Rectangle(params) {
		this.name = params.name || "Rectangle";
		this.interimBuffer = [];
		this.points = [];
		this.buffer = [];
	}

	Rectangle.prototype = {
		constructor: Rectangle,
		active: function() {},
		// 绘制缓存接口，这里是将数据绘制到缓存画板上
		// status = 0
		bufferRender: function(data, origin) {
			var self = this;

			if(origin) {
				self.current.points = [];
				self.current.points.push(data.x);
				self.current.points.push(data.y);
			} else {
				self.current.points[2] = data.x-(self.current.points[0]||0);
				self.current.points[3] = data.y-(self.current.points[1]||0);
				self.current.interimBuffer.pop();
				data = [].concat.apply([], self.current.points);
				data = {type: "rectangle", data: data, status: 0, mode: modeMap[self.current.name], origin: true, color: self.params.color, from: self.params.id, width: self.mainCanvas.offsetWidth, height: self.mainCanvas.offsetHeight};
				self.current.interimBuffer.push(data);
				self.render(data);
			}
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
	vm.module.rectangle = Rectangle;
	window.vm = vm;
}());