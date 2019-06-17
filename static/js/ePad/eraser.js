/**
 *
 *
 * date: 2018-03-24
 * author: Jason
 * fileName: eraser.js
 * describe: 橡皮擦
 *
 *
 */
;(function() {
	"use strict";
	var modeMap = {
		circular: 0,
		quadrate: 1
	};

	var pos = null,
		lastPoint = null;

	function Eraser(params) {
		this.name = params.name || "Eraser";
		// 存储临时数据
		this.interimBuffer = [];
		// 存储持久数据
		this.buffer = [];
	}

	Eraser.prototype = {
		constructor: Eraser,
		active: function() {},
		// 鼠标绘制接口
		mouseRender: function(data) {
			var self = this;
			data = {type: "eraser", data: [data.x, data.y, self.params.eraserSize], mode: modeMap[self.current.name], from: self.params.id, width: self.mainCanvas.offsetWidth, height: self.mainCanvas.offsetHeight};
			pos = data;
			self.mouseRender.call(self, data);
		},
		// 橡皮擦放大接口
		largen: function() {
			var self = this,
				eraserSize = self.params.eraserSize,
				cw = self.mainCanvas.clientWidth,
				ch = self.mainCanvas.clientHeight;

			eraserSize++;
			self.params.eraserSize = Math.min.apply(Math, [eraserSize, cw, ch]);
			pos.data[2] = self.params.eraserSize;
			self.mouseRender.call(self, pos);
		},
		// 橡皮擦缩小接口
		lesser: function() {
			var self = this, eraserSize = self.params.eraserSize;
			eraserSize--;
			self.params.eraserSize = Math.max.apply(Math, [5, eraserSize]);
			pos.data[2] = self.params.eraserSize;
			self.mouseRender.call(self, pos);
		},
		// 绘制最终结果，这里是将数据绘制到持久画板上
		// 橡皮擦功能较为特殊，直接绘制到持久画板上
		// status = 1
		bufferRender: function(_data, origin) {
			if(!_data) return ;
			var self = this,
				data = {type: "eraser", data: [], status: 1, origin: true, mode: modeMap[self.current.name], from: self.params.id, width: self.mainCanvas.offsetWidth, height: self.mainCanvas.offsetHeight};
			
			if(!origin && lastPoint) {
				_data.ex = lastPoint.x;
				_data.ey = lastPoint.y;
			} else {
				_data.ex = _data.x;
				_data.ey = _data.y;
			}

			_data.size = self.params.eraserSize;
			data.data.push(_data);
			self.render(data);
			lastPoint = _data;
		},
		// 舍弃
		render: function() {
			return ;
		},
		destory: function() {
			var self = this;
			self.current.mouseRender.call(self, {x: -1, y: -1});
		}
	};

	var vm = window.vm || {};
	vm.module = vm.module || {};
	vm.module.eraser = Eraser;
	window.vm = vm;
}());