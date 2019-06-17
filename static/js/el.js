;var el = (function(global, undefined) {
	"use strict";
	var toString = Object.prototype.toString,
		doc = global.document;

	function EL(selector, parent) {
		if(void(0)===selector) return ;

		if(!(this instanceof EL)) {
			return new EL(selector, parent||doc);
		}

		if(isDOM(selector)) {
			this.ele = [selector];
		} else {
			this.ele = getDom(selector.toString().replace(/^\s*|\s*$/, ""), parent);
		}
	}

	var getDom = function(selector, parent) {
		switch(true) {
		case /^#/.test(selector):
			return [doc.getElementById(selector.replace(/^#/, ""))];
		case /^\./.test(selector):
			return [].slice.call(parent.getElementsByClassName(selector.replace(/^\./, "")), 0);
		case /^:/.test(selector):
			return [].slice.call(parent.getElementsByName(selector.replace(/^:/, "")), 0);
		default:
			return [].slice.call(parent.getElementsByTagName(selector, 0));
		}
	}

	var isDOM = (typeof HTMLElement === 'object') ? function(obj){
        return obj instanceof HTMLElement;
    } : function(obj){
        return obj && typeof obj === 'object' && (obj.nodeType === 1 || 9 === obj.nodeType)&& typeof obj.nodeName === 'string';
	}
	
	EL.isDOM = isDOM;

	//判断a元素中是否包含b元素
    var contains = function(a, b) {
		var flag = 9===a.nodeType;

		if(a.contains) {
			flag = a.contains(b);
		} else if(a.compareDocumentPosition) {
			flag = !!(a.compareDocumentPosition(b) & 16); //firefox
		} else {
			var p = b;

			while(p = p.parentNode) {
				flag = p===a;
				if(flag) break;
			}
		}

		return flag;
	}

	EL.prototype = {
		constructor: EL,
		addEvent: global.addEventListener?function(type, fn, use) {
			if(!type ||!fn) return ;
			var targets = this.ele;

			targets.forEach(function(target) {
				target.addEventListener(type, fn, use||false);
			});

			return this;
		} : function(type, fn) {
			if(!type ||!fn) return ;
			var targets = this.ele;

			targets.forEach(function(target) {
				target.attachEvent("on"+type, fn);
			});

			return this;
		},
		delEvent: global.removeEventListener?function(type, fn, use) {
			if(!type ||!fn) return ;
			var targets = this.ele;

			targets.forEach(function(target) {
				target.removeEventListener(type, fn, use||false);
			});

			return this;
		} : function(type, fn) {
			if(!type ||!fn) return ;
			var targets = this.ele;

			targets.forEach(function(target) {
				target.dettachEvent("on"+type, fn);
			});

			return this;
		},
		once: global.addEventListener?function(type, fn, use) {
			if(!type ||!fn) return ;
			var targets = this.ele;

			targets.forEach(function(target) {
				target.addEventListener(type, fn, {capture: use||false, once: true});
			});

			return this;
		} : undefined,
		addClass: function(className) {
			if(void(0)===className) return ;
			var doms = this.ele;

			doms.forEach(function(dom) {
				if(!((new RegExp("\\b"+className+"\\b").test(dom.className))))
					dom.className = dom.className.replace(/^\s*|\s*$/, "") + " " + className;
			});

			return this;
		},
		removeClass: function(className) {
			if(void(0)===className) return ;
			var doms = this.ele;

			doms.forEach(function(dom) {
				dom.className = dom.className.replace(new RegExp("\\b"+className+"\\b\\s?"), "").replace(/^\s*|\s*$/, "");
			});

			return this;
		},
		removeChild: function(child) {
			if(!isDOM(child)) return ;
			var doms = this.ele;

			doms.forEach(function(dom) {
				if(contains(dom, child)) dom.removeChild(child);
			});

			return this;
		},
		html: function(html) {
			var doms = this.ele;

			if(void(0)===html) {
				if(1<doms.length) {
					return "";
				} else {
					return doms[0].innerHTML;
				}
			} else {
				if(doms.length>0) doms[0].innerHTML = html;
			}
		},
		append: function(child) {
			if(!isDOM(child)) return ;
			var doms = this.ele;

			doms.forEach(function(dom) {
				dom.appendChild(child);
			});

			return this;
		},
		find: function(selector) {
			var arr = [], parents = this.ele;

			parents.forEach(function(p) {
				arr = arr.concat(getDom(selector, p));
			});

			this.ele = arr;
			return this;
		},
		each: function(fn) {
			var self = this;

			this.ele.forEach(function(node, index) {
				var _ele = EL(node);
				fn.call(_ele, _ele, index, self);
			});
		},
		src: function(uri) {
			if(void(0)===uri) return ;

			this.ele.forEach(function(node, index) {
				node.setAttribute("src", uri);
			});
		},
		css: function(name, val) {
			if(void(0)===val) {
				this.ele.forEach(function() {
					node.style.removeProperty(name);
				});
			} else {
				this.ele.forEach(function() {
					node.style.setProperty(name, val);
				});
			}

			return this;
		}
	};

	global.$ = EL;
	return EL;
}(window));