"use strict";
/**
 * Date 2019-5-14
 * Autor Jason
 * Description 看板类，用作生成看板对象，看板中的图表的创建依赖于创建的看板对象，
 * 依赖Util类和Chart类，所以需要先引入util.js和chart.js
 */
(function(Util, Chart, undefined) {
    // 对象形式存储创建的看板对象
    // 用创建看板时传入的参数中的id作为key
    var dashboardMap = {};
    // 数组形式存储创建的看板对象
    var dashboardList = [];
    var url = new URL(location.href);
    var env = url.searchParams.get("env") || (/\benv=(\w*)(?=\b|&)/.test(location.href)?RegExp.$1:"");  // 看板创建页面路径需要加参数env以表示这是在创建看板

    /**
     * 图表拖动类
     * @param   dashboard   Object  看板对象
     */
    function DragBox(dashboard) {
        if(!(this instanceof DragBox)) {
            return new DragBox(dashboard);
        }

        var self = this,
            start = {
                x: 0,
                y: 0
            },
            selected = null,
            chart = null;

        var eventHandle = {
            mousedown: function() {
                var args = [].slice.call(arguments, 0), 
                    e = args[0] || window.event,
                    target = e.target || e.srcElement

                if(dashboard.hasClass(target, "dashboard-item")) {
                    selected = target;
                } else {
                    while(target=target.parentNode) {
                        if(dashboard.hasClass(target, "dashboard-item")) {
                            selected = target;
                            break;
                        } else {
                            if(target===this) break;
                        }
                    }
                }

                if(selected) {
                    chart = dashboard.getChartByElement(selected);
                    if(!chart.dragable) return ;

                    start.x = e.clientX;
                    start.y = e.clientY;
                    chart.up();
                    dashboard.removeClass(xLine, "hide");
                    dashboard.removeClass(yLine, "hide");
                    dashboard.css(xLine, "top", selected.offsetTop + "px");
                    dashboard.css(yLine, "left", selected.offsetLeft + "px");
                    
                    dashboard.addEvent(dashboard.ele, "mousemove", eventHandle.mousemove);
                    dashboard.addEvent(dashboard.ele, "mouseleave", eventHandle.mouseleave);
                    dashboard.addEvent(dashboard.ele, "mouseup", eventHandle.mouseup);
                }                
            },
            mousemove: function() {
                var args = [].slice.call(arguments, 0), 
                    e = args[0] || window.event,
                    vx = e.clientX - start.x,
                    vy = e.clientY - start.y,
                    left = selected.offsetLeft + vx / (dashboard.params.scale || 1),
                    top = selected.offsetTop + vy / (dashboard.params.scale || 1);

                left = Math.max(0, Math.min(left, dashboard.ele.clientWidth - selected.offsetWidth));
                top = Math.max(0, Math.min(top, dashboard.ele.clientHeight - selected.offsetHeight));

                selected.style.setProperty("left", left + "px");
                selected.style.setProperty("top", top + "px");
                chart.resetPos();
                dashboard.css(xLine, "top", selected.offsetTop + "px");
                dashboard.css(yLine, "left", selected.offsetLeft + "px");

                start.x = e.clientX;
                start.y = e.clientY;
            },
            mouseleave: function() {
                selected = null;
                chart = null;
                dashboard.delEvent(dashboard.ele, "mousemove", eventHandle.mousemove);
                dashboard.delEvent(dashboard.ele, "mouseleave", eventHandle.mouseleave);
                dashboard.delEvent(dashboard.ele, "mouseup", eventHandle.mouseup);
                dashboard.delAttr(xLine, "style");
                dashboard.delAttr(yLine, "style");
                dashboard.addClass(xLine, "hide");
                dashboard.addClass(yLine, "hide");
            },
            mouseup: function() {
                selected = null;
                chart = null;
                dashboard.delEvent(dashboard.ele, "mousemove", eventHandle.mousemove);
                dashboard.delEvent(dashboard.ele, "mouseleave", eventHandle.mouseleave);
                dashboard.delEvent(dashboard.ele, "mouseup", eventHandle.mouseup);
                dashboard.delAttr(xLine, "style");
                dashboard.delAttr(yLine, "style");
                dashboard.addClass(xLine, "hide");
                dashboard.addClass(yLine, "hide");
            }
        };

        dashboard.addEvent(dashboard.ele, "mousedown", eventHandle.mousedown);

        var xLine = dashboard.createEle('<div class="measure-line x-line hide"></div>'),
            yLine = dashboard.createEle('<div class="measure-line y-line hide"></div>');

        dashboard.ele.appendChild(xLine);
        dashboard.ele.appendChild(yLine);
    }

    // 看板类
    function Dashboard(params) {
        if(!(this instanceof Dashboard)) {
            return new Dashboard(params);
        }

        Util.call(this);
        this.name = "Dashboard";
        // 声明一个私有对象来存储后面在此看板上创建的图表对象
        // 用创建图表时参数中的id作为key
        this._chartMap = {};
        // 声明一个私有数组来存储后面在此看板上创建的图表对象
        this._chartList = [];
        // 声明一个私有空对象来存储被选中的图表对象
        this._selected = null;
        // 声明一个私有变量存储图表编号
        this._chartNumber = 1;
        // 存储编号与图表的对应关系
        this._chartNumberMap = {};
        var self = this;

        Object.defineProperty(this, "params", {
            get: function() {
                return params;
            }
        });

        if(params.wrap) {
            Object.defineProperty(this, "ele", {
                get: function() {
                    return params.wrap;
                }
            });

            new DragBox(this);
        }

        if(params.websocket && params.websocket.url.replace(/^\s+|\s+$/)) {
            var ws = new WebSocket(params.websocket.url + (/\/$/.test(params.websocket.url)?"":"/") + params.id);

            ws.onopen = function(e) {};

            ws.onmessage = function(e) {
                var data = JSON.parse(e.data);
                self.filter(data.params);
            };

            ws.onclose = function(e) {};

            ws.onerror = function(e) {};

            Object.defineProperty(this, "ws", {
                get: function() {
                    return ws;
                }
            });
        }
    }

    var util = new Util();
    Dashboard.prototype = util;
    Dashboard.prototype.constructor = Dashboard;

    // 为文档对象绑定点击事件
    // 主要用作取消图表的选中状态
    util.addEvent(document, "click", function() {
        dashboardList.forEach(function(dashboard) {
            dashboard.clearSelected();
        });
    });

    /**
     * 初始化图表
     * @param   chartOptions    Object    chart的初始化配置，可选，如果这里不传，可以通过返回的对象的setOption接口传
     * @param   id  String  给chart指定一个唯一键，方便后面查找，可选
     * @param   filters  Array  图表的过滤条件，可选
     * @param   wrap    Node    dom节点，可选,如果创建看板时已经传入了容器,可以不用再次传入
     * @param   time    Number  定时时长，可选
     * @param   filterCallback  Function    过滤回调，当有图表有条件变化时会被调用，变化的条件作为参数被传入，可选
     * @param   timeCallback    Function    定时回调，当有time时，超过time时长会被调用，如果此回调有返回值，返回值会作为参数，调起其它图表的filterCallback，可选
     * @param   click\dblclick\mousedown\mousemove\mouseup\mouseover\mouseout\globalout\contextmenu\mouseenter\mouseleave Function  
     *          事件回调，可选，当事件发生的源是在canvas时回调会被调用两次，回调会接收到两个参数，参数1为0时表示在canvas上触发事件，参数1为1时表示在图表的容器上解的事件
     *          参数2是event
     * @param   css Object  样式
     * @param   settingCallback Function    点击设置的回调
     * @param   showTitle   Boolean 标题是否显示
     * @param   paramMapping    Object  联动
     * @param   title   String  标题
     * @param   dispatchActionType  String  "series", "data"定时选中效果以系列为单位或是以数据为单位
     * @param   seriesIndex Number  当定时选中效果以数据为单时需要此参数告知是哪个系列的数据,
     * @param   type    Number  0&null&undefined表示是echarts图表，1表示d3图表，100表示自定义图表
     * @param   dragable    Boolean 图表是否可以拖动，默认不可拖动
     */
    Dashboard.prototype.initChart = function(params) {
        if(!params.wrap && !this.ele) return ;
        params.env = env || "";
        params.wrap = params.wrap || this.ele;
        var chart = new Chart(this, params);
        this._chartList.push(chart);

        if(void(0)!=params.id) {
            this._chartMap[params.id] = chart;
        }

        return chart;
    };

    // 通过id找chart对象
    Dashboard.prototype.getChartById = function(id) {
        if(void(0)===id) return ;
        return this._chartMap[id];
    };
    
    // 通过索引找chart对象
    Dashboard.prototype.getChartByIndex = function(index) {
        if(void(0)===index) return ;
        return this._chartList[index];
    };

    // 通过索引找chart对象
    Dashboard.prototype.getChartByNumber = function(number) {
        if(void(0)===number) return ;
        return this._chartNumberMap[number];
    };

    // 获取所有图表对象
    Dashboard.prototype.getAllCharts = function() {
        return this._chartList;
    };

    // 通过元素找chart对象
    Dashboard.prototype.getChartByElement = function(ele) {
        var i = 0, len = this._chartList.length;

        do {
            var chart = this._chartList[i];
            if(chart.ele===ele) return chart;
        } while(++i<len);
    };

    // 获取被选中的chart
    Dashboard.prototype.getSelectedChart = function() {
        return this._selected;
    };

    // 外部过滤条件 {key: 1, value: 2, alias: "age"}
    Dashboard.prototype.filter = function(params) {
        this.call(params);
    };

    // 清除被选中的图表
    Dashboard.prototype.clearSelected = function() {
        if(!this._selected) return ;
        this._selected.hidePos();
        this._selected = null;
    };

    // 通过id查找对应的看板
    Dashboard.prototype.getOtherById = function(id) {
        if(void(0)===id) return ;
        return dashboardMap[id];
    };

    // 发送socket消息给某个看板
    Dashboard.prototype.sendMessage = function(to, msg) {
        if(this.ws.readyState!=this.ws.OPEN) return ;

        this.ws.send(JSON.stringify({
            method: "CallOne",
            to: to,
            groupId: "",
            param: {
                from: this.params.id,
                time: new Date().getTime(),
                groupId: "",
                params: msg
            }
        }));
    };

    // 发送socket消息给其它所有看板
    Dashboard.prototype.sendAllMessage = function(msg) {
        this.ws.send(JSON.stringify({
            method: "CallAll",
            groupId: "",
            param: {
                from: this.params.id,
                time: new Date().getTime(),
                groupId: "",
                params: msg
            }
        }));
    };

    // 清除看板中所有的定时器
    Dashboard.prototype.cleanTimer = function() {
        this._chartList.forEach(function(chart) {
            if(chart.time) chart.cleanTimer();
        });
    };

    var dashboard = {
        /**
         * 初始化看板
         * @param   id  String  给看板指定一个唯一键，方便后面查找，可选
         * @param   scale   Number  看板缩放的倍数，可选
         * @param   wrap    Node    看板dom节点，如果图表需要拖动功能，这里需要传入，可选
         */
        init: function(params) {
            var obj = new Dashboard(params);
            dashboardList.push(obj);

            if(void(0)!=params.id) {
                dashboardMap[params.id] = obj;
            }

            return obj;
        },
        // 通过id查找对应的看板
        getDashboardById: function(id) {
            if(void(0)===id) return ;
            return dashboardMap[id];
        },
        // 通过索引查找对应的看板
        getDashboardByIndex: function(index) {
            if(void(0)===index) return ;
            return dashboardList[index];
        },
        // 为图表扩展接口
        // 这里扩展的接口将作用于所有图表
        extendChart: function(name, fn) {
            Chart.prototype[name] = fn;
        },
        // 过滤
        filter: function(params) {
            var self = this;

            if("[object Array]"===toString.call(params)) {
                params.forEach(function(param) {
                    param.outSide = true;
                    var d = self.getDashboardById(param.dashboardId);
                    d.filter(param);
                });
            } else {
                var d = self.getDashboardById(params.dashboardId);
                params.outSide = true;
                d.filter(params);
            }
        }
    };

    window.dashboard = window.dashboard || dashboard;
}(Util, Chart));