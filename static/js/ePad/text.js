/**
 *
 *
 * date: 2018-03-24
 * author: Jason
 * fileName: text.js
 * describe: 文本
 *
 *
 */
;(function() {
	"use strict";

	function Text(params) {
		this.name = params.name || "Text";
		this.interimBuffer = [];
		this.points = [];
		this.buffer = [];
	}

	Text.prototype = {
		constructor: Text,
		active: function() {},
		// 绘制缓存接口，这里是将数据绘制到缓存画板上
		// status = 0
		bufferRender: function(data, origin) {
			var self = this;

			if(origin) {
				self.current.points = [];
				self.current.points.push(data.x);
				self.current.points.push(data.y);
				self.textInput.style.cssText = "visibility: visible; z-index: 101; font-size: " + self.params.fontSize + "; left: " + (data.x + self.mainCanvas.offsetLeft) + "px; top: " + (data.y + self.mainCanvas.offsetTop -self.textInput.offsetHeight/2 - 18) + "px";
				self.textInput.focus();
				data = {type: "text", data: [data.x, data.y], status: 0, origin: !!origin, color: self.params.color, size: self.params.fontSize, from: self.params.id, width: self.mainCanvas.offsetWidth, height: self.mainCanvas.offsetHeight};
				self.current.interimBuffer.push(data);
			}
		},
		// 绘制最终结果，这里是将数据绘制到持久画板上
		// status = 1
		render: function(content) {
			if("[object String]"!=Object.prototype.toString.call(content)) return ;
			content = content.replace(/^\s*|\s*$/, "");
			if(!content) return ;
			var self = this, data = self.current.interimBuffer.pop();
			if(!data) return ;
			data.data.push(content);
			self.textInput.value = "";
			self.textInput.removeAttribute("style");
			data.status = 1;
			self.current.buffer.push(data);
			self.render(data);
			self.current.interimBuffer.length = 0;
		},
		destory: function() {
			var self = this, content = self.textInput.value.replace(/^\s*|\s*$/, "");
			if(content) self.current.render.call(self, content);
			self.textInput.value = "";
			self.textInput.removeAttribute("style");
		}
	};

	var vm = window.vm || {};
	vm.module = vm.module || {};
	vm.module.text = Text;
	window.vm = vm;
}());