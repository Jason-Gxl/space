;(function() {
	"use strict";
	var vm = window.vm || {},
		toString = Object.prototype.toString,
		URL = window.URL || window.webkitURL,
		CustomEvent = window.CustomEvent,
		padMap = {},
		padCount = 0,
		padTab = [],
		isMobile = /(\bmobile\b|\bandroid\b)/i.test(navigator.userAgent),
		isFireFox = /\bfirefox\b/i.test(navigator.userAgent),
		isIE = /\bMSIE\b/i.test(navigator.userAgent),
		isChrome = /\bchrome\b/i.test(navigator.userAgent),
		// 事件名map，PC端和移动端需要对应不同的事件名
		eventMap = {
			click: isMobile?"touchend":"click",
			down: isMobile?"touchstart":"mousedown",
			move: isMobile?"touchmove":"mouserun",
			up: isMobile?"touchend":"mouseup",
			wheel: isFireFox?"DOMMouseScroll":"mousewheel",
			fullScreen: isIE?"MSFullscreenChange":(isChrome?"webkitfullscreenchange":(isFireFox?"mozfullscreenchange":"fullscreenchange")),
		},
		// 工具栏不同的布局对应的className
		layoutClassMap = {
			leftTop: "left-top",
			rightTop: "right-top",
			rightBottom: "right-bottom",
			leftBottom: "left-bottom"
		},
		// 默认的白板初始化参数
		// ferula, ellipesstroke, rectstroke, pen, eraser, rect, ellipes, text, line, arrow, color, export, scissors, clear, enlarge, file, handPad
		defaultConfig = {
			data: null,
			noCache: false,
			noTab: false,
			super: false,
			noToolbar: false,
			layout: "leftTop",
			size: "100%",
			fontSize: 16,
			vertical: false,
			disable: false,
			wrap: document.body,
			autoSaveTime: 10,
			saveImgStep: 5,
			color: "#000",
			background: "#fff",
			eraserSize: 5,
			ferulaSize: 5,
			tabLimit: 20,
			toolbars: isMobile?["pen", "line", "rectangle", "round", "text", "image", "eraser", "export", "clear"]:["ferula", "pen", "line", "rectangle", "round", "text", "image", "eraser", "export", "clear", "color"]
		},
		childToolbars = {
			rectangle: ["rectstroke", "rect"],
			line: ["line", "arrow"],
			round: ["circle", "roundel", "ellipesstroke", "ellipes"],
			eraser: ["circular", "quadrate"]
		},
		// 不同工具对应的名称
		titles = {
			ferula: "教鞭",
			circle: "空心圆",
			roundel: "实心圆",
			ellipesstroke: "空心椭圆", 
			rectstroke: "空心矩形", 
			pen: "画笔",
			circular: "圆形橡皮擦",
			quadrate: "方形橡皮擦",
			rect:'实心矩形',
			ellipes: '实心椭圆',
			text: "文本",
			line: "直线", 
			arrow: "箭头", 
			color: "颜色", 
			export: "导出", 
			scissors:"截图",
			clear: "清空",
			image: "图片"
		},
		// 不同工具对应的icon的className
		classes = {
			ferula: "icon-teach-rod",
			circle: "icon-round-a",
			roundel: "icon-round-c",
			ellipesstroke: "icon-ellipse-b",
			rectstroke: "icon-rectangle-a",
			pen: "icon-pen",
			circular: "icon-xiangpica",
			quadrate: "icon-rubber",
			rect: "icon-rectangle-c",
			ellipes: "icon-ellipse-a",
			text: "icon-font",
			line: "icon-line",
			arrow: "icon-arrow",
			color: "icon-colour",
			export: "icon-keep",
			scissors: "icon-screenshot",
			clear: "icon-empty",
			image: "icon-pic"
		},
		// 白板tab的默认名称
		tabNameMap = {
			0: "白板",
			1: "文档演示"
		};

// ==============================================================模板===============================================================
	var tpl1 = '\
		<div class="pad-wrap @LAYOUT@ @DISABLED@ @NOTOOLBAR@ @NOTAB@">\
			<div class="toolbar-wrap">\
				<ul class="toolbar-list">@TOOLBARS@</ul>\
			</div>\
			<div class="can-wrap-outer">\
				<div class="can-wrap">\
					<input type="text" class="text-input tool-input"/>\
					<canvas class="main-can">抱歉！您的浏览器版本太低，暂时不支持此白板！</canvas>\
					<canvas class="buffer-can-4"></canvas>\
					<canvas class="buffer-can-3"></canvas>\
					<canvas class="buffer-can-2"></canvas>\
					<canvas class="buffer-can-1"></canvas>\
				</div>\
				<div class="split-page-wrap"></div>\
			</div>\
			<div class="pad-tab-wrap">\
				<ul class="pad-tab-list"></ul>\
			</div>\
			<input type="file" accept="image/png, image/jpeg" class="file-input tool-input"/>\
			<input type="color" class="color-input tool-input"/>\
		</div>';

	var tpl2 = '<li class="toolbar-item" title="@TITLE@"><span class="item-icon iconfont @ICONCLASS@" item="@ITEM@" level="@LEVEL@"></span>@CHILDTOOLBARS@</li>';

	var tpl3 = '<ul class="child-toolbar-list">@CHILDTOOLBARITEM@</ul>';

	var tpl4 = '\
		<div class="split-page">\
			<a href="javascript:void(0);" class="pre-page-btn iconfont icon-zuofanye"></a>\
			<a href="javascript:void(0);" class="next-page-btn iconfont icon-youfanye"></a>\
			<span><input type="text" class="page-number-input"/>/@TOTAL@<a href="javascript:void(0);" class="go-page-btn">GO</a></span>\
		</div>';

	var tpl5 = '<li class="toolbar-item full-screen-btn-wrap"><span class="item-icon full-screen-btn iconfont icon-enlarge" item="fullScreen"></span></li>';
// ==============================================================模板===============================================================

	vm.module = vm.module || {};

	// 这里创建一个ele对象，此对象下都是对dom节点进行操作的接口
	// 目地是方便后面的调用
	var ele = {
		// 对dom节点绑定事件
		addEvent: window.addEventListener?function(target, type, fn, use) {
			target.addEventListener(type, fn, use||false);
		}:function(target, type, fn) {
			target.attachEvent("on"+type, fn);
		},
		// 移除dom节点上的事件
		delEvent: window.addEventListener?function(target, type, fn, use) {
			target.removeEventListener(type, fn, use||false);
		}:function(target, type, fn) {
			target.detachEvent("on"+type, fn);
		},
		redefineEvent: function(original, current, _target, use) {
			var self = this,
				target = _target || window,
				running = false;

			var fn = function() {
				if(running) return ;
				var args = [].slice.call(arguments, 0), e = args[0] || window.event;
				running = true;

				window.requestAnimationFrame(function() {
					target.dispatchEvent(new CustomEvent(current, {detail: e}));
					running = false;
				});
			};

			self.addEvent(target, original, fn, use);
			return fn;
		},
		// 为dom节点添加一个指定的类名
		addClass: function(ele, className) {
			if(ele===void(0) || className===void(0)) return ;
			var reg = new RegExp("\\b"+className+"\\b", "g");

			if(!reg.test(ele.className)) {
				ele.className = ele.className + " " + className;
			}
		},
		// 移除dom节点上指定的类名
		removeClass: function(ele, className) {
			if(ele===void(0) || className===void(0)) return ;
			var reg = new RegExp("\\b"+className+"\\b", "g");

			if(reg.test(ele.className)) {
				ele.className = ele.className.replace(reg, "");
			}
		},
		// 获取指定dom节点的前一个节点
		preNode: function(ele) {
			return ele.previousElementSibling || ele.previousSibling;
		},
		// 获取指定dom节点的下一个节点
		nextNode: function(ele) {
			return ele.nextElementSibling || ele.nextSibling;
		},
		// 为dom节点添加样式
		css: function(ele, attrName, attrValue) {
			ele.style[attrName] = attrValue || "";
		}
	};

	// 滚动条模块
	// 如果创建白板时，为白板指定了固定大小，且白板大小大于当前放置白板的容器时会创建滚动条
	var scroll = (function() {
		var scrolls = [],
			tplDiv = document.createElement("DIV"),
			xTpl = '<div class="scroll-x-wrap pad-hide"><span class="scroll-x scroll-toolbar"></span></div>',
			yTpl = '<div class="scroll-y-wrap pad-hide"><span class="scroll-y scroll-toolbar"></span></div>';

		function Scroll(params) {
			if(!(this instanceof Scroll)) {
				return new Scroll(params);
			}

			var self = this,
				disable = false,
				activeType = "x",
				startPoint = {x: 0, y: 0},
				moveCallback = null,
				parentNode = params.node.parentNode;

			self.params = params;
			self.events = {};
			self.scrollObj = {};

			var scrollBuilder = function(type) {
				tplDiv.innerHTML = "x"===type?xTpl:yTpl;
				var ele = tplDiv.removeChild(tplDiv.firstChild);
				parentNode.appendChild(ele);

				self.scrollObj[type] = {
					container: ele,
					toolbar: ele.getElementsByClassName("scroll-toolbar")[0]
				};

				if("x"===type) {
					params.node.clientWidth<params.node.scrollWidth && ele.classList.remove("pad-hide");
					self.scrollObj[type].left = 0;
				} else {
					params.node.clientHeight<params.node.scrollHeight && ele.classList.remove("pad-hide");
					self.scrollObj[type].top = 0;
				}
			};

			Object.defineProperty(this, "disable", {
				set: function(d) {
					disable = d;
				},
				get: function() {
					return disable;
				}
			});

			if(!params.type) {
				scrollBuilder("x");
				scrollBuilder("y");
			} else {
				scrollBuilder(params.type);
			}

			var mousemoveHandler = function() {
				var args = [].slice.call(arguments, 0),
					obj = self.scrollObj[activeType],
					e = args[0] || window.event,
					e = isMobile?e:(e.detail?e.detail:e);

				if("x"===activeType) {
					var x = e.x || e.clientX, 
						data = {
							type: "x", 
							from: params.id,
							coverWidth: obj.coverWidth,
							distance: obj.left+(x-startPoint.x)
						};

					startPoint.x = x;
				} else {
					var y = e.y || e.clientY, 
						data = {
							type: "y", 
							from: params.id,
							coverHeight: obj.coverHeight,
							distance: obj.top+(y-startPoint.y)
						};

					startPoint.y = y;
				}

				self.scroll(data);
			};

			var mouseupHandler = function() {
				ele.delEvent(document, "mousemove", moveCallback);
				ele.delEvent(document, "mouseup", mouseupHandler);
			};

			if(self.scrollObj.x) {
				ele.addEvent(self.scrollObj.x.toolbar, "mousedown", function() {
					if(disable) return ;
					var args = [].slice.call(arguments, 0), e = args[0] || window.event;
					moveCallback = ele.redefineEvent("mousemove", "mouserun", document);
					startPoint.x = e.x || e.clientX;
					activeType = "x";
					ele.addEvent(document, "mouserun", mousemoveHandler);
					ele.addEvent(document, "mouseup", mouseupHandler);
				});
			}

			if(self.scrollObj.y) {
				ele.addEvent(self.scrollObj.y.toolbar, "mousedown", function() {
					if(disable) return ;
					var args = [].slice.call(arguments, 0), e = args[0] || window.event;
					moveCallback = ele.redefineEvent("mousemove", "mouserun", document);
					startPoint.y = e.y || e.clientY;
					activeType = "y";
					ele.addEvent(document, "mouserun", mousemoveHandler);
					ele.addEvent(document, "mouseup", mouseupHandler);
				});
			}
		}

		Scroll.prototype = {
			constructor: Scroll,
			scroll: function(param) {
				var params = this.params,
					obj = this.scrollObj[param.type],
					container = obj.container,
					toolbar = obj.toolbar;

				if("x"===param.type) {
					param.distance = param.distance * (obj.coverWidth/param.coverWidth);
					var offsetLeft = Math.max(0, Math.min(obj.coverWidth, param.distance));
					params.node.scrollLeft = offsetLeft;
					toolbar.style.left = obj.moveWidth*(offsetLeft/obj.coverWidth) + "px";
					this.scrollObj.x.left = offsetLeft;
				} else {
					param.distance = param.distance * (obj.coverHeight/param.coverHeight);
					var offsetTop = Math.max(0, Math.min(obj.coverHeight, param.distance));
					params.node.scrollTop = offsetTop;
					toolbar.style.top = obj.moveHeight*(offsetTop/obj.coverHeight) + "px";
					this.scrollObj.y.top = offsetTop;
				}

				if(void(0)==this.params.id || param.from==this.params.id) this.fire("scroll", param);
			},
			toOrigin: function(type) {
				var params = this.params;

				if(!type) {
					this.scrollObj.x.toolbar.style.left = 0;
					this.scrollObj.y.toolbar.style.top = 0;
					this.scrollObj.x.left = 0;
					this.scrollObj.y.top = 0;
					params.node.scrollLeft = 0;
					params.node.scrollTop = 0;
				} else {
					if("x"===type) {
						this.scrollObj.x.toolbar.style.left = 0;
						params.node.scrollLeft = 0;
						this.scrollObj.x.left = 0;
					} else {
						this.scrollObj.y.toolbar.style.top = 0;
						params.node.scrollTop = 0;
						this.scrollObj.y.top = 0;
					}
				}
			},
			resize: function() {
				var params = this.params;

				if(this.scrollObj.x) {
					var obj = this.scrollObj.x,
						toolbar = obj.toolbar,
						coverWidth = params.node.scrollWidth - params.node.clientWidth;
					
					toolbar.style.width = Math.max(obj.container.clientWidth - coverWidth/10, 50) + "px";
					obj.coverWidth = coverWidth;
					obj.moveWidth = obj.container.clientWidth - toolbar.offsetWidth;

					if(0===obj.moveWidth) {
						obj.container.classList.add("pad-hide");
					} else {
						obj.container.classList.remove("pad-hide");
					}
				}

				if(this.scrollObj.y) {
					var obj = this.scrollObj.y,
						toolbar = obj.toolbar,
						coverHeight = params.node.scrollHeight - params.node.clientHeight;

					toolbar.style.height = Math.max(obj.container.clientHeight - coverHeight/10, 50) + "px";
					obj.coverHeight = coverHeight;
					obj.moveHeight = obj.container.clientHeight - toolbar.offsetHeight;

					if(0===obj.moveHeight) {
						obj.container.classList.add("pad-hide");
					} else {
						obj.container.classList.remove("pad-hide");
					}
				}
			},
			addEvent: function(eventName, fn) {
				var events = this.events;

				if(!events[eventName]) {
					events[eventName] = [fn];
				} else {
					events[eventName].push(fn);
				}
			},
			delEvent: function(eventName, fn) {
				var events = this.events;

				if("[object Function]"===toString.call(fn)) {
					events[eventName].splice(events[eventName].indexOf(fn), 1);
				} else {
					delete events[eventName];
				}
			},
			fire: function() {
				var args = [].slice.call(arguments, 0),
					eventName = args.shift(),
					events = this.events;

				events[eventName] && events[eventName].forEach(function(fn) {
					"[object Function]"===toString.call(fn) && fn.apply(Object.create(null), args);
				});
			}
		};

		return {
			init: function(params) {
				if(!params.node) return ;
				var scrollObj = new Scroll(params);
				scrolls.push(scrollObj);
				return scrollObj;
			},
			resize: function() {
				scrolls.forEach(function(scrollObj) {
					scrollObj.resize();
				});
			}
		};
	}());

	// 数据对象
	// 这里是对所有进行数据处理的接口进行了归总
	var data = {
		// 生成uuid
		get uuid() {
			return Date.now().toString();
		},
		// 对白板数进行缩放
		// 主要应对白板的缩放后的重绘及从一个白板传递到另一个白板的数据
		scale: function(_data) {
			var that = this,
				val = _data,
				type = val.type,
				scaleWidth = null,
				scaleHeight = null;

			if(!scaleWidth || !scaleHeight) {
				scaleWidth = that.mainCanvas.width/val.width;
				scaleHeight = that.mainCanvas.height/val.height;
			}

			switch(type) {
				case "pen":
				val.data.x = val.data.x * scaleWidth;
				val.data.y = val.data.y * scaleHeight;
				break;
				case "text":
				val.data[0] = val.data[0] * scaleWidth;
				val.data[1] = val.data[1] * scaleWidth;
				break;
				case "image":

				break;
				case "file":

				break;
				case "eraser":
				val.data.x = val.data.x * scaleWidth;
				val.data.y = val.data.y * scaleHeight;
				val.data.size = val.data.size * scaleWidth;
				break;
				default:
				if(val.data[0]) val.data[0] = !isNaN(val.data[0])?val.data[0] * scaleWidth:val.data[0];
				if(val.data[1]) val.data[1] = !isNaN(val.data[1])?val.data[1] * scaleWidth:val.data[1];
				if(val.data[2]) val.data[2] = !isNaN(val.data[2])?val.data[2] * scaleWidth:val.data[2];
				if(val.data[3]) val.data[3] = !isNaN(val.data[3])?val.data[3] * scaleWidth:val.data[3];
			}
		},
		// 数据深拷贝
		copy: function() {
			var args = [].slice.call(arguments, 0),
				firstArg = args.shift(),
				len = args.length;

			if(len) {
				var type = toString.call(firstArg);
				if("[object Object]"!=type && "[object Array]"!=type) return firstArg;

				args.forEach(function(arg) {
					var _type = toString.call(arg);
					if("[object Object]"!=_type && "[object Array]"!=_type) return ;

					if("[object Object]"===_type) {

						if("[object Array]"===type) {
							var container = {};
						}

						for(var key in arg) {
							if(!arg.hasOwnProperty(key)) continue;
							var val = arg[key], type = toString.call(val);

							if(container) {
								if("[object Object]"===type || "[object Array]"===type) {
									container[key] = data.copy(val);
								} else {
									container[key] = val;
								}
							} else {
								if("[object Object]"===type || "[object Array]"===type) {
									firstArg[key] = data.copy(val);
								} else {
									firstArg[key] = val;
								}
							}							
						}

						container && firstArg.push(container);
					} else {
						arg.forEach(function(item, index) {
							var _type = toString.call(item);

							if("[object Object]"===type) {
								if("[object Object]"===_type || "[object Array]"===_type) {
									firstArg[index] = data.copy(val);
								} else {
									firstArg[index] = val;
								}
							} else {
								if("[object Object]"===_type || "[object Array]"===_type) {
									firstArg.push(data.copy(val));
								} else {
									firstArg.push(val);
								}
							}
						});
					}
				});

				return firstArg;
			} else {
				var type = toString.call(firstArg);

				if("[object Object]"!=type && "[object Array]"!=type) {
					return firstArg;
				} else {
					if("[object Object]"===type) {
						var container = {};

						for(var key in firstArg) {
							if(!firstArg.hasOwnProperty(key)) continue;
							var val = firstArg[key], type = toString.call(val);

							if("[object Object]"===type || "[object Array]"===type) {
								container[key] = data.copy(val);
							} else {
								container[key] = val;
							}
						}
					} else {
						var container = [];

						firstArg.forEach(function(item) {
							var type = toString.call(item);

							if("[object Object]"===type || "[object Array]"===type) {
								container.push(data.copy(item));
							} else {
								container.push(item);
							}
						});
					}					
				}

				return container;
			}
		},
		// 将白板数据生成图片数据
		// 此接口应对的是用户在白板上多次操作产生很多数据，由于数据是存储在storage中，数据量不宜过多，所以会在操作过程中把适量的数据生成图片数据进行存储
		saveAsImage: function(_data, type) {
			var self = this,
				count = 0,
				arr = [],
				file = null,
				len = _data.length,
				activeTab = self.tab.getActive(),
				createImageCanvas = self.createImageCanvas;

			var _createImage = function() {
				var imgData=createImageCanvas.toDataURL(), page = self.tab.getPage(activeTab.id);
				createImageCanvas.width = createImageCanvas.width;

				var _data_ = {
					type: "image",
					data: [imgData, 0, 0],
					width: 0,
					height: 0,
					status: 1, 
					origin: true,
					from: "auto"
				};

				if(page) _data_.pageNumber = page.getPageNumber();
				file && _data.push(file);
				_data.push(_data_);
				[].push.apply(_data, arr);
				self.tab.saveData.call(self);
			};

			var next = function(list) {
				var d = list.shift();
				if(!d) return _createImage();

				if("file"===d.type) {
					file = d;
					next(list);
				} else {
					data.render.call(self, d, function() {
						next(list);
					}, true);
				}
			};

			while(len--) {
				var d = _data.pop();
				arr.unshift(d);
				d.origin && count++;

				if(self.params.saveImgStep<=count) {
					createImageCanvas.width = createImageCanvas.width;

					if(_data.length) {
						next(_data);
					} else {
						[].push.apply(_data, arr);
					}

					break;
				}
			}
		},
		// 清除文本头尾的空格
		trim: function(content) {
			if(!content || "[object String]"!=toString.call(content)) return ;
			return content.replace(/^\s*|\s*$/, "");
		},
		// 数据分页
		splitPage: function(_data) {
			var obj = {},
				keys = [],
				list = [];

			_data.forEach(function(d) {
				if("[object String]"===toString.call(d)) {
					list.push(d);
				} else {
					obj[d.pageNumber] = obj[d.pageNumber] || [];
					obj[d.pageNumber].push(d);
				}
			});

			for(var key in obj) {
				if(!obj.hasOwnProperty(key)) continue;
				keys.push(key);
			}

			// 对页码进行排序
			keys.sort(function(a, b) {
				return a-b;
			});

			keys.forEach(function(key) {
				list.push(obj[key]);
			});

			return list;
		},
		// 向白板绘制pen模块传递过来的数据
		// isCreateImage是boolean值,只有在saveAsImage中调用些接口时才为true
		renderPen: function(params, callback, isCreateImage) {
			var self = this,
				canvas = isCreateImage?self.createImageCanvas:(0===params.status?self.bufferCanvas:self.mainCanvas),
				data = params.data,
				wScale = canvas.width/params.width,
				hScale = canvas.height/params.height,
				ctx = canvas.getContext("2d");

			if(0===params.status) {
				canvas.width = canvas.width;
			} else {
				self.bufferCanvas.width = self.bufferCanvas.width;
			}
			
			ctx.strokeStyle = params.color;
			ctx.lineWidth = 1;
			ctx.save();
			ctx.scale(wScale, hScale);

			data.forEach(function(point, index) {
				if(0===index) {
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
				} else {
					ctx.lineTo(point.x, point.y);
				}
			});

			ctx.stroke();
			ctx.restore();
			callback && callback();
		},
		// 向白板绘制rect模块传递过来的数据
		// isCreateImage是boolean值,只有在saveAsImage中调用些接口时才为true
		renderRect: function(params, callback, isCreateImage) {
			var self = this,
				mode = params.mode,
				canvas = isCreateImage?self.createImageCanvas:(0===params.status?self.bufferCanvas:self.mainCanvas),
				data = params.data,
				wScale = canvas.width/params.width,
				hScale = canvas.height/params.height,
				ctx = canvas.getContext("2d");

			if(0===params.status) {
				canvas.width = canvas.width;
			} else {
				self.bufferCanvas.width = self.bufferCanvas.width;
			}

			ctx.save();
			ctx.scale(wScale, hScale);
			ctx.beginPath();

			if(0===params.mode) {
				ctx.strokeStyle = params.color;
				ctx.lineWidth = 1;
				ctx.strokeRect(data[0], data[1], data[2], data[3]);
			} else {
				ctx.fillStyle = params.color;
				ctx.fillRect(data[0], data[1], data[2], data[3]);
			}

			ctx.restore();
			callback && callback();
		},
		// 向白板绘制line模块传递过来的数据
		// isCreateImage是boolean值,只有在saveAsImage中调用些接口时才为true
		renderLine: function(params, callback, isCreateImage) {
			var self = this,
				mode = params.mode,
				canvas = isCreateImage?self.createImageCanvas:(0===params.status?self.bufferCanvas:self.mainCanvas),
				data = params.data,
				wScale = canvas.width/params.width,
				hScale = canvas.height/params.height,
				ctx = canvas.getContext("2d");

			if(0===params.status) {
				canvas.width = canvas.width;
			} else {
				self.bufferCanvas.width = self.bufferCanvas.width;
			}

			ctx.strokeStyle = params.color;
			ctx.lineWidth = 1;
			ctx.save();
			ctx.scale(wScale, hScale);
			ctx.beginPath();
			ctx.moveTo(data[0], data[1]);
			ctx.lineTo(data[2], data[3]);

			if(1===mode) {
				var angle = Math.atan2(data[1]-data[3], data[0]-data[2])*180/Math.PI,
					angle1 = (angle+30)*Math.PI/180,
					angle2 = (angle-30)*Math.PI/180,
					topx = 15*Math.cos(angle1),
					topy = 15*Math.sin(angle1),
					botx = 15*Math.cos(angle2),
					boty = 15*Math.sin(angle2);

				ctx.moveTo(topx+data[2], topy+data[3]);
				ctx.lineTo(data[2], data[3]);
				ctx.moveTo(botx+data[2], boty+data[3]);
				ctx.lineTo(data[2], data[3]);
			}

			ctx.stroke();
			ctx.restore();
			callback && callback();
		},
		// 向白板绘制round模块传递过来的数据
		// isCreateImage是boolean值,只有在saveAsImage中调用些接口时才为true
		renderRound: function(params, callback, isCreateImage) {
			var self = this,
				mode = params.mode,
				canvas = isCreateImage?self.createImageCanvas:(0===params.status?self.bufferCanvas:self.mainCanvas),
				data = params.data,
				wScale = canvas.width/params.width,
				hScale = canvas.height/params.height,
				ctx = canvas.getContext("2d");

			if(0===params.status) {
				canvas.width = canvas.width;
			} else {
				self.bufferCanvas.width = self.bufferCanvas.width;
			}

			ctx.save();
			ctx.scale(wScale, hScale);
			ctx.beginPath();

			switch(mode) {
				case 0:
				ctx.strokeStyle = params.color;
				ctx.lineWidth = 1;
				ctx.arc(data[0], data[1], data[2], 0, 2*Math.PI);
				ctx.stroke();
				break;
				case 1:
				ctx.fillStyle = params.color;
				ctx.arc(data[0], data[1], data[2], 0, 2*Math.PI);
				ctx.fill();
				break;
				case 2:
				ctx.strokeStyle = params.color;
				ctx.lineWidth = 1;
				var r = data[2]>data[3]?data[2]:data[3],
					scaleX = data[2]/r,
					scaleY = data[3]/r;
				ctx.scale(scaleX, scaleY);
				ctx.arc(data[0]/scaleX, data[1]/scaleY, r, 0, 2*Math.PI);
				ctx.closePath();
				ctx.stroke();
				break;
				case 3:
				ctx.fillStyle = params.color;
				var r = data[2]>data[3]?data[2]:data[3],
					scaleX = data[2]/r,
					scaleY = data[3]/r;
				ctx.scale(scaleX, scaleY);
				ctx.arc(data[0]/scaleX, data[1]/scaleY, r, 0, 2*Math.PI);
				ctx.closePath();
				ctx.fill();
				break;
			}

			ctx.restore();
			callback && callback();
		},
		// 向白板绘制text模块传递过来的数据
		// isCreateImage是boolean值,只有在saveAsImage中调用些接口时才为true
		renderText: function(params, callback, isCreateImage) {
			var self = this,
				canvas = isCreateImage?self.createImageCanvas:(0===params.status?self.bufferCanvas:self.mainCanvas),
				data = params.data,
				wScale = canvas.width/params.width,
				hScale = canvas.height/params.height,
				ctx = canvas.getContext("2d");

			if(0===params.status) {
				canvas.width = canvas.width;
			} else {
				self.bufferCanvas.width = self.bufferCanvas.width;
			}
			
			ctx.fillStyle = params.color;
			ctx.font = params.size + "px sans-serif";
			ctx.save();
			ctx.scale(wScale, hScale);
			ctx.beginPath();
			ctx.fillText(data[2], data[0], data[1]);
			ctx.restore();
			callback && callback();
		},
		// 向白板绘制image模块传递过来的数据
		// isCreateImage是boolean值,只有在saveAsImage中调用些接口时才为true
		renderImage: function(params, callback, isCreateImage) {
			var self = this,
				canvas = isCreateImage?self.createImageCanvas:(0===params.status?self.bufferCanvas:("file"===params.type?self.fileCanvas:self.mainCanvas)),
				data = params.data,
				cWidth = params.width,
				cHeight = params.height,
				img = self.tplImage,
				ctx = canvas.getContext("2d");

			img.src = data[0];

			img.onload = function() {
				var imgWidth = img.width, imgHeight = img.height;

				if("file"===params.type && 0!=params.status && !isCreateImage) {
					cWidth = self.params.width;
					cHeight = self.params.height;
					self.tab.resizePad(cWidth, cHeight);
					self.tab.resizePadPixel(cWidth, cHeight);
				}

				ctx.save();

				if("file"===params.type) {
					var imgScale = imgWidth/imgHeight,
						pWidth = imgWidth,
						pHeight = imgHeight;
						
					if(cHeight>cWidth/imgScale) {
						pHeight = (imgHeight + imgHeight*(cHeight/cWidth - imgHeight/imgWidth))>>0;
					} else {
						cHeight = (cWidth/(imgWidth/imgHeight))>>0;
					}

					self.tab.resizePad(cWidth, cHeight);
					self.tab.resizePadPixel(pWidth, pHeight);
					ctx.drawImage(img, (pWidth-imgWidth)/2, (pHeight-imgHeight)/2, imgWidth, imgHeight);
				} else {
					var pw = canvas.width,
						ph = canvas.height,
						wScale = pw/cWidth,
						hScale = ph/cHeight,
						sImgWidth = imgWidth*wScale,
						sImgHeight = imgHeight*hScale,
						dw = pw - sImgWidth, 
						dh = ph - sImgHeight;

					if(dw>=0 && dh>=0) {
						var x = dw/2, y = dh/2;
						ctx.drawImage(img, x, y, sImgWidth, sImgHeight);
					} else {
						var cwhp = pw/ph, iwhp = img.width/img.height;

						if(cwhp>iwhp) {
							ctx.drawImage(img, (pw-ph*iwhp)/2, 0, ph*iwhp, ph);
						} else {
							ctx.drawImage(img, 0, (ph-pw/iwhp)/2, pw, pw/iwhp);
						}
					}
				}

				ctx.restore();
				callback && callback();
			};
		},
		// 向白板绘制eraser模块传递过来的数据
		// isCreateImage是boolean值,只有在saveAsImage中调用些接口时才为true
		delete: function(params, callback, isCreateImage) {
			var self = this,
				canvas = isCreateImage?self.createImageCanvas:(0===params.status?self.bufferCanvas:self.mainCanvas),
				data = params.data,
				wScale = canvas.width/params.width,
				hScale = canvas.height/params.height,
				ctx = canvas.getContext("2d");

			if(0===params.status) {
				canvas.width = canvas.width;
			} else {
				self.bufferCanvas.width = self.bufferCanvas.width;
			}

			data.forEach(function(data) {
				if(0===params.mode) {
					var sin = data.size/2*Math.sin(Math.atan((data.y - data.ey)/(data.x - data.ex))) || 0,
				    	cos = data.size/2*Math.cos(Math.atan((data.y - data.ey)/(data.x - data.ex))) || 0;

				    var x1 = data.ex + sin;
				    var y1 = data.ey - cos;
				    var x2 = data.ex - sin;
				    var y2 = data.ey + cos;
				    var x3 = data.x + sin;
				    var y3 = data.y - cos;
				    var x4 = data.x - sin;
				    var y4 = data.y + cos;

				    ctx.save();
				    ctx.scale(wScale, hScale);
		        	ctx.beginPath();
		        	ctx.arc(data.x, data.y, data.size/2, 0, 2*Math.PI);
		        	ctx.clip();
		        	ctx.clearRect(0, 0, canvas.width, canvas.height);
		        	ctx.restore();
				} else {
					var x1 = data.ex - data.size/2;
				    var y1 = data.ey - data.size/2;
				    var x2 = data.ex - data.size/2;
				    var y2 = data.ey + data.size/2;
				    var x3 = data.x + data.size/2;
				    var y3 = data.y - data.size/2;
				    var x4 = data.x - data.size/2;
				    var y4 = data.y + data.size/2;

				    ctx.save();
				    ctx.scale(wScale, hScale);
		        	ctx.beginPath();
		        	ctx.rect(x1, y1, data.size, data.size);
		        	ctx.clip();
		        	ctx.clearRect(0, 0, canvas.width, canvas.height);
		        	ctx.restore();
				}
				
				ctx.save();
				ctx.scale(wScale, hScale);
				ctx.beginPath();
				ctx.moveTo(x1, y1);
	        	ctx.lineTo(x2, y2);
	        	ctx.lineTo(x3, y3);
	        	ctx.lineTo(x4, y4);
	        	ctx.closePath();
	        	ctx.clip()
	        	ctx.clearRect(0, 0, self.params.width, self.params.height);
	        	ctx.restore();
			});
			
			callback && callback();
		},
		// 总的绘制接口
		// isCreateImage是boolean值,只有在saveAsImage中调用些接口时才为true
		render: function(_data, callback, isCreateImage) {
			var self = this, type = _data.type;

			// 根据type调用相对应功能的render接口
			switch(type) {
				case "pen":
				data.renderPen.call(self, _data, callback, isCreateImage);
				break;
				case "rectangle":
				data.renderRect.call(self, _data, callback, isCreateImage);
				break;
				case "line":
				data.renderLine.call(self, _data, callback, isCreateImage);
				break;
				case "round":
				data.renderRound.call(self, _data, callback, isCreateImage);
				break;
				case "text":
				data.renderText.call(self, _data, callback, isCreateImage);
				break;
				case "image":
				data.renderImage.call(self, _data, callback, isCreateImage);
				break;
				case "file":
				data.renderImage.call(self, _data, callback, isCreateImage);
				break;
				case "eraser":
				data.delete.call(self, _data, callback, isCreateImage);
			}
		}
	};

	// 鼠标的绘制对象
	var mouse = {
		// 橡皮擦
		eraser: function(params) {
			var self = this,
				canvas = self.mouseIconCanvas,
				data = params.data,
				mode = params.mode,
				wScale = canvas.width/params.width,
				hScale = canvas.height/params.height,
				ctx = canvas.getContext("2d");

			canvas.width = canvas.width;
			if(-1===data[0] || -1===data[1]) return ;
			ctx.scale(wScale, hScale);
			ctx.beginPath();

			if(0===mode) {
				ctx.arc(data[0], data[1], data[2]/2, 0, 2*Math.PI);
				ctx.stroke();
			} else {
				var px = data[0]-data[2]/2,
					py = data[1]-data[2]/2;
				ctx.rect(px, py, data[2], data[2]);
				ctx.stroke();
			}
		},
		// 教鞭
		ferula: function(params) {
			var self = this,
				canvas = self.mouseIconCanvas,
				data = params.data,
				ferulaSize = self.params.ferulaSize,
				wScale = canvas.width/params.width,
				hScale = canvas.height/params.height,
				ctx = canvas.getContext("2d");

			canvas.width = canvas.width;
			if(-1===data[0] || -1===data[1]) return ;
			ctx.scale(wScale, hScale);
			ctx.beginPath();
			ctx.fillStyle = "red";
			ctx.arc(data[0], data[1], ferulaSize, 0, 2*Math.PI);
			ctx.fill();
		},
		// 总的render接口
		// 根据type调用mouse[type]
		render: function(_data) {
			var self = this, type = _data.type;
			mouse[type] && mouse[type].call(self, _data);
		}
	};

	// 白板的tab模块
	var Tab = (function() {
		var UL = document.createElement("UL"),
			tabTpl = '<li class="pad-tab-item" title="@LABEL@">@LABEL@@DELETEBTN@</li>',
			delTpl = '<i class="iconfont icon-close"></i>';

		function _tab(wrap) {
			var self = this,
				tabMap = {},	// 创建的所有tab生成的map,key是tab的唯一标识
				dataMap = {},	// 所有tab对应的数据生成的map,key是tab的唯一标识
				canvasMap = {},	// 所有tab对应的画面生成的map,key是tab的唯一标识
				activeObj = {},	// 目前被激活的画布,数据,tab生成的对象
				idList = [],
				saving = false,
				pageMap = {},
				tabWrap = wrap.getElementsByClassName("pad-tab-list")[0];

			self.build = function(canvas, _params) {
				if(!canvas) return ;

				if(idList.length>=this.params.tabLimit) {
					"[object Function]"===toString.call(this.params.onError) && this.params.onError({code: 0, message: "白板页签已达上限"});
					return ;
				}

				var that = this,
					type = _params.type,
					_data = _params.data,
					from = _params.from,
					del = 0===_params.type?false:(that.params.super?true:from == that.params.id),
					_id = _params.id?_params.id:(0===type?0:data.uuid),
					_tabTpl = tabTpl.replace(/@LABEL@/g, _params.name?_params.name:tabNameMap[type]).replace(/@DELETEBTN@/g, del?delTpl:"");

				UL.innerHTML = _tabTpl;
				idList.push(_id);
				var li = UL.firstElementChild || UL.firstChild;

				tabMap[_id] = li;
				dataMap[_id] = _data || [];
				canvasMap[_id] = canvas;

				if(del) {
					ele.addEvent(li.getElementsByTagName("i")[0], eventMap["click"], function() {
						var args = [].slice.call(arguments, 0),
						 	e = args[0] || window.event;
						
						if(window.event) {
							e.returnValue = false;
							e.cancelBubble = true;
						} else {
							e.preventDefault();
							e.stopPropagation();
						}

						self.remove.call(that, _id);
						that.params.onTabRemove && that.params.onTabRemove(_id);
					});
				}

				ele.addEvent(li, eventMap["click"], function() {
					if(true===that.params.disable || this===activeObj.tab) return ;
					self.active.call(that, _id);
					that.params.onTabChange && that.params.onTabChange(_id);
				});

				tabWrap.appendChild(li);

				that.container[_id] = {
					data: dataMap[_id],
					type: type,
					splitPage: 0,
					from: from
				};

				self.resizeTab();
				if(_params.name) that.container[_id].tabName = _params.name;
				return _id;
			};

			self.push = function(id, _data) {
				var self = this, count = 0;
				if(!dataMap[id]) dataMap[id] = [];
				dataMap[id].push(_data);
				self.tab.saveData.call(self);

				dataMap[id].forEach(function(d) {
					if("auto"!=d.from) count++;
				});

				if(count-self.params.saveImgStep>=self.params.saveImgStep) {
					data.saveAsImage.call(self, dataMap[id], self.container[id].type);
				}
			};

			self.saveData = function() {
				var self = this;
				if(saving || "never"===self.params.autoSaveTime) return ;
				self.params.autoSaveTime = isNaN(self.params.autoSaveTime)?10:+self.params.autoSaveTime;

				var it = setTimeout(function() {
					for(var key in pageMap) {
						if(!pageMap.hasOwnProperty(key)) continue;
						var page = pageMap[key];
						dataMap[key].length = 0;
						[].push.apply(dataMap[key], page.getData());
					}

					!self.params.noCache && window.localStorage.setItem(self.id+"_pad", JSON.stringify(self.container));
					clearTimeout(it);
					saving = false;
				}, self.params.autoSaveTime*1000);

				saving = true;
			};

			self.resizeTab = function() {
				var totalWidth = tabWrap.clientWidth,
					tabCount = idList.length,
					width = totalWidth/tabCount;

				width = width>112?112:width;
				tabWrap.style.setProperty("--tab-width", width-12 + "px");
			};

			self.remove = function(_id) {
				var self = this,
					li = tabMap[_id],
					index = idList.indexOf(_id);

				delete tabMap[_id];
				delete dataMap[_id];
				delete canvasMap[_id];
				delete self.container[_id];
				delete pageMap[_id];

				tabWrap.removeChild(li);
				idList.splice(index, 1);

				if(activeObj.id==_id) {
					_id = idList[Math.max(index-1, 0)];
					self.tab.active.call(self, _id);
				}
				
				self.tab.resizeTab();
				!self.params.noCache && window.localStorage.setItem(self.id+"_pad", JSON.stringify(self.container));
			};

			self.active = function(_id, noResize, dontOrigin) {
				if(!tabMap[_id]) return false;
				var self = this, _data = dataMap[_id];
				ele.removeClass(activeObj.tab, "active");

				if(!noResize) {
					self.tab.resizePad();
					self.tab.resizePadPixel();
				}
				
				!dontOrigin && self.scroll.toOrigin();

				if(activeObj.page) {
					activeObj.page.hide();
					delete activeObj.page;
				}

				if(self.container[_id].type != activeObj.type) {
					ele.css(activeObj.canvas || self.mainCanvas, "background");
					ele.css(canvasMap[_id], "background", self.params.background);
				}

				activeObj.tab = tabMap[_id];
				activeObj.data = dataMap[_id];
				activeObj.canvas = canvasMap[_id];
				activeObj.id = _id;
				activeObj.type = self.container[_id].type;
				activeObj.name = self.container[_id].tabName || "";
				activeObj.page = pageMap[_id];

				ele.addClass(activeObj.tab, "active");
				activeObj.page && activeObj.page.show();

				if(_data && !activeObj.page) {
					activeObj.canvas.width = activeObj.canvas.width;
					var i = 0, len = _data.length;

					if(len) {
						var next = function() {
							var d = _data[i];

							d && data.render.call(self, d, function() {
								i++;
								i<len && next();
							});
						};

						next();
					}
				}

				return true;
			};

			self.getActive = function() {
				return activeObj;
			};

			self.getTab = function(id) {
				return tabMap[id];
			};

			self.clear = function(params) {
				var self = this;

				if(void(0)===params) {
					if(activeObj.page) {
						activeObj.page.clear.call(self);
					} else {
						activeObj.data.length = 0;
						activeObj.canvas.width = activeObj.canvas.width;
						"[object Function]"===toString.call(self.params.onClear) && self.params.onClear({tabId: activeObj.id});
					}
				} else {
					var id = params.tabId;

					if(pageMap[id]) {
						pageMap[id].clear.call(self, params);
					} else {
						if(dataMap[id]) dataMap[id].length = 0;
						if(canvasMap[id]) canvasMap[id].width = canvasMap[id].width;
					}
				}

				!self.params.noCache && window.localStorage.setItem(self.id+"_pad", JSON.stringify(self.container));
			};

			self.cleanCache = function() {
				var self = this;
				!self.params.noCache && window.localStorage.removeItem(self.id+"_pad");
			};

			self.setPage = function(id, page) {
				var that = this;
				pageMap[id] = page;
				that.container[id].splitPage = 1;
			};

			self.getPage = function(id) {
				return pageMap[id];
			};

			self.render = function(_data, callback) {
				var that = this;

				data.render.call(that, _data, function() {
					if("[object Function]"===toString.call(callback)) {
						var outData = data.copy(_data), obj = {};

						obj[activeObj.id] = {
							data: outData,
							type: activeObj.type,
							splitPage: activeObj.page?1:0
						};

						callback(obj);
					}
				});

				_data.status && that.tab.push.call(that, activeObj.id, _data);
			};
		}

		_tab.prototype = {
			constructor: _tab
		};

		return _tab;
	}());

	function Page(params) {
		if(!this instanceof Page) {
			return new Page(params);
		}

		var self = this,
			currentPage = 1,
			that = params.that,
			_data = data.splitPage(params.data),
			total = _data.length,
			tabId = params.tabId,
			show = params.show || false,
			div = document.createElement("DIV"),
			pageWrap = that.params.wrap.getElementsByClassName("split-page-wrap")[0];

		div.innerHTML = tpl4.replace(/@TOTAL@/g, total);
		var pageEle = div.removeChild(div.firstElementChild || div.firstChild),
			prePageBtn = pageEle.getElementsByClassName("pre-page-btn")[0],
			nextPageBtn = pageEle.getElementsByClassName("next-page-btn")[0],
			goPageBtn = pageEle.getElementsByClassName("go-page-btn")[0],
			pageNumberInput = pageEle.getElementsByClassName("page-number-input")[0];

		ele.addEvent(prePageBtn, eventMap["click"], function() {
			if(that.params.disable || currentPage<=1) return ;
			self.pre();
		});

		ele.addEvent(nextPageBtn, eventMap["click"], function() {
			if(that.params.disable || currentPage>=total) return ;
			self.next();
		});

		ele.addEvent(goPageBtn, eventMap["click"], function() {
			if(that.params.disable) return ;
			var pageNumber = pageNumberInput.value;
			
			self.go(pageNumber, function() {
				pageNumber = pageNumberInput.value;
				that.params.onPageTurn && that.params.onPageTurn(tabId, pageNumber, _data[pageNumber-1][0]);
			});
		});

		ele.addEvent(pageNumberInput, "input", function() {
			if(/^\s*([0-9]+).*\s*$/.test(this.value)) {
				this.value = RegExp.$1;
			} else {
				this.value = currentPage;
			}
		});

		ele.addEvent(pageNumberInput, "keypress", function() {
			var args = [].slice.call(arguments, 0),
				e = window.event || args[0];

			if(13===e.keyCode || 13===e.which) {
				var pageNumber = pageNumberInput.value;
			
				self.go(pageNumber, function() {
					pageNumber = pageNumberInput.value;
					that.params.onPageTurn && that.params.onPageTurn(tabId, pageNumber, _data[pageNumber-1][0]);
				});
			}
		});

		this.pre = function() {
			currentPage--;
			that.scroll.toOrigin("y");
			this.go(currentPage);
		};

		var render = function(pageNumber, start, callback) {
			var __data = _data[pageNumber-1];

			if("[object Array]"===toString.call(__data)) {
				__data.some(function(d, index) {
					if(index<start) return ;
					var flag = false;

					if("file"===d.type) {
						flag = true;

						data.render.call(that, d, function() {
							if(__data.length-1<=index) {
								callback && callback();
							} else {
								render(pageNumber, ++index, callback);
							}
						});
					} else {
						data.render.call(that, d);
						__data.length-1<=index && callback && callback();
					}

					return flag;
				});
			} else {
				data.render.call(that, __data, callback);
			}
		};

		this.go = function(pageNumber) {
			pageNumber = pageNumber<=1?1:pageNumber;
			pageNumber = pageNumber>=total?total:pageNumber;

			render(pageNumber, 0, function() {
				that.params.onPageTurn && that.params.onPageTurn(tabId, pageNumber, _data[pageNumber-1][0]);
			});

			currentPage = pageNumber;
			pageNumberInput.value = pageNumber;

			switch(true) {
				case currentPage<=1 && currentPage<total:
					ele.addClass(prePageBtn, "no");
					ele.removeClass(nextPageBtn, "no");
					break;
				case currentPage>1 && currentPage>=total:
					ele.removeClass(prePageBtn, "no");
					ele.addClass(nextPageBtn, "no");
					break;
				default:
					ele.removeClass(prePageBtn, "no");
					ele.removeClass(nextPageBtn, "no");
			}
		};

		this.next = function() {
			currentPage++;
			that.scroll.toOrigin("y");
			this.go(currentPage);
		};

		this.show = function() {
			pageWrap.innerHTML = "";

			if(_data.length>1) {
				pageWrap.appendChild(pageEle);

				switch(that.params.splitpageLayout) {
					case "left":
					pageWrap.style.left = "10px";
					break;
					case "center":
					pageWrap.style.left = (pageWrap.parentNode.clientWidth - pageWrap.offsetWidth)/2 + "px";
					break;
					default:
					pageWrap.style.right = "10px";
				}
			}
			
			this.go(currentPage);
		};

		this.hide = function() {
			if(that.tab.getActive().page!=self) return ;
			_data.length>1 && pageWrap.removeChild(pageEle);
		};

		this.getPageNumber = function() {
			return currentPage;
		};

		this.empower = function() {
			pageNumberInput.removeAttribute("readonly");
		};

		this.disable = function() {
			pageNumberInput.setAttribute("readonly", "readonly");
		};

		_data.forEach(function(d, i) {
			if("[object String]"===toString.call(d)) {
				_data[i] = [{
					data: [d, 0, 0],
					pageNumber: i+1,
					width: that.mainCanvas.offsetWidth,
					height: that.mainCanvas.offsetHeight,
					status: 1,
					type: "file",
					from: params.from
				}];
			}
		});

		this.push = function(d, pageNumber) {
			var activeTab = that.tab.getActive(), count = 0;
			d.pageNumber = void(0)!=pageNumber?pageNumber:currentPage;
			_data[d.pageNumber-1].push(d);
			that.tab.saveData.call(that);

			_data[d.pageNumber-1].forEach(function(d) {
				if("file"!=d.type && "auto"!=d.from) count++;
			});

			if(count-that.params.saveImgStep>=that.params.saveImgStep) {
				data.saveAsImage.call(that, _data[d.pageNumber-1], that.container[activeTab.id].type);
			}
		};

		this.getData = function() {
			var i = 0, arr = [];

			while(i<total) {
				[].push.apply(arr, _data[i]);
				i++;
			}

			return arr;
		};

		this.clear = function(params) {
			var pageNumber = (params?params.pageNumber:currentPage) || currentPage;
			_data[pageNumber-1].length = 1;
			that.tab.saveData.call(that);

			if(void(0)===params || (params.tabId==that.tab.getActive().id && params.pageNumber==currentPage)) {
				that.mainCanvas.width = that.mainCanvas.width;
				void(0)===params && "[object Function]"===toString.call(that.params.onClear) && that.params.onClear({tabId: that.tab.getActive().id, pageNumber: pageNumber});
			}
		};

		this.render = function(_data, callback) {
			var that = this;

			data.render.call(that, _data, function() {
				if("[object Function]"===toString.call(callback)) {
					var outData = data.copy(_data), obj = {}, activeTab = that.tab.getActive();

					obj[activeTab.id] = {
						data: outData,
						type: activeTab.type,
						pageNumber: currentPage,
						splitPage: activeTab.page?1:0
					};

					callback(obj);
				}
			});

			_data.status && that.tab.getActive().page.push.call(that, _data);
		};

		that.params.disable && this.disable();
		that.tab.saveData.call(that);
		show && this.show();
	}

	Page.prototype = {
		constructor: Page
	};

	function WPad(params) {
		if(!this instanceof WPad) {
			return new WPad(params);
		}

		var tplImage = new Image();
		tplImage.setAttribute("crossOrigin", "anonymous");

		var that = {
			pad: this,
			params: params,
			waitList: [],
			container: {},
			tplImage: tplImage,
			id: params.id || padCount++,
			render: function(_data) {
				var activeTab = that.tab.getActive();

				if(activeTab.page) {
					activeTab.page.render.call(that, _data, function(d) {
						"[object Function]"===toString.call(params.onRender) && params.onRender(d);
					});
				} else {
					that.tab.render.call(that, _data, function(d) {
						"[object Function]"===toString.call(params.onRender) && params.onRender(d);
					});
				}
			},
			mouseRender: function(_data) {
				mouse.render.call(that, _data);

				if(params.onMousemove) {
					var outData = data.copy(_data), obj = {}, activeTab = that.tab.getActive();

					obj[activeTab.id] = {
						data: outData,
						type: activeTab.type
					};

					params.onMousemove(obj);
				}
			}
		};
		
		buildPad.call(that);

		var render = function(_data) {
			var activeTab = that.tab.getActive();

			for(var key in _data) {
				if(!_data.hasOwnProperty(key)) continue;
				var val = _data[key], type = val.type, realData = val.data;

				if(key==activeTab.id) {
					if(!activeTab.page) {
						that.tab.render.call(that, realData);
					} else {
						if(activeTab.page.getPageNumber() == val.pageNumber) {
							activeTab.page.render.call(that, realData);
						} else {
							realData.status && activeTab.page.push.call(that, realData, +val.pageNumber);
						}
					}
				} else {
					if(that.tab.getTab(key)) {
						if(realData.status) {
							var page = that.tab.getPage(key);

							if(page) {
								page.push.call(that, realData, +val.pageNumber);
							} else {
								that.tab.push.call(that, key, realData);
							}
						}
					} else {
						that.tab.build.call(that, that.fileCanvas, {
							type: 1,
							data: [realData],
							id: key,
							from: realData.from
						});
					}
				}
			}
		};

		var renderMouse = function(_data) {
			var scaleWidth = null, scaleHeight = null;

			for(var key in _data) {
				if(!_data.hasOwnProperty(key)) continue;
				var val = _data[key], type = val.type, val = val.data;
				mouse.render.call(that, val);
			}
		};

		this.render = function(_data) {
			if("[object Object]"!=toString.call(_data)) {
				console.error("TypeError: data must be Object");
				return ;
			}
	
			render(_data);
		};

		this.renderAll = function(dataArr) {
			if("[object Object]"!=toString.call(dataArr)) {
				console.error("TypeError: data must be Array");
				return ;
			}

			dataArr.forEach(function(_data) {
				render(_data);
			});
		};

		this.mouseCtrl = function(_data) {
			if("[object Object]"!=toString.call(_data)) {
				console.error("TypeError: data must be Object");
				return ;
			}

			renderMouse(_data);
		};

		this.clear = function(params) {
			that.tab.clear.call(that, params);
		};

		this.disable = function() {
			ele.addClass(params.wrap.firstElementChild||params.wrap.firstChild, "disabled");
			params.disable = true;
		};

		this.enable = function() {
			ele.removeClass(params.wrap.firstElementChild||params.wrap.firstChild, "disabled");
			params.disable = false;
		};

		this.createImage = function() {
			return that.mainCanvas.toDataURL();
		};

		this.getData = function(tabId) {
			return that.container[tabId] || that.container;
		};

		this.changeTab = function(id) {
			return that.tab.active.call(that, id);
		};

		this.turnPage = function(id, number) {
			var activeTab = that.tab.getActive();

			if(id==activeTab.id) {
				var pageObj = that.tab.getPage.call(that, id);
				pageObj.go(number);
			}
		};

		this.removeTab = function(id) {
			if(void(0)==id) return ;
			that.tab.remove.call(that, id);
		};

		ele.addEvent(params.wrap, "mouseenter", function() {
			that.active = true;
		});

		ele.addEvent(params.wrap, "mouseleave", function() {
			that.active = false;
		});
	}

	function buildPad() {
		var self = this,
			params = this.params,
			wrap = params.wrap,
			toolbars = params.toolbars,
			toolbarMap = {},
			handPad = false,
			current = null,
			curActiveNode = null,
			curActiveChildNode = null,
			fr = new FileReader(),
			active = false,
			toolbarStr = "",
			isFullScreen = false,
			fullScreenInterface = wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.mozRequestFullScreen || wrap.msRequestFullscreen,
			cancelFullScreenInterface = document.exitFullscreen || document.webkitCancelFullScreen || document.mozCancelFullScreen;

		var colorInput = null,
			fileInput = null,
			textInput = null,
			mainCanvas = null,
			bufferCanvas1 = null,
			bufferCanvas2 = null,
			bufferCanvas3 = null,
			bufferCanvas4 = null;

		toolbars.forEach(function(toolbar) {
			var _childToolbars = childToolbars[toolbar];

			switch(toolbar) {
				case "handPad":

				break;
				case "color":

				break;
				case "clear":

				break;
				case "export":

				break;
				default:
				if(!_childToolbars) {
					toolbarMap[toolbar] = new vm.module[toolbar]({name: toolbar});
				} else {
					_childToolbars.forEach(function(_toolbar) {
						toolbarMap[_toolbar] = new vm.module[toolbar]({name: _toolbar});
					});
				}
			}

			var _tpl2 = tpl2.replace(/@ITEM@/g, !_childToolbars?toolbar:_childToolbars[0])
							.replace(/@ICONCLASS@/g, !_childToolbars?classes[toolbar]:classes[_childToolbars[0]])
							.replace(/@TITLE@/g, !_childToolbars?titles[toolbar]:titles[_childToolbars[0]])
							.replace(/@LEVEL@/g, 0);
				
			_tpl2 = _tpl2.replace(/@CHILDTOOLBARS@/g, !_childToolbars?"":tpl3);

			if(_childToolbars) {
				var childToolbarStr = "";

				_childToolbars.forEach(function(toolbar) {
					childToolbarStr += tpl2.replace(/@ITEM@/g, toolbar)
											.replace(/@ICONCLASS@/g, classes[toolbar])
											.replace(/@TITLE@/g, titles[toolbar])
											.replace(/@CHILDTOOLBARS@/g, "")
											.replace(/@LEVEL@/g, 1);
				});

				_tpl2 = _tpl2.replace(/@CHILDTOOLBARITEM@/g, childToolbarStr);
			}
			
			toolbarStr += _tpl2;
		});

		false!=params.fullScreen && (toolbarStr = toolbarStr + tpl5);
		var __str__ = tpl1.replace(/@LAYOUT@/g, layoutClassMap[params.layout]+(params.vertical?" vertical":""))
							.replace(/@TOOLBARS@/g, toolbarStr)
							.replace(/@DISABLED@/g, params.disable?"disabled":"")
							.replace(/@NOTOOLBAR@/g, params.noToolbar?"no-toolbar":"")
							.replace(/@NOTAB@/g, params.noTab?"no-tab":"");
		var _data = params.data || (!params.noCache?JSON.parse(window.localStorage.getItem(self.id+"_pad")):null);
		wrap.innerHTML = __str__;
		this.toolbarMap = toolbarMap;
		
		var canvasWrap = wrap.getElementsByClassName("can-wrap")[0],
			toolbarWrap = wrap.getElementsByClassName("toolbar-list")[0],
			fullScreenBtn = toolbarWrap.getElementsByClassName("full-screen-btn")[0];

		colorInput = wrap.getElementsByClassName("color-input")[0];
		fileInput = wrap.getElementsByClassName("file-input")[0];
		textInput = wrap.getElementsByClassName("text-input")[0];
		mainCanvas = wrap.getElementsByClassName("main-can")[0];
		bufferCanvas1 = wrap.getElementsByClassName("buffer-can-1")[0];
		bufferCanvas2 = wrap.getElementsByClassName("buffer-can-2")[0];
		bufferCanvas3 = wrap.getElementsByClassName("buffer-can-3")[0];
		bufferCanvas4 = wrap.getElementsByClassName("buffer-can-4")[0];

		// bufferCanvas1的mousemove事件回调
		var bc1MoveCallback = ele.redefineEvent("mousemove", "mouserun", bufferCanvas1);

		var createSize = function() {
			var canvasWrapWidth = canvasWrap.clientWidth, canvasWrapHeight = canvasWrap.clientHeight;

			switch(true) {
				case /^\s*(\d+)\s*\*\s*(\d+)\s*$/.test(params.size):
					canvasWrapWidth = +RegExp.$1;
					canvasWrapHeight = +RegExp.$2;
				break;
				case /^\s*(\d+)\s*:\s*(\d+)\s*$/.test(params.size):
					var _canvasWrapWidth = canvasWrap.clientWidth,
						_canvasWrapHeight = canvasWrap.clientHeight;

					switch(true) {
						case RegExp.$1/RegExp.$2>_canvasWrapWidth/_canvasWrapHeight:
						canvasWrapWidth = _canvasWrapWidth;
						canvasWrapHeight = _canvasWrapWidth/RegExp.$1*RegExp.$2;
						break;
						case RegExp.$1/RegExp.$2<_canvasWrapWidth/_canvasWrapHeight:
						canvasWrapHeight = _canvasWrapHeight;
						canvasWrapWidth = _canvasWrapHeight/RegExp.$2*RegExp.$1;
						break;
						default:
						canvasWrapWidth = _canvasWrapWidth;
						canvasWrapHeight = _canvasWrapHeight;
					}
				break;
				case /^\s*(\d+)%\s*$/.test(params.size):
					var _canvasWrapWidth = canvasWrap.clientWidth,
						_canvasWrapHeight = canvasWrap.clientHeight;

					canvasWrapWidth = _canvasWrapWidth/100*RegExp.$1;
					canvasWrapHeight = _canvasWrapHeight/100*RegExp.$1;
				break;
				default:
					canvasWrapWidth = canvasWrap.clientWidth;
					canvasWrapHeight = canvasWrap.clientHeight;
			}

			params.width = canvasWrapWidth>>0;
			params.height = canvasWrapHeight>>0;
		};

		ele.addEvent(canvasWrap, eventMap["wheel"], function() {
			var args = [].slice.call(arguments, 0),
				e = args[0] || window.event;

			if(window.event) {
				e.returnValue = false;
				e.cancelBubble = true;
			} else {
				e.preventDefault();
				e.stopPropagation();
			}

			if(true!=scrollObj.disable && scrollObj.scrollObj.y.coverHeight>0) {
				var data = {
					type: "y", 
					from: params.id,
					coverHeight: scrollObj.scrollObj.y.coverHeight,
					distance: scrollObj.scrollObj.y.top+("DOMMouseScroll"===e.type?(3===e.detail?100:-100):(e.deltaY))/5
				};

				scrollObj.scroll(data);
			}
		});

		var oldAvilWidth = canvasWrap.clientWidth, oldAvilHeight = canvasWrap.clientHeight;

		ele.redefineEvent("resize", "sizeChange", window);

		ele.addEvent(window, "sizeChange", function() {
			var avilWidth = canvasWrap.clientWidth,
				avilHeight = canvasWrap.clientHeight;

			if(avilWidth!=oldAvilWidth || avilHeight!=oldAvilHeight) {
				createSize();
				self.tab.active.call(self, self.tab.getActive().id, null, true);
				oldAvilWidth = avilWidth;
				oldAvilHeight = avilHeight;
			}

			self.tab.resizeTab();
		});

		var resizePad = function(w, h) {
			var width = w || params.width, height = h || params.height;

			mainCanvas.style.width = bufferCanvas1.style.width = bufferCanvas2.style.width = bufferCanvas3.style.width = bufferCanvas4.style.width = width + "px";
			mainCanvas.style.height = bufferCanvas1.style.height = bufferCanvas2.style.height = bufferCanvas3.style.height = bufferCanvas4.style.height = height + "px";
			mainCanvas.style.left = bufferCanvas1.style.left = bufferCanvas2.style.left = bufferCanvas3.style.left = bufferCanvas4.style.left = 0;
			mainCanvas.style.top = bufferCanvas1.style.top = bufferCanvas2.style.top = bufferCanvas3.style.top = bufferCanvas4.style.top = 0;

			if(width<canvasWrap.clientWidth) {
				var left = (canvasWrap.clientWidth - width)/2;
				mainCanvas.style.left = bufferCanvas1.style.left = bufferCanvas2.style.left = bufferCanvas3.style.left = bufferCanvas4.style.left = left + "px";
			}

			if(height<canvasWrap.clientHeight) {
				var top = (canvasWrap.clientHeight - height)/2;
				mainCanvas.style.top = bufferCanvas1.style.top = bufferCanvas2.style.top = bufferCanvas3.style.top = bufferCanvas4.style.top = top + "px";
			}

			scrollObj && scrollObj.resize();
		};

		var resizePadPixel = function(w, h) {
			var width = w || params.width, height = h || params.height;

			mainCanvas.width = bufferCanvas1.width = bufferCanvas2.width = bufferCanvas3.width = bufferCanvas4.width = width;
			mainCanvas.height = bufferCanvas1.height = bufferCanvas2.height = bufferCanvas3.height = bufferCanvas4.height = height;
		};

		self.tab = new Tab(params.wrap);
		self.textInput = textInput;
		self.mouseIconCanvas = bufferCanvas1;
		self.createImageCanvas = bufferCanvas3;
		self.fileCanvas = bufferCanvas4;
		self.mainCanvas = mainCanvas;
		createSize();

		var scrollObj = scroll.init({
			node: canvasWrap,
			id: params.id
		});

		scrollObj.disable = params.disable;
		self.scroll = scrollObj;

		scrollObj.addEvent("scroll", function(data) {
			"[object Function]"===toString.call(params.onScroll) && params.onScroll(data);
		});
		
		Object.defineProperty(self.tab, "resizePad", {
			value: resizePad
		});

		Object.defineProperty(self.tab, "resizePadPixel", {
			value: resizePadPixel
		});

		ele.addEvent(colorInput, "change", function() {
			self.params.color = this.value;
		});

		ele.addEvent(wrap.getElementsByClassName("pad-wrap")[0], eventMap["fullScreen"], function() {
			isFullScreen = !isFullScreen;
			ele.removeClass(fullScreenBtn, isFullScreen?"icon-enlarge":"icon-narrow");
			ele.addClass(fullScreenBtn, isFullScreen?"icon-narrow":"icon-enlarge");
		});

		var fullScreen = function(flag) {
			if(!isMobile) {
				flag?fullScreenInterface.call(wrap.getElementsByClassName("pad-wrap")[0]):cancelFullScreenInterface.call(document);
			}else {				
				flag?ele.addClass(wrap, "pad-full-screen"):ele.removeClass(wrap, "pad-full-screen");
				isFullScreen = flag;
				ele.removeClass(fullScreenBtn, isFullScreen?"icon-enlarge":"icon-narrow");
				ele.addClass(fullScreenBtn, isFullScreen?"icon-narrow":"icon-enlarge");
				self.tab.active.call(self, self.tab.getActive().id);
			}
		};

		var exportImage = function() {
			var uuid = self.tab.getActive().name || data.uuid,
				downloadEle = document.createElement("A"),
				createImageCanvas = self.createImageCanvas,
				ctx = createImageCanvas.getContext("2d"),
				padBox = self.params.wrap.getElementsByClassName("pad-wrap")[0];

			ctx.drawImage(self.fileCanvas, 0, 0);
			ctx.drawImage(self.mainCanvas, 0, 0);

			var	image = createImageCanvas.toDataURL(),
				imageDataArr = image.split(","),
				bStr = atob(imageDataArr[1]),
				len = bStr.length,
				tArr = new Uint8ClampedArray(len);

			while(len--) {
				tArr[len] = bStr.charCodeAt(len);
			}

			var url = URL.createObjectURL(new Blob([tArr], {mime: "image/octet-stream;Content-Disposition:attachment"}));
			downloadEle.className = "export-image";
			downloadEle.href = url;
			downloadEle.download = uuid + ".png";
			padBox.appendChild(downloadEle);
			downloadEle.click();

			var timer = setTimeout(function() {
				timer && clearTimeout(timer);
				URL.revokeObjectURL(url);
			}, 300);
			
			createImageCanvas.width = createImageCanvas.width;
			padBox.removeChild(downloadEle);
		};

		self.pad.resize = function(w, h) {
			if(!isNaN(w) && !isNaN(h)) {
				resizePad(w, h);
				resizePadPixel(w, h);
				self.tab.active.call(self, self.tab.getActive().id, true);
			} else {
				createSize();
				self.tab.active.call(self, self.tab.getActive().id);
			}			
		};

		self.pad.scroll = function(data) {
			scrollObj.scroll(data);
		};

		self.pad.fullScreen = function() {
			if(isFullScreen) return ;
			fullScreen(true);
		};

		self.pad.exitFullScreen = function() {
			if(!isFullScreen) return ;
			fullScreen(false);
		};

		self.pad.showFiles = function(params) {
			var files = params.files,
				newTab = params.newTab,
				isShow = params.isShow,
				from = void(0)!=params.from?params.from:self.params.id,
				tabId = params.tabId,
				tabName = params.tabName,
				activeTab = self.tab.getActive();

			files = "[object Array]"===toString.call(files)?files:[files];

			var _showFiles = function() {
				var pageObj = new Page({
					data: files, 
					show: isShow, 
					that: self,
					width: params.width,
					height: params.height,
					from: from,
					tabId: newTab?id:activeTab.id
				});

				self.tab.setPage.call(self, void(0)!=id?id:activeTab.id, pageObj);
				activeTab.page = pageObj;

				if(self.params.id==from && "[object Function]"===toString.call(self.params.onShowFiles)) {
					params.from = from;
					self.params.onShowFiles(params);
				}
			};

			if(newTab) {
				var id = self.tab.build.call(self, bufferCanvas4, {
					type: 1,
					id: tabId, 
					name: tabName,
					from: from
				});

				params.tabId = id;

				if(isShow) {
					self.tab.active.call(self, id);
					_showFiles();
					from == self.params.id && self.params.onTabChange && self.params.onTabChange(id);
				}
			} else {
				if(0==self.tab.getActive().id) {
					self.toolbarMap.image.renderBuffer.call(self, params.files);
					self.toolbarMap.image.render.call(self, [0, 0]);
				} else {
					self.pad.clear();
					_showFiles();
				}
			}
		};

		fr.onload = function(data) {
			self.toolbarMap.image.renderBuffer.call(self, data.target.result);
			self.toolbarMap.image.render.call(self, [0, 0]);
			fileInput.value = "";
		};

		ele.addEvent(fileInput, "change", function() {
			fr.readAsDataURL(this.files[0]);
		});

		ele.addEvent(textInput, "input", function() {
			this.style.width = this.scrollWidth + "px";
		});

		ele.addEvent(textInput, "keyup", function() {
			var args = [].slice.call(arguments, 0), 
				e = args[0] || window.event;

			if(13===e.which) {
				var val = data.trim(this.value);
				current.render.call(self, val);
			}
		});

		ele.addEvent(document, "keydown", function() {
			var args = [].slice.call(arguments, 0),
				e = args[0] || window.event,
				which = e.which;

			if(!self.active) return ;

			switch(true) {
				case 107===which || (187===which && e.shiftKey):
				current && current.largen && current.largen.call(self);
				break;
				case 109===which || (189===which && e.shiftKey):
				current && current.lesser && current.lesser.call(self);
				break;
			}
		});

		ele.addEvent(toolbarWrap, eventMap["click"], function() {
			if(params.disable) return ;

			var args = [].slice.call(arguments, 0),
				e = args[0] || window.event,
				span = e.srcElement || e.target,
				level = +span.getAttribute("level"),
				item = span.getAttribute("item");

			if(!item) return ;
			current && current.destory.call(self);

			switch(item) {
				case "handPad":
				handPad = !handPad;
				if(handPad) {
					span.setAttribute("active", "");
				} else {
					span.removeAttribute("active");
				}
				break;
				case "color":
				colorInput.click();
				break;
				case "clear":
				self.tab.clear.call(self);
				break;
				case "export":
				exportImage();
				break;
				case "image":
				fileInput.click();
				break;
				case "fullScreen":
				fullScreen(!isFullScreen);
				break;
				default:
				current = toolbarMap[item] || current;
				if(!current) return ;
				self.current = current;
				current.active();

				if(0===level) {
					curActiveNode && curActiveNode.removeAttribute("active");
					curActiveNode = span;
					var lastSpan = toolbarWrap.getElementsByClassName("selected-item")[0];

					if(span.parentNode!=lastSpan) {
						ele.removeClass(lastSpan, "selected-item");
					}

					ele.addClass(span.parentNode, "selected-item");
				}

				if(1===level) {
					curActiveChildNode && curActiveChildNode.removeAttribute("active");
					var parentSpan = ele.preNode(span.parentNode.parentNode);
					parentSpan.title = span.parentNode.title;
					parentSpan.className = parentSpan.className.replace(/\bicon-[\w-]+\b/, span.className.match(/\bicon-[\w-]+\b/));
					parentSpan.setAttribute("item", item);
					curActiveChildNode = span;
				}

				span.setAttribute("active", "");
			}

			if(item) {
				if(window.event) {
					e.returnValue = false;
					e.cancelBubble = true;
				} else {
					e.preventDefault();
					e.stopPropagation();
				}
			}
		});

		ele.addEvent(toolbarWrap, "mousedown", function() {
			var args = [].slice.call(arguments, 0),
				e = args[0] || window.event;

			if(window.event) {
				e.returnValue = false;
				e.cancelBubble = true;
			} else {
				e.preventDefault();
				e.stopPropagation();
			}
		});

		var mouseX = 0, mouseY = 0;

		ele.addEvent(bufferCanvas1, eventMap["move"], function() {
			var args = [].slice.call(arguments, 0), 
				e = args[0] || window.event,
				e = isMobile?e:(e.detail?e.detail:e);
			if(isMobile && e.targetTouches.length>1) return ;

			var rect = this.getBoundingClientRect(),
				posX = isMobile?e.targetTouches[0].clientX:e.clientX,
				posY = isMobile?e.targetTouches[0].clientY:e.clientY,
				pos = {
					x: posX - (rect.x || rect.left),
					y: posY - (rect.y || rect.top)
				};

			if(!current) {
				if(active) {
					if(true===scrollObj.disable) return ;
					var moveX = mouseX - posX, moveY = mouseY - posY;

					if(isMobile) {
						moveX /= 10;
						moveY /= 10;
					}

					if(scrollObj.scrollObj.x.coverWidth>0) {
						scrollObj.scroll({
							type: "x", 
							from: params.id,
							distance: scrollObj.scrollObj.x.left+moveX,
							coverWidth: scrollObj.scrollObj.x.coverWidth
						});

						mouseX = posX;
					}

					if(scrollObj.scrollObj.y.coverHeight>0) {
						scrollObj.scroll({
							type: "y", 
							from: params.id,
							distance: scrollObj.scrollObj.y.top+moveY,
							coverHeight: scrollObj.scrollObj.y.coverHeight
						});

						mouseY = posY;
					}
				}
			} else {
				var item = current.name.toLowerCase();

				if(handPad || active) {
					switch(item) {
						case "ferula":
						current.mouseRender.call(self, pos);
						break;
						case "circular":
						case "quadrate":
						current.mouseRender.call(self, pos);
						default:
						current.bufferRender.call(self, pos);
					}
				} else {
					current.mouseRender && current.mouseRender.call(self, pos);
				}
			}
		});

		ele.addEvent(bufferCanvas1, eventMap["down"], function() {
			var args = [].slice.call(arguments, 0),
				e = args[0] || window.event,
				rect = this.getBoundingClientRect(),
				lastSpan = toolbarWrap.getElementsByClassName("selected-item")[0],
				pos = {
					x: (isMobile?e.targetTouches[0].clientX:e.clientX) - (rect.x || rect.left), 
					y: (isMobile?e.targetTouches[0].clientY:e.clientY) - (rect.y || rect.top)
				};

			if(window.event) {
				e.returnValue = false;
				e.cancelBubble = true;
			} else {
				e.preventDefault();
				e.stopPropagation();
			}

			mouseX = isMobile?e.targetTouches[0].clientX:e.clientX;
			mouseY = isMobile?e.targetTouches[0].clientY:e.clientY;
			active = true;
			if(!current) return ;
			ele.removeClass(lastSpan, "selected-item");
			current.bufferRender && current.bufferRender.call(self, pos, true);
		});

		ele.addEvent(document, eventMap["down"], function() {
			var lastSpan = toolbarWrap.getElementsByClassName("selected-item")[0];
			ele.removeClass(lastSpan, "selected-item");
			current && current.destory.call(self);
		});

		ele.addEvent(document, "mouseup", function() {
			if(active) {
				active = false;
				current && current.render && current.render.call(self);
			}
		});

		ele.addEvent(bufferCanvas1, eventMap["up"], function() {
			var args = [].slice.call(arguments, 0),
				e = args[0] || window.event;
			active = false;
			current && current.render && current.render.call(self);
		});

		ele.addEvent(canvasWrap, "mouseleave", function() {
			current && current.destory.call(self);
		});

		self.bufferCanvas = bufferCanvas2;

		if(!_data) {
			var _n = self.tab.build.call(self, mainCanvas, {type: 0});
			self.tab.active.call(self, _n);
		} else {
			Object.keys(_data).sort(function(a, b) {return a-b}).forEach(function(key) {
				var val = _data[key];

				var _n = self.tab.build.call(self, 0===val.type?mainCanvas:bufferCanvas4, {
					type: val.type,
					data: val.data,
					id: key, 
					name: val.tabName,
					from: val.from
				});

				if(val.splitPage) {
					var pageObj = new Page({
						data: val.data, 
						show: 0 === val.type, 
						that: self,
						tabId: _n
					});

					self.tab.setPage.call(self, _n, pageObj);
				}

				0===val.type && self.tab.active.call(self, _n);
			});
		}
	}

	window.wPad = {
		init: function(params) {
			var _params = data.copy({}, defaultConfig);
			_params = data.copy(_params, params);
			_params.id = void(0)==_params.id?data.uuid:_params.id;
			var pad = new WPad(_params);
			void(0)!=_params.id && (padMap[_params.id] = pad);
			padTab.push(pad);
			return pad;
		},
		getPadById: function(id) {
			if(void(0)===id) return ;
			return padMap[id];
		},
		getPadByIndex: function(index) {
			if(void(0)===index) return ;
			return padTab[index];
		}
	};
}());