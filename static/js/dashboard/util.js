"use strict";
/**
 * Date 2019-5-14
 * Autor Jason
 * Description 工具类
 */
(function(undefined) {
    var toString = Object.prototype.toString;
    var nodeMap = {
        li: "ul"
    };

    // 工具类
    function Util() {
        if(!(this instanceof Util)) {
            return new Util();
        }

        this.name = "Util";
        this._listeners = [];
    }

    Util.prototype = {
        constructor: Util,
        // 数据copy
        copy: function(data) {
            if("[object Object]"===toString.call(data) || "[object Array]"===toString.call(data)) {
                return JSON.parse(JSON.stringify(data));
            }

            return data;
        },
        // 用hmtl字符串模板创建dom元素
        createEle: function(tpl) {
            var reg = /^\s*?<\s*([a-zA-Z0-9]+)[\s\S]*?>/;
            if(!reg.test(tpl)) return ;
            var wrap = document.createElement(nodeMap[RegExp.$1] || "div");
            wrap.innerHTML = tpl;
            return wrap.removeChild(wrap.firstElementChild || wrap.firstChild);
        },
        // 事件绑定
        addEvent: window.addEventListener?function(target, type, fn, use) {
            target.addEventListener(type, fn, use||false);
        }:function(target, type, fn) {
            target.attachEvent("on"+type, fn);
        },
        delEvent: window.removeEventListener?function(target, type, fn, use) {
            target.removeEventListener(type, fn, use||false);
        }:function(target, type, fn) {
            target.dettachEvent("on"+type, fn);
        },
        // 添加类名
        addClass: function(node, className) {
            var reg = new RegExp("\\b" + className + "\\b");
            if(reg.test(node.className)) return ;
            node.className = node.className.replace(/^\s+|\s+$/, "") + " " + className;
        },
        // 删除类名
        removeClass: function(node, className) {
            var reg = new RegExp("\\b" + className + "\\b");
            if(!reg.test(node.className)) return ;
            node.className = node.className.replace(reg, "").replace(/^\s+|\s+$/, "");
        },
        // 判断dom节点是否存在某个className
        hasClass: function(node, className) {
            if(!className && 0!=className) return ;
            var reg = new RegExp("\\b" + className + "\\b");
            return reg.test(node.className);
        },
        // 删除子元素
        removeChild: function(parent, child) {
            parent.removeChild(child);
        },
        // 添加样式
        css: function(ele, name, val) {
            ele.style.setProperty(name, val);
        },
        // 删除元素的某个属性
        delAttr: function(ele, name) {
            ele.removeAttribute(name);
        },
        // 元素增加或者获取某个属性的值
        attr: function(ele, name, val) {
            if(!val && 0!=val) {
                ele.getAttribute(name);
            } else {
                ele.setAttribute(name, val);
            }
        },
        // 添加监听
        on: function(fn) {
            if(void(0)===fn) return;
            this._listeners.push(fn);
        },
        // 广播
        call: function(params) {
            self = this;

            this._listeners.forEach(function(fn) {
                fn.call(self, params);
            });
        },
        // 对象转JSON字符串
        toJSONString: function(obj) {
            var _obj = (function copy(data) {
                if("[object Array]"!=toString.call(data) && "[object Object]"!=toString.call(data)) {
                    if("[object Function]"===toString.call(data)) {
                        return data.toString();
                    } else {
                        return data;
                    }
                } else {
                    if("[object Array]"===toString.call(data)) {
                        var container = [];

                        data.forEach(function(item) {
                            container.push(copy(item));
                        });
                    } else {
                        var container = {};

                        for(var key in data) {
                            if(!data.hasOwnProperty(key)) continue;
                            container[key] = copy(data[key]);
                        }
                    }
                    
                    return container;
                }
            })(obj);

            return JSON.stringify(_obj);
        },
        // JSON字符串转对象
        toJSONObject: function(str) {
            var obj = JSON.parse(str);

            var _obj = (function copy(data) {
                if("[object Array]"!=toString.call(data) && "[object Object]"!=toString.call(data)) {
                    if("[object String]"===toString.call(data)) {
                        if(/^\s*function\s*[a-zA-Z]*\(([\w$,]*)\)\s*\{([\s\S]*)\}\s*$/.test(data)) {
                            return new Function(RegExp.$1, RegExp.$2);
                        } 

                        if(/^\s*new\b/.test(data)) {
                            return new Function("return " + data)();
                        }

                        return data;
                    } else {
                        return data;
                    }
                } else {
                    if("[object Array]"===toString.call(data)) {
                        var container = [];

                        data.forEach(function(item) {
                            container.push(copy(item));
                        });
                    } else {
                        var container = {};

                        for(var key in data) {
                            if(!data.hasOwnProperty(key)) continue;
                            container[key] = copy(data[key]);
                        }
                    }
                    
                    return container;
                }
            })(obj);

            return _obj;
        }
    };

    window.Util = window.Util || Util;
}());