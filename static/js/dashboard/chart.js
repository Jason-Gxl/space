"use strict";
/**
 * Date 2019-5-14
 * Autor Jason
 * Description 图表类，创建图表对象，依赖echarts，需要先引echarts.js
 */
(function(fn, undefined) {
    var toString = Object.prototype.toString;
    // echarts支持的所有事件
    var chartEvents = ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseup', 'mouseover', 'mouseout', 'globalout', 'contextmenu'];
    // 存储被选中的图表对象
    var selected = null;
    // 图表层级
    var zIndex = 1000;
    // 图表编号
    var chartNumber = 1;
    // 图表编号对应图表
    var chartNumberMap = {};
    // 定时器计数器
    var timeLoopCount = -1;

    // 创建图表对象的模板
    var tpl = '\
        <div class="dashboard-item">\
            <div class="pos-wrap pos-top">\
                <label>W:<input type="text" class="pos-input" name="width"/></label>\
                <label>Y:<input type="text" class="pos-input" name="top"/></label>\
            </div>\
            <div class="pos-wrap pos-left">\
                <label>H:<input type="text" class="pos-input" name="height"/></label>\
                <label>X:<input type="text" class="pos-input" name="left"/></label>\
            </div>\
            <div class="pos-wrap pos-right">\
                <label>H:<input type="text" class="pos-input" name="height"/></label>\
                <label>X:<input type="text" class="pos-input" name="left"/></label>\
            </div>\
            <div class="pos-wrap pos-bottom">\
                <label>W:<input type="text" class="pos-input" name="width"/></label>\
                <label>Y:<input type="text" class="pos-input" name="top"/></label>\
            </div>\
            <div class="number-wrap">\
                NO.<input type="text" class="nubmer-input"/>\
            </div>\
            <span class="title-wrap">无标题</span>\
            <ul class="chart-filter-wrap"></ul>\
            <div class="chart-wrap">\
                <div class="chart-wrap-inner"></div>\
            </div>\
            <div class="setting-wrap">\
                <a href="javascript:void(0);" class="setting-btn btn">设置</a>\
                <a href="javascript:void(0);" class="delete-btn btn">删除</a>\
            </div>\
        </div>';

    // 创建过滤器对象的模板
    var ftpl = '<li class="filter-item-wrap">$LABEL$<input name="$NAME$" placeholder="$PLACEHOLDER$" value="$VALUE$" type="$TYPE$"/><a href="javascript:void(0);" class="disable-btn"></a></li>'

    // 滚动条模板
    var scrollXStr = '<div class="chart-scroll scroll-x"><span class="scroll-x-btn scroll-btn"></span></div>';
    var scrollYStr = '<div class="chart-scroll scroll-y"><span class="scroll-y-btn scroll-btn"></span></div>';

    /**
     * 滚动条类
     * @param   chart   Object  图表对象
     * @param   wrap    Node    需要被加滚动条的dom元素
     */
    function Scroll(chart, wrap) {
        if(!(this instanceof Scroll)) {
            return new Scroll(chart, wrap);
        }

        var self = this,
            parentNode = wrap.parentNode,
            wrapWidth = wrap.offsetWidth,
            wrapHeight = wrap.offsetHeight,
            parentWidth = parentNode.clientWidth,
            parentHeight = parentNode.clientHeight,
            vx = wrapWidth - parentWidth,
            vy = wrapHeight - parentHeight,
            tx = vx/(parentWidth - 100),
            ty = vy/(parentHeight - 100),
            lastPoint = 0,
            type = "x";

        if(vx) {
            var scrollX = chart.dashboard.createEle(scrollXStr);
            var xBtn = scrollX.getElementsByClassName("scroll-btn")[0];
        }

        if(vy) {
            var scrollY = chart.dashboard.createEle(scrollYStr);
            var yBtn = scrollY.getElementsByClassName("scroll-btn")[0];
        }

        scrollX && parentNode.appendChild(scrollX);
        scrollY && parentNode.appendChild(scrollY);

        if(xBtn) {
            xBtn.style.setProperty("width", (tx>1?100:(parentWidth-vx)) + "px");

            chart.dashboard.addEvent(xBtn, "mousedown", function() {
                var args = [].slice.call(arguments, 0),
                    e = args[0] || window.e;

                type = "x";
                lastPoint = e.clientX;
                chart.dashboard.addEvent(document, "mousemove", eventHandle.mousemove);
                chart.dashboard.addEvent(document, "mouseup", eventHandle.mouseup);
                e.stopPropagation();
                e.preventDefault();
            });
        }

        if(yBtn) {
            yBtn.style.setProperty("height", (ty>1?100:(parentHeight-vy)) + "px");

            chart.dashboard.addEvent(yBtn, "mousedown", function() {
                var args = [].slice.call(arguments, 0),
                    e = args[0] || window.e;

                type = "y";
                lastPoint = e.clientY;
                chart.dashboard.addEvent(document, "mousemove", eventHandle.mousemove);
                chart.dashboard.addEvent(document, "mouseup", eventHandle.mouseup);
                e.stopPropagation();
                e.preventDefault();
            });
        }

        if(scrollX || scrollY) {
            var eventHandle = {
                mousemove: function() {    
                    var args = [].slice.call(arguments, 0),
                        e = args[0] || window.e;
    
                    if("x"===type) {
                        var d = (e.clientX - lastPoint)/(chart.dashboard.params.scale || 1);
                        var left = xBtn.offsetLeft + d;
                        left = Math.max(0, Math.min(left, parentWidth - xBtn.offsetWidth));
                        xBtn.style.setProperty("left", left + "px");
                        lastPoint = e.clientX;
                        wrap.style.setProperty("left", -left * tx + "px");
                    } else {
                        var d = (e.clientY - lastPoint)/(chart.dashboard.params.scale || 1);
                        var top = yBtn.offsetTop + d;
                        top = Math.max(0, Math.min(top, parentHeight - yBtn.offsetHeight));
                        yBtn.style.setProperty("top", top + "px");
                        lastPoint = e.clientY;
                        wrap.style.setProperty("top", -top * ty  + "px");
                    }
                },
                mouseup: function() {
                    chart.dashboard.delEvent(document, "mousemove", eventHandle.mousemove);
                    chart.dashboard.delEvent(document, "mouseup", eventHandle.mouseup);
                }
            };
        }

        if(scrollY) {
            chart.dashboard.addEvent(wrap, "mousewheel", function() {
                var args = [].slice.call(arguments, 0),
                    e = args[0] || window.e;

                var d = e.deltaY/62.5/(chart.dashboard.params.scale || 1);
                var top = yBtn.offsetTop + d;
                top = Math.max(0, Math.min(top, parentHeight - yBtn.offsetHeight));
                yBtn.style.setProperty("top", top + "px");
                lastPoint = e.clientY;
                wrap.style.setProperty("top", -top * ty  + "px");
            });
        }

        Object.defineProperties(this, {
            chart: {
                get: function() {
                    return chart;
                }
            },
            scrollX: {
                get: function() {
                    return scrollX;
                }
            },
            scrollY: {
                get: function() {
                    return scrollY;
                }
            },
            wrap: {
                get: function() {
                    return wrap;
                }
            }
        });
    }

    Scroll.prototype = {
        constructor: Scroll,
        show: function() {
            (this.scrollX || this.scrollY) && this.chart.dashboard.addClass(this.wrap.parentNode, "show-scroll");
        },
        hide: function() {
            (this.scrollX || this.scrollY) && this.chart.dashboard.removeClass(this.wrap.parentNode, "show-scroll");
        },
        destory: function() {
            this.scrollX && this.wrap.parentNode.removeChild(this.scrollX);
            this.scrollY && this.wrap.parentNode.removeChild(this.scrollY);
        }
    };

    /**
     * 过滤器类
     * @param   chart   Object  图表对象
     * @param   params  Object  过滤属性
     */
    function Filter(chart, params) {
        if(!(this instanceof Filter)) {
            return new Filter(chart, params);
        }

        this.name = "Filter";
        var placeholderMap = {
            date: "请选择日期"
        };

        var self = this;
        var filterWrap = chart.ele.getElementsByClassName("chart-filter-wrap")[0];
        var _ftpl = ftpl.replace(/\$NAME\$/, params.name.toLowerCase()||"")
                        .replace(/\$VALUE\$/, params.default || "")
                        .replace(/\$TYPE\$/, params.type.toLowerCase() || "text")
                        .replace(/\$PLACEHOLDER\$/, placeholderMap[params.type.toLowerCase()] || "请输入")
                        .replace(/\$LABEL\$/, params.label?(params.label+":"):"");
        var ele = chart.dashboard.createEle(_ftpl);
        filterWrap.appendChild(ele);
        self.chart = chart;

        if("dev"!=chart.params.env) {
            chart.dashboard.addClass(ele, "no-btn");
        }

        Object.defineProperties(this, {
            ele: {
                get: function() {
                    return ele;
                }
            },
            status: {
                get: function() {
                    return params.status;
                }
            }
        });

        // 判断过滤条件当前的状态
        // 如果当前状态是false，判断当前环境
        // 如果当前是看板的创建环境，将过滤元素置灰，不可用
        // 如果当前是生产环境，直接不显示过滤元素
        if(void(0)!=params.status && !params.status) {
            if("dev"===chart.params.env) {
                this.disable();
            } else {
                this.hide();
            }
        }

        // 给过滤元素添加change事件
        chart.dashboard.addEvent(ele.getElementsByTagName("input")[0], "change", function() {
            params.value = this.value;
            if(!chart.params.filterChange) return ;
            var p = chart.params.filterChange.call(chart, params);
            if(!p) return ;

            if("[object Array]"===toString.call(p)) {
                p.forEach(function(item) {
                    if(item.dashboardId===chart.dashboard.params.id) {
                        chart.dashboard.call(item);
                    } else {
                        var _d = chart.dashboard.getOtherById(item.dashboardId);

                        if(_d) {
                            _d.call(item);
                        } else {
                            // 需要通websocket发送
                            chart.dashboard.sendMessage(item.dashboardId, item);
                        }
                    }
                });
            } else {
                chart.dashboard.call(p);
            }
        });

        // 给过滤元素的”禁用“、”启用“按钮添加点击事件
        chart.dashboard.addEvent(ele.getElementsByClassName("disable-btn")[0], "click", function() {
            params.status = void(0)===params.status?false:!params.status;

            if(params.status) {
                self.able();
            } else {
                self.disable();
            }
        });
    }

    // 禁用过滤条件
    Filter.prototype.disable = function() {
        this.ele.getElementsByTagName("input")[0].setAttribute("disabled", "disabled");
        this.chart.dashboard.addClass(this.ele, "filter-disable");
    };

    // 启用过滤条件
    Filter.prototype.able = function() {
        this.ele.getElementsByTagName("input")[0].removeAttribute("disabled", "disabled");
        this.chart.dashboard.removeClass(this.ele, "filter-disable");
    };

    // 显示过滤条件
    Filter.prototype.show = function() {
        this.chart.dashboard.removeClass(this.ele, "hide");
        this.chart.echart.resize();
    };

    // 隐藏过滤条件
    Filter.prototype.hide = function() {
        this.chart.dashboard.addClass(this.ele, "hide");
        this.chart.echart.resize();
    };

    /**
     * 图表类
     * @param   dashboard   Object  看板对象
     * @param   params  Object  创建图表需要的参数
     */
    function Chart(dashboard, params) {
        if(!(this instanceof Chart)) {
            return new Chart(dashboard, params);
        }

        this.name = "Chart";
        // 创建一个数组存储创建的过滤器对象
        this._filters = [];
        params.title = void(0)===params.title?"无标题":params.title;
        params.zIndex = isNaN(params.zIndex)?zIndex:params.zIndex;
        params.chartNumber = isNaN(params.chartNumber)?chartNumber:params.chartNumber;

        chartNumber = params.chartNumber + 1;
        chartNumberMap[params.chartNumber] = this;

        var self = this,
            // 创建echarts图表需要的参数
            options = params.chartOptions,
            // 过滤条件
            filters = params.filters,
            _tpl = tpl.replace(/无标题/g, params.title),
            ele = dashboard.createEle(_tpl),
            titleWrap = ele.getElementsByClassName("title-wrap")[0],
            filterWrap = ele.getElementsByClassName("chart-filter-wrap")[0],
            chartWrap = ele.getElementsByClassName("chart-wrap")[0],
            chartWrapInner = chartWrap.getElementsByClassName("chart-wrap-inner")[0];

        params.css = params.css || {};
        params.css.wrap = params.css.wrap || {};
        params.css.title = params.css.title || {};

        // 遍历样式
        for(var key in params.css) {
            var styleParams = params.css[key];

            switch(key) {
                case "wrap":    // 图表容器样式
                    for(var k in styleParams) {
                        ele.style.setProperty(k, "[object Number]"===toString.call(styleParams[k])?(styleParams[k]+ "px"):styleParams[k]);
                    }
                break;
                case "title":   // 标题样式
                    for(var k in styleParams) {
                        titleWrap.style.setProperty(k, "[object Number]"===toString.call(styleParams[k])?(styleParams[k]+ "px"):styleParams[k]);
                    }
                break;
                default:
            }
        }

        ele.style.setProperty("z-index", params.zIndex);
        params.wrap.appendChild(ele);
        zIndex = Math.max(params.zIndex, zIndex) + 1;
        // 创建echart图表
        var obj = fn(params.type), echart = obj.init(chartWrapInner);

        Object.defineProperties(this, {
            echart: {
                get: function() {
                    return echart;
                }
            },
            ele: {
                get: function() {
                    return ele;
                }
            },
            params: {
                get: function() {
                    return params;
                }
            },
            dashboard: {
                get: function() {
                    return dashboard;
                }
            },
            dragable: {
                set: function(val) {
                    params.dragable = val;
                },
                get: function() {
                    return params.dragable || false;
                }
            }
        });

        // 为创建的echart图表设置参数
        options && this.setOption(options);

        params.css.wrap = {
            width: params.css.wrap.width || ele.offsetWidth,
            height: params.css.wrap.height || ele.offsetHeight,
            left: params.css.wrap.left || ele.offsetLeft,
            top: params.css.wrap.top || ele.offsetTop
        };

        // 如果有过滤条件，需要注册监听器
        if(filters) {
            dashboard.on(function(_params) {
                if(!_params || -1===_params.links.indexOf(params.id)) return ;
                params.filterCallback && params.filterCallback.call(self, _params);
            });

            // 遍历过滤条件创建过滤器对象
            for(var key in filters) {
                filters[key].name = key;
                this._filters.push(new Filter(this, filters[key]));
            }
        }

        // 注册echart事件
        chartEvents.forEach(function(eventName) {
            echart.on(eventName, function(event) {
                if("[object Function]"!=toString.call(params[eventName])) return ;
                var p = params[eventName].call(self, event);
                if(!p) return ;

                if("[object Array]"===toString.call(p)) {
                    p.forEach(function(item) {
                        if(item.dashboardId===dashboard.params.id) {
                            dashboard.call(item);
                        } else {
                            var _d = dashboard.getOtherById(item.dashboardId);

                            if(_d) {
                                _d.call(item);
                            } else {
                                // 需要通websocket发送
                                dashboard.sendMessage(item.dashboardId, item);
                            }
                        }
                    });
                } else {
                    dashboard.call(p);
                }
            });
        });

        dashboard.addEvent(ele, "mouseenter", function() {
            self.scroll.show();
        });

        dashboard.addEvent(ele, "mouseleave", function() {
            self.scroll.hide();
        });

        // 如果当前是看板的创建环境
        // 给图表容器添加click、mouseenter、mouseleave、keydown事件
        if("dev"===params.env) {
            dashboard.addEvent(ele, "click", function() {
                var args = [].slice.call(arguments, 0),
                    e = args[0] || window.event;
                selected && selected.hidePos();
                self.showPos();
                selected = self;
                self.dashboard._selected = selected;
                e.stopPropagation();
                e.preventDefault();
            });

            dashboard.addEvent(ele, "mouseenter", function() {
                var args = [].slice.call(arguments, 0),
                    e = args[0] || window.event;
                self.showSetting();
                e.stopPropagation();
                e.preventDefault();
            });

            dashboard.addEvent(ele, "mouseleave", function() {
                var args = [].slice.call(arguments, 0),
                    e = args[0] || window.event;
                self.hideSetting();
                e.stopPropagation();
                e.preventDefault();
            });

            dashboard.addEvent(ele, "keydown", function() {
                var args = [].slice.call(arguments, 0),
                    e = args[0] || window.event;
    
                if(13!=e.keyCode && 13!=e.which) return;
                var target = e.target || e.srcElement,
                    targetName = target.name.toLocaleLowerCase();

                if(-1!=["width", "height", "left", "top"].indexOf(target.name)) {
                    ele.style.setProperty(targetName, target.value+"px");

                    if("width"===targetName || "height"===targetName) {
                        echart.resize();

                        if("height"===targetName) {
                            chartWrap.style.setProperty("--height", ele.clientHeight - titleWrap.offsetHeight - filterWrap.offsetHeight + "px");
                        }
                    }

                    params.css.wrap[targetName] = +target.value;
                }

                e.stopPropagation();
                e.preventDefault();
            });

            // 在看板的创建环境中
            // 为设置按钮添加点击事件
            dashboard.addEvent(ele.getElementsByClassName("setting-btn")[0], "click", function() {
                var args = [].slice.call(arguments, 0),
                    e = args[0] || window.event;
    
                if(params.settingCallback) params.settingCallback.call(self);
                e.stopPropagation();
                e.preventDefault(); 
            });

            // 在看板的创建环境中
            // 为删除按钮添加点击事件
            dashboard.addEvent(ele.getElementsByClassName("delete-btn")[0], "click", function() {
                var args = [].slice.call(arguments, 0),
                    e = args[0] || window.event;
    
                self.destory();               
                e.stopPropagation();
                e.preventDefault();
            });

            // 编号改变事件
            dashboard.addEvent(ele.getElementsByClassName("nubmer-input")[0], "change", function() {
                if(chartNumberMap[this.value] && chartNumberMap[this.value]!=self) {
                    this.value = params.chartNumber;
                    if(params.error) params.error.call(self, {code: 0, message: "编号重复"});
                    return ;
                }

                params.chartNumber = this.value;
            });

            this._filters.length>0 && dashboard.addClass(filterWrap, "has-filter");
            dashboard.addClass(ele, "show-number");
            dashboard.addClass(ele, "has-pos");
            ele.getElementsByClassName("nubmer-input")[0].value = params.chartNumber;
        } else {
            this._filters.some(function(filter) {
                filter.status && dashboard.addClass(filterWrap, "has-filter");
                return filter.status;
            });
        }
        
        params.showTitle && self.showTitle();
        chartWrap.style.setProperty("--height", ele.clientHeight - titleWrap.offsetHeight - filterWrap.offsetHeight + "px");
        echart.resize();

        // 如果有时间，设置定时器
        if(!isNaN(params.time)) {
            self.setTimer(params.time);
        }
    }

    Chart.prototype.constructor = Chart;

    // 定时
    Chart.prototype.setTimer = function(time, type, index) {
        if(void(0)===time) return;
        this.time && this.cleanTimer();

        var it = null,
            count = timeLoopCount,
            self = this,
            echart = self.echart,
            params = self.params,
            series = params.chartOptions.series || [],
            dispatchActionType = type || params.dispatchActionType,
            seriesIndex = index || params.seriesIndex || 0,
            limit = "series"===dispatchActionType?series.length:series[seriesIndex].data.length;

        params.dispatchActionType = dispatchActionType;
        params.seriesIndex = seriesIndex;

        (function _setTimer() {
            it = setTimeout(function() {
                it && clearTimeout(it);
                
                if("series"===params.dispatchActionType) {
                    -1!=count && echart.dispatchAction({
                        type: "downplay",
                        seriesIndex: count
                    });

                    count++;
                    count = count>=limit?0:count;

                    echart.dispatchAction({
                        type: "highlight",
                        seriesIndex: count
                    });
                } else {
                    var _series = series[params.seriesIndex||0];

                    if(_series) {
                        -1!=count && echart.dispatchAction({
                            type: "pie"===_series.type?"pieUnSelect":"highlight",
                            dataIndex: count
                        });

                        count++;
                        count = count>=limit?0:count;

                        echart.dispatchAction({
                            type: "pie"===_series.type?"pieSelect":"downplay",
                            dataIndex: count
                        });
                    }
                }

                if("[object Function]"!=toString.call(params.timeCallback)) return;
                var p = params.timeCallback.call(self, "series"===dispatchActionType?series[count]:series[seriesIndex].data[count], 1);
                _setTimer();
                timeLoopCount = count;
                if(!p) return ;

                if("[object Array]"===toString.call(p)) {
                    p.forEach(function(item) {
                        if(item.dashboardId===self.dashboard.params.id) {
                            self.dashboard.call(item);
                        } else {
                            var _d = self.dashboard.getOtherById(item.dashboardId);

                            if(_d) {
                                _d.call(item);
                            } else {
                                // 需要通websocket发送
                                self.dashboard.sendMessage(item.dashboardId, item);
                            }
                        }
                    });
                } else {
                    self.dashboard.call(p);
                }
            }, time);

            self.time = it;
        }());
    };

    // 移除定时器
    Chart.prototype.cleanTimer = function() {
        if(void(0)===this.time) return ;
        clearTimeout(this.time);
        if(-1===timeLoopCount) return ;

        var self = this,
            params = this.params, 
            series = params.chartOptions.series || [];

        if("series"===params.dispatchActionType) {
            this.echart.dispatchAction({
                type: "downplay",
                seriesIndex: timeLoopCount
            });
        } else {
            var _series = series[params.seriesIndex];

            if(_series) {
                this.echart.dispatchAction({
                    type: "pie"===_series.type?"pieUnSelect":"highlight",
                    dataIndex: timeLoopCount
                });
            }
        }

        if("[object Function]"!=toString.call(params.timeCallback)) return;
        var p = params.timeCallback.call(self, "series"===params.dispatchActionType?series[timeLoopCount]:series[params.seriesIndex].data[timeLoopCount], 0);
        if(!p) return ;

        if("[object Array]"===toString.call(p)) {
            p.forEach(function(item) {
                if(item.dashboardId===self.dashboard.params.id) {
                    self.dashboard.call(item);
                } else {
                    var _d = self.dashboard.getOtherById(item.dashboardId);

                    if(_d) {
                        _d.call(item);
                    } else {
                        // 需要通websocket发送
                        self.dashboard.sendMessage(item.dashboardId, item);
                    }
                }
            });
        } else {
            self.dashboard.call(p);
        }

        timeLoopCount = -1;
    };

    // 设置echart图表参数
    Chart.prototype.setOption = function(options) {
        if(!options) return ;
        var self = this;
        var echart = this.echart;
        echart.setOption(options);

        setTimeout(function() {
            self.scroll = new Scroll(self, self.ele.getElementsByClassName("chart-wrap-inner")[0]);
        }, 0);
    };

    // 显示标题
    Chart.prototype.showTitle = function() {
        var ele = this.ele,
            titleWrap = ele.getElementsByClassName("title-wrap")[0],
            filterWrap = ele.getElementsByClassName("chart-filter-wrap")[0],
            chartWrap = ele.getElementsByClassName("chart-wrap")[0];

        this.params.showTitle = true;
        this.dashboard.addClass(this.ele, "show-title");
        chartWrap.style.setProperty("--height", ele.clientHeight - titleWrap.offsetHeight - filterWrap.offsetHeight + "px");
        this.echart.resize();
        this.scroll && this.scroll.destory();
        this.scroll = new Scroll(this, this.ele.getElementsByClassName("chart-wrap-inner")[0]);
    };

    // 隐藏标题
    Chart.prototype.hideTitle = function() {
        var ele = this.ele,
            titleWrap = ele.getElementsByClassName("title-wrap")[0],
            filterWrap = ele.getElementsByClassName("chart-filter-wrap")[0],
            chartWrap = ele.getElementsByClassName("chart-wrap")[0];

        this.params.showTitle = false;
        this.dashboard.removeClass(this.ele, "show-title");
        chartWrap.style.setProperty("--height", ele.clientHeight - titleWrap.offsetHeight - filterWrap.offsetHeight + "px");
        this.echart.resize();
        this.scroll && this.scroll.destory();
        this.scroll = new Scroll(this, this.ele.getElementsByClassName("chart-wrap-inner")[0]);
    };

    // 显示定位功能
    Chart.prototype.showPos = function() {
        var params = this.params,
            ele = this.ele,
            posWrapTop = ele.getElementsByClassName("pos-top")[0],
            posWrapLeft = ele.getElementsByClassName("pos-left")[0];

        this.resetPos();
        this.dashboard.addClass(ele, posWrapLeft.offsetWidth>params.css.wrap.left?"show-pos-right":"show-pos-left");
        this.dashboard.addClass(ele, posWrapTop.offsetHeight>params.css.wrap.top?"show-pos-bottom":"show-pos-top");
    };

    // 重新获取当前元素的样式信息
    Chart.prototype.resetPos = function() {
        var ele = this.ele,
            params = this.params,
            inputs = [].slice.call(ele.getElementsByClassName("pos-input"), 0);

        inputs.forEach(function(input) {
            switch(input.name.toLowerCase()) {
                case "width":
                params.css.wrap.width = ele.offsetWidth;
                break;
                case "height":
                params.css.wrap.height = ele.offsetHeight;
                break;
                case "left":
                params.css.wrap.left = ele.offsetLeft;
                break;
                case "top":
                params.css.wrap.top = ele.offsetTop;
                break;
            }
    
            input.value = params.css.wrap[input.name];
        });
    };

    // 隐藏定位功能
    Chart.prototype.hidePos = function() {
        this.dashboard.removeClass(this.ele, "show-pos-right");
        this.dashboard.removeClass(this.ele, "show-pos-left");
        this.dashboard.removeClass(this.ele, "show-pos-top");
        this.dashboard.removeClass(this.ele, "show-pos-bottom");
    };

    // 显示设置条
    Chart.prototype.showSetting = function() {
        this.dashboard.addClass(this.ele, "show-setting");
    };

    // 隐藏设置条
    Chart.prototype.hideSetting = function() {
        this.dashboard.removeClass(this.ele, "show-setting");
    };

    // 销毁
    Chart.prototype.destory = function() {
        var self = this;
        var params = this.params;
        this.dashboard.removeChild(params.wrap, this.ele);

        if(void(0)!=params.id) {
            delete this.dashboard._chartMap[params.id];
        }

        this.dashboard._chartList.some(function(chart, index) {
            var flag = (self===chart);

            if(flag) {
                self.dashboard._chartList.splice(index, 1);
            }

            return flag;
        });

        params.deleteCallback && params.deleteCallback.call(self);
    };

    // 设置样式
    Chart.prototype.css = function(p1, p2) {
        if("[object Object]"===toString.call(p1)) {
            for(var key in p1) {
                this.dashboard.css(this.ele, key, p1[key]);
                this.params.css.wrap[key] = p1[key];
            }
        } else {
            this.dashboard.css(this.ele, p1, p2);
            this.params.css.wrap[p1] = p2;
        }

        this.echart.resize();
    };

    // 设置标题样式
    Chart.prototype.cssTitle = function(p1, p2) {
        if("[object Object]"===toString.call(p1)) {
            for(var key in p1) {
                this.dashboard.css(this.ele.getElementsByClassName("title-wrap")[0], key, p1[key]);
                this.params.css.title[key] = p1[key];
            }
        } else {
            this.dashboard.css(this.ele.getElementsByClassName("title-wrap")[0], p1, p2);
            this.params.css.title[p1] = p2;
        }
    };

    // 设置新标题
    Chart.prototype.setTitle = function(text) {
        this.ele.getElementsByClassName("title-wrap")[0].innerHTML = text;
        this.params.title = text;
    };

    // 增加图表的层级
    Chart.prototype.up = function() {
        this.params.zIndex = zIndex;
        this.ele.style.setProperty("z-index", zIndex++);
    };

    window.Chart = window.Chart || Chart;
}(function(type) {
    var obj = {
        0: window.echarts,
        1: window.d3,
        100: window.customComponents
    }

    return obj[type] || window.echarts;
}));