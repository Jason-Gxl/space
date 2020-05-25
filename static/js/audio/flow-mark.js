"use strict"

var audio = (function(global, undefined) {
	var AudioContext = global.AudioContext || global.webkitAudioContext;

	function FlowMark(params) {
		if(!(this instanceof FlowMark)) {
			return new FlowMark(params);
		}

		var actx = new AudioContext();
	}

	FlowMark.prototype = {
		connstructor: FlowMark,
		stop: function() {

		},
		restart: function() {

		}
	};

	global.audio = global.audio || {};

	global.audio.flowMark = {
		init: function(params) {
			if(!params.canvas || "canvas"!=params.canvas.tagName) return ;
			return new FlowMark(params);
		}
	};
}(window));